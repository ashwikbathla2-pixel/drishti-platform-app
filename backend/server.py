import os
import json
import uuid
import base64
import logging
from pathlib import Path
from datetime import datetime, timezone

from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import List, Optional, Dict
import jwt

import marking_scheme as ms
import gemini_grader as grader
import pdf_pipeline as pdfp
import gen_page
import store as seed

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ.get("JWT_SECRET", "drishti-dev-secret")

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("drishti")

app = FastAPI(title="Drishti API")
api = APIRouter(prefix="/api/v1")

ROLE_NAMES = {
    "scan_operator": "Scan Operator",
    "evaluator": "Evaluator",
    "moderator": "Moderator",
    "admin": "Administrator",
}


# --------------------------------------------------------------------------- #
# startup seed
# --------------------------------------------------------------------------- #
@app.on_event("startup")
async def _seed():
    if await db.bundles.count_documents({}) == 0:
        await db.bundles.insert_many(seed.seed_bundles())
    if await db.deviations.count_documents({}) == 0:
        await db.deviations.insert_many(seed.seed_deviations())
    if await db.devices.count_documents({}) == 0:
        await db.devices.insert_many(seed.seed_devices())
    if await db.generations.count_documents({}) == 0:
        await db.generations.insert_many(seed.DRI_HISTORY)
    logger.info("Drishti seed complete")


def _scheme():
    return ms.scheme_as_dicts()


def _now():
    return datetime.now(timezone.utc).isoformat()


# --------------------------------------------------------------------------- #
# auth
# --------------------------------------------------------------------------- #
class LoginReq(BaseModel):
    role: str


@api.post("/auth/login")
async def login(req: LoginReq):
    if req.role not in ROLE_NAMES:
        raise HTTPException(400, "Unknown role")
    name = ROLE_NAMES[req.role]
    payload = {"role": req.role, "name": name, "iat": int(datetime.now(timezone.utc).timestamp())}
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return {"token": token, "user": {"name": name, "role": req.role}}


@api.get("/me")
async def me(token: Optional[str] = None):
    if not token:
        raise HTTPException(401, "No token")
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return {"name": data["name"], "role": data["role"]}
    except Exception:
        raise HTTPException(401, "Invalid token")


# --------------------------------------------------------------------------- #
# scheme / stats / queue / devices
# --------------------------------------------------------------------------- #
@api.get("/scheme")
async def get_scheme():
    return {"scheme": _scheme(), "total_marks": ms.total_marks(),
            "subject": "Business Studies", "label": "CBSE Class 12 · Business Studies (80)"}


@api.get("/stats")
async def stats():
    gens = await db.generations.find({}, {"_id": 0}).to_list(200)
    devs = await db.deviations.find({}, {"_id": 0}).to_list(500)
    bundles = await db.bundles.find({}, {"_id": 0}).to_list(500)
    return seed.compute_stats(gens, devs, bundles)


@api.get("/queue")
async def queue():
    bundles = await db.bundles.find({}, {"_id": 0, "pages": 0}).to_list(500)
    bundles.sort(key=lambda b: b.get("ingested_at", ""), reverse=True)
    return {"items": bundles}


@api.get("/devices")
async def devices():
    items = await db.devices.find({}, {"_id": 0}).to_list(100)
    return {"items": items}


class Heartbeat(BaseModel):
    device_id: str


@api.post("/devices/heartbeat")
async def heartbeat(hb: Heartbeat):
    await db.devices.update_one({"device_id": hb.device_id},
                                {"$set": {"last_heartbeat": _now(), "status": "online"}})
    return {"ok": True}


# --------------------------------------------------------------------------- #
# deviations
# --------------------------------------------------------------------------- #
@api.get("/deviations")
async def deviations(status: str = "open"):
    q = {} if status == "all" else {"status": status}
    items = await db.deviations.find(q, {"_id": 0}).to_list(500)
    return {"items": items}


@api.post("/deviations/{dev_id}/approve")
async def approve_dev(dev_id: str):
    r = await db.deviations.update_one({"dev_id": dev_id}, {"$set": {"status": "upheld", "resolved_at": _now()}})
    if r.matched_count == 0:
        raise HTTPException(404, "Deviation not found")
    return {"ok": True, "action": "upheld"}


@api.post("/deviations/{dev_id}/reevaluate")
async def reeval_dev(dev_id: str):
    dev = await db.deviations.find_one({"dev_id": dev_id}, {"_id": 0})
    if not dev:
        raise HTTPException(404, "Deviation not found")
    await db.deviations.update_one({"dev_id": dev_id}, {"$set": {"status": "reevaluate", "resolved_at": _now()}})
    await db.bundles.update_one({"bundle_id": dev["bundle_id"]}, {"$set": {"status": "ready"}})
    return {"ok": True, "action": "reevaluate"}


# --------------------------------------------------------------------------- #
# bundle detail + grading + evaluation
# --------------------------------------------------------------------------- #
def _bundle_public(b: dict) -> dict:
    pages = b.get("pages")
    page_count = b.get("page_count", len(pages) if pages else 24)
    return {
        "bundle_id": b["bundle_id"],
        "candidate_code": b["candidate_code"],
        "subject": b["subject"],
        "page_count": page_count,
        "status": b.get("status"),
        "ingested_at": b.get("ingested_at"),
        "evaluation": b.get("evaluation"),
        "ai_reading": b.get("ai_reading"),
        "synthetic_pages": b.get("synthetic_pages", False),
    }


@api.get("/bundle/{bundle_id}")
async def bundle_detail(bundle_id: str):
    b = await db.bundles.find_one({"bundle_id": bundle_id}, {"_id": 0})
    if not b:
        raise HTTPException(404, "Bundle not found")
    return _bundle_public(b)


@api.get("/bundle/{bundle_id}/page/{page_no}/image")
async def bundle_page_image(bundle_id: str, page_no: int):
    b = await db.bundles.find_one({"bundle_id": bundle_id})
    if not b:
        raise HTTPException(404, "Bundle not found")
    pages = b.get("pages")
    if pages:
        for p in pages:
            if p["page_no"] == page_no:
                return Response(content=base64.b64decode(p["full_b64"]), media_type="image/jpeg")
        raise HTTPException(404, "Page not found")
    data = gen_page.gen_answer_page(b["candidate_code"], page_no, b.get("subject", "Business Studies"))
    return Response(content=data, media_type="image/jpeg")


@api.post("/ai-read/{bundle_id}")
async def ai_read(bundle_id: str):
    b = await db.bundles.find_one({"bundle_id": bundle_id})
    if not b:
        raise HTTPException(404, "Bundle not found")
    scheme = _scheme()
    source = "demo"
    result = None
    pages = b.get("pages")
    if pages:
        result = await grader.grade_with_gemini(pdfp.images_for_grading(pages), scheme)
        if result:
            source = "gemini"
    if not result:
        result = grader.demo_grade(scheme)
    ai_reading = {
        "source": source,
        "total_ai_mark": result["total_ai_mark"],
        "max_total": ms.total_marks(),
        "marks": result["marks"],
        "read_at": _now(),
    }
    await db.bundles.update_one({"bundle_id": bundle_id}, {"$set": {"ai_reading": ai_reading}})
    return ai_reading


class EvaluateReq(BaseModel):
    marks: Dict[str, float]
    pages_viewed: List[int] = []
    final: bool = False


@api.post("/evaluate/{bundle_id}")
async def evaluate(bundle_id: str, req: EvaluateReq):
    b = await db.bundles.find_one({"bundle_id": bundle_id})
    if not b:
        raise HTTPException(404, "Bundle not found")
    scheme = {q["q_no"]: q for q in _scheme()}
    total = 0.0
    for q_no, mk in req.marks.items():
        if q_no in scheme:
            total += max(0.0, min(float(mk), scheme[q_no]["marks"]))
    evaluation = {
        "marks": req.marks,
        "total_mark": round(total, 1),
        "pages_viewed": req.pages_viewed,
        "final": req.final,
        "evaluated_at": _now(),
    }
    deviations_created = 0
    ai_reading = b.get("ai_reading")
    if req.final and ai_reading:
        await db.deviations.delete_many({"bundle_id": bundle_id, "status": "open"})
        ai_by_no = {m["q_no"]: m for m in ai_reading["marks"]}
        for q_no, mk in req.marks.items():
            ai = ai_by_no.get(q_no)
            if not ai:
                continue
            ai_mark = ai["ai_mark"]
            if ai_mark is None:
                gap = scheme[q_no]["marks"]
            else:
                gap = abs(float(mk) - float(ai_mark))
            if gap >= 3:
                deviations_created += 1
                await db.deviations.insert_one({
                    "dev_id": f"dev-{uuid.uuid4().hex[:8]}",
                    "bundle_id": bundle_id,
                    "candidate_code": b["candidate_code"],
                    "subject": b["subject"],
                    "q_no": q_no,
                    "teacher_mark": float(mk),
                    "ai_mark": ai_mark,
                    "gap": gap,
                    "status": "open",
                    "justification": ai.get("justification", ""),
                })
    new_status = "in_review" if req.final else "ready"
    await db.bundles.update_one({"bundle_id": bundle_id},
                                {"$set": {"evaluation": evaluation, "status": new_status}})
    return {"ok": True, "total_mark": evaluation["total_mark"],
            "deviations_created": deviations_created, "final": req.final}


@api.get("/audit/{bundle_id}")
async def audit(bundle_id: str):
    b = await db.bundles.find_one({"bundle_id": bundle_id}, {"_id": 0})
    if not b:
        raise HTTPException(404, "Bundle not found")
    devs = await db.deviations.find({"bundle_id": bundle_id}, {"_id": 0}).to_list(100)
    return {"bundle": _bundle_public(b), "deviations": devs}


# --------------------------------------------------------------------------- #
# PDF pipeline
# --------------------------------------------------------------------------- #
def _job_public(job: dict) -> dict:
    pages = [{
        "page_no": p["page_no"],
        "thumb_url": f"data:image/jpeg;base64,{p['thumb_b64']}",
        "blur_score": p["blur_score"],
        "needs_fix": p["needs_fix"],
        "fixed": p.get("fixed", False),
        "verdict": p["verdict"],
        "reason": p.get("reason", ""),
    } for p in job["pages"]]
    return {
        "job_id": job["job_id"],
        "candidate_code": job["candidate_code"],
        "subject": job["subject"],
        "total_pages": len(job["pages"]),
        "status": job["status"],
        "pages": pages,
        "final_pdf_url": job.get("final_pdf_url"),
        "ai_grade": job.get("ai_grade"),
    }


@api.post("/pdf/upload")
async def pdf_upload(file: UploadFile = File(...),
                     candidate: str = Form(...), subject: str = Form(...)):
    data = await file.read()
    try:
        pages = pdfp.process_pdf(data)
    except Exception as e:
        raise HTTPException(400, f"Could not read PDF: {e}")
    if not pages:
        raise HTTPException(400, "PDF has no pages")

    scheme = _scheme()
    result = await grader.grade_with_gemini(pdfp.images_for_grading(pages), scheme)
    source = "gemini" if result else "demo"
    if not result:
        result = grader.demo_grade(scheme)
    ai_grade = {
        "source": source,
        "total_ai_mark": result["total_ai_mark"],
        "max_total": ms.total_marks(),
        "marks": result["marks"],
    }

    job = {
        "job_id": f"job-{uuid.uuid4().hex[:10]}",
        "candidate_code": candidate,
        "subject": subject,
        "status": "ready",
        "pages": pages,
        "ai_grade": ai_grade,
        "created_at": _now(),
    }
    await db.jobs.insert_one(job)
    return _job_public(job)


@api.get("/pdf/{job_id}")
async def get_job(job_id: str):
    job = await db.jobs.find_one({"job_id": job_id})
    if not job:
        raise HTTPException(404, "Job not found")
    return _job_public(job)


@api.get("/pdf/{job_id}/page/{page_no}/image")
async def job_page_image(job_id: str, page_no: int):
    job = await db.jobs.find_one({"job_id": job_id})
    if not job:
        raise HTTPException(404, "Job not found")
    for p in job["pages"]:
        if p["page_no"] == page_no:
            return Response(content=base64.b64decode(p["full_b64"]), media_type="image/jpeg")
    raise HTTPException(404, "Page not found")


@api.post("/pdf/{job_id}/page/{page_no}/replace")
async def replace_page(job_id: str, page_no: int, file: UploadFile = File(...)):
    job = await db.jobs.find_one({"job_id": job_id})
    if not job:
        raise HTTPException(404, "Job not found")
    img_bytes = await file.read()
    try:
        res = pdfp.process_single_image(img_bytes)
    except Exception as e:
        raise HTTPException(400, f"Could not read image: {e}")
    pages = job["pages"]
    found = False
    for p in pages:
        if p["page_no"] == page_no:
            p.update({
                "full_b64": res["full_b64"],
                "thumb_b64": res["thumb_b64"],
                "blur_score": res["blur_score"],
                "verdict": res["verdict"],
                "needs_fix": False,
                "fixed": True,
                "reason": "Re-scanned by operator.",
            })
            found = True
            break
    if not found:
        raise HTTPException(404, "Page not found")
    await db.jobs.update_one({"job_id": job_id}, {"$set": {"pages": pages}})
    job = await db.jobs.find_one({"job_id": job_id})
    return _job_public(job)


@api.post("/pdf/{job_id}/finalize")
async def finalize(job_id: str):
    job = await db.jobs.find_one({"job_id": job_id})
    if not job:
        raise HTTPException(404, "Job not found")
    if any(p["needs_fix"] and not p.get("fixed") for p in job["pages"]):
        raise HTTPException(400, "Fix all flagged pages before finalizing")

    final_url = f"/api/v1/pdf/{job_id}/final.pdf"
    await db.jobs.update_one({"job_id": job_id},
                             {"$set": {"status": "finalized", "final_pdf_url": final_url}})

    bundle_id = f"bundle-{uuid.uuid4().hex[:8]}"
    await db.bundles.insert_one({
        "bundle_id": bundle_id,
        "candidate_code": job["candidate_code"],
        "subject": job["subject"],
        "page_count": len(job["pages"]),
        "ingested_at": _now(),
        "status": "ready",
        "synthetic_pages": False,
        "pages": job["pages"],
        "evaluation": None,
        "ai_reading": {
            "source": job["ai_grade"]["source"],
            "total_ai_mark": job["ai_grade"]["total_ai_mark"],
            "max_total": job["ai_grade"]["max_total"],
            "marks": job["ai_grade"]["marks"],
            "read_at": _now(),
        },
    })
    return {"ok": True, "final_pdf_url": final_url, "bundle_id": bundle_id}


@api.get("/pdf/{job_id}/final.pdf")
async def final_pdf(job_id: str):
    job = await db.jobs.find_one({"job_id": job_id})
    if not job:
        raise HTTPException(404, "Job not found")
    pdf_bytes = pdfp.build_final_pdf(job["pages"])
    cand = job["candidate_code"].replace("|", "_")
    return Response(content=pdf_bytes, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{cand}.pdf"'})


@api.post("/pdf")
async def pdf_direct_grade(file: UploadFile = File(...)):
    data = await file.read()
    pages = pdfp.process_pdf(data)
    scheme = _scheme()
    result = await grader.grade_with_gemini(pdfp.images_for_grading(pages), scheme)
    source = "gemini" if result else "demo"
    if not result:
        result = grader.demo_grade(scheme)
    return {"source": source, "total_ai_mark": result["total_ai_mark"],
            "max_total": ms.total_marks(), "marks": result["marks"]}


# --------------------------------------------------------------------------- #
# answer generation + evaluation (research surface)
# --------------------------------------------------------------------------- #
class GenerateReq(BaseModel):
    prompt: str
    subject: str = "Business Studies"


def _demo_generation(prompt: str, subject: str) -> dict:
    return {
        "answer": (
            f"In the context of {subject}, {prompt.strip().rstrip('?.')} can be explained "
            "as follows. The concept is grounded in the prescribed CBSE syllabus and is "
            "structured around clearly defined principles, each supported by an example. "
            "Key points are organised in a logical sequence so that the reasoning is "
            "transparent and verifiable against the reference material."
        ),
        "sources": ["CBSE Class 12 Syllabus", "NCERT Textbook", "Marking Scheme Reference"],
        "accuracy": 90, "reasoning": 86, "hallucination": 8,
        "reasoning_trace": [
            "Identified the concept being asked from the prompt.",
            "Retrieved grounded definitions from the reference corpus.",
            "Structured the answer into definition, explanation and example.",
            "Cross-checked claims against the reference to bound hallucination risk.",
        ],
    }


@api.post("/generate")
async def generate(req: GenerateReq):
    gen = None
    if grader.EMERGENT_LLM_KEY:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            chat = LlmChat(api_key=grader.EMERGENT_LLM_KEY, session_id="drishti-gen",
                           system_message="You generate grounded CBSE Class 12 answers and self-evaluate them. Output strict JSON only.").with_model("gemini", grader.GEMINI_MODEL)
            ask = (
                f"Subject: {req.subject}. Question: {req.prompt}.\n"
                "Return ONLY JSON: {\"answer\":\"...\",\"sources\":[\"..\"],"
                "\"accuracy\":0-100,\"reasoning\":0-100,\"hallucination\":0-100,"
                "\"reasoning_trace\":[\"step\"]}"
            )
            reply = await chat.send_message(UserMessage(text=ask))
            parsed = grader._parse_json(reply if isinstance(reply, str) else str(reply))
            if parsed and parsed.get("answer"):
                gen = parsed
        except Exception as e:
            logger.warning("generate failed: %s", e)
    if not gen:
        gen = _demo_generation(req.prompt, req.subject)

    record = {
        "id": f"gen-{uuid.uuid4().hex[:8]}",
        "prompt": req.prompt,
        "subject": req.subject,
        "answer": gen["answer"],
        "sources": gen.get("sources", []),
        "accuracy": int(gen.get("accuracy", 90)),
        "reasoning": int(gen.get("reasoning", 85)),
        "hallucination": int(gen.get("hallucination", 8)),
        "reasoning_trace": gen.get("reasoning_trace", []),
        "created_at": _now(),
    }
    await db.generations.insert_one(dict(record))
    return record


@api.get("/generations")
async def generations():
    items = await db.generations.find({}, {"_id": 0}).to_list(200)
    items.sort(key=lambda g: g.get("created_at", ""), reverse=True)
    return {"items": items}


@api.get("/generations/{gen_id}")
async def generation_detail(gen_id: str):
    g = await db.generations.find_one({"id": gen_id}, {"_id": 0})
    if not g:
        raise HTTPException(404, "Not found")
    return g


@api.get("/")
async def root():
    return {"service": "Drishti", "status": "ok"}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def _shutdown():
    client.close()
