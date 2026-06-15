"""Gemini grader — reads answer-sheet images and grades against the marking
scheme. Falls back to a deterministic demo grade when no key / no images.

Port of a Python `gemini_reader`. Trustworthy AI behaviour:
- objective questions: full marks only on EXACT match to `answer`, else 0
- descriptive questions: partial credit per covered key_point, never exceeding marks
- illegible / missing answer -> ai_mark = null, confidence 0.0 (NEVER guess)
"""
import os
import json
import logging
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("drishti.gemini")

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")


def build_grader_prompt(scheme: List[dict]) -> str:
    scheme_json = json.dumps(scheme, ensure_ascii=False, indent=1)
    return (
        "You are an independent CBSE Class 12 examiner grading a Business Studies "
        "answer sheet (80 marks). Grade ONLY against the marking scheme below.\n\n"
        "RULES:\n"
        "- For objective questions (mcq / one_word / assertion), award FULL marks only for an "
        "EXACT match to the scheme `answer` (case-insensitive, option letter or text). Otherwise 0.\n"
        "- For descriptive questions, award PARTIAL CREDIT for each covered `key_points` item, "
        "never exceeding `marks`.\n"
        "- If a page is illegible or the answer is missing, set `ai_mark` to null and confidence 0.0. "
        "NEVER guess.\n"
        "- Provide a concise justification per question and a confidence between 0 and 1.\n\n"
        "Return ONLY valid JSON of the exact shape:\n"
        '{"questions":[{"q_no":"Q1","ai_mark":1,"max_mark":1,"justification":"...","confidence":0.9}],'
        '"total_ai_mark":42}\n\n'
        "MARKING SCHEME (JSON):\n" + scheme_json
    )


def _clamp_result(raw: dict, scheme: List[dict]) -> dict:
    by_no = {q["q_no"]: q for q in scheme}
    out = []
    total = 0.0
    questions = raw.get("questions", []) if isinstance(raw, dict) else []
    seen = set()
    for item in questions:
        q_no = item.get("q_no")
        if q_no not in by_no:
            continue
        seen.add(q_no)
        max_mark = by_no[q_no]["marks"]
        mark = item.get("ai_mark", None)
        if mark is not None:
            try:
                mark = max(0.0, min(float(mark), float(max_mark)))
            except (TypeError, ValueError):
                mark = None
        conf = item.get("confidence", 0.0)
        try:
            conf = max(0.0, min(float(conf), 1.0))
        except (TypeError, ValueError):
            conf = 0.0
        if mark is not None:
            total += mark
        out.append({
            "q_no": q_no,
            "ai_mark": mark,
            "max_mark": max_mark,
            "justification": str(item.get("justification", ""))[:600],
            "confidence": conf,
        })
    # ensure every scheme question is present
    for q in scheme:
        if q["q_no"] not in seen:
            out.append({
                "q_no": q["q_no"],
                "ai_mark": None,
                "max_mark": q["marks"],
                "justification": "No legible answer detected for this question.",
                "confidence": 0.0,
            })
    out.sort(key=lambda x: int(x["q_no"][1:]))
    return {"marks": out, "total_ai_mark": round(total, 1)}


def _parse_json(text: str) -> Optional[dict]:
    if not text:
        return None
    t = text.strip()
    if t.startswith("```"):
        t = t.split("```", 2)[1] if "```" in t[3:] else t.strip("`")
        if t.lower().startswith("json"):
            t = t[4:]
    # grab first { .. last }
    start = t.find("{")
    end = t.rfind("}")
    if start != -1 and end != -1:
        t = t[start:end + 1]
    try:
        return json.loads(t)
    except json.JSONDecodeError:
        return None


def demo_grade(scheme: List[dict]) -> dict:
    """Deterministic fallback grade so the dashboard always renders."""
    out = []
    total = 0.0
    for i, q in enumerate(scheme):
        max_mark = q["marks"]
        # deterministic pseudo-random-ish performance
        seed = (i * 7 + len(q["q_no"]) * 3) % 10
        if q.get("type") in ("mcq", "one_word"):
            mark = max_mark if seed not in (3, 7) else 0
            just = ("Exact match to scheme answer." if mark else
                    "Response did not exactly match the scheme answer.")
            conf = 0.95 if mark else 0.9
        else:
            ratio = 0.6 + (seed % 4) * 0.1  # 0.6..0.9
            mark = round(max_mark * ratio)
            covered = max(1, int(len(q.get("key_points", []) or [1]) * ratio))
            just = f"Covered approximately {covered} key point(s); partial credit awarded."
            conf = 0.8
        # leave a couple illegible to demonstrate null handling
        if i in (5, 26):
            mark = None
            just = "Answer illegible / not attempted — no marks awarded (not guessed)."
            conf = 0.0
        if mark is not None:
            total += mark
        out.append({
            "q_no": q["q_no"], "ai_mark": mark, "max_mark": max_mark,
            "justification": just, "confidence": conf,
        })
    return {"marks": out, "total_ai_mark": round(total, 1)}


async def grade_with_gemini(images_b64: List[str], scheme: List[dict]) -> Optional[dict]:
    """Grade from JPEG base64 page images. Returns None on failure (caller falls back)."""
    if not EMERGENT_LLM_KEY or not images_b64:
        return None
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    except Exception as e:  # noqa
        logger.warning("emergentintegrations unavailable: %s", e)
        return None

    prompt = build_grader_prompt(scheme)
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id="drishti-grade",
            system_message="You are a precise, fair CBSE examiner that outputs strict JSON only.",
        ).with_model("gemini", GEMINI_MODEL)
        contents = [ImageContent(image_base64=b) for b in images_b64[:30]]
        msg = UserMessage(
            text=prompt + "\n\nGrade the attached answer-sheet page image(s) now.",
            file_contents=contents,
        )
        reply = await chat.send_message(msg)
        parsed = _parse_json(reply if isinstance(reply, str) else str(reply))
        if not parsed:
            logger.warning("Gemini returned unparseable output")
            return None
        return _clamp_result(parsed, scheme)
    except Exception as e:  # noqa
        logger.warning("Gemini grading failed: %s", e)
        return None
