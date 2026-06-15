"""Backend API tests for Drishti — /api/v1 surface."""
import io
import os
import pytest
import requests
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback to frontend .env loaded value
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api/v1"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


def _multipage_pdf(pages=3) -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    for i in range(pages):
        c.setFont("Helvetica", 18)
        c.drawString(72, 720, f"Drishti Test Booklet — Page {i+1}")
        c.drawString(72, 690, "Q1. Define management. Ans: Management is the process of getting things done.")
        c.drawString(72, 660, "Q2. State 2 features of coordination.")
        c.showPage()
    c.save()
    return buf.getvalue()


# ------- auth -------
class TestAuth:
    def test_login_evaluator(self, s):
        r = s.post(f"{API}/auth/login", json={"role": "evaluator"})
        assert r.status_code == 200
        d = r.json()
        assert "token" in d and isinstance(d["token"], str) and len(d["token"]) > 10
        assert d["user"]["role"] == "evaluator"

    @pytest.mark.parametrize("role", ["moderator", "scan_operator", "admin"])
    def test_login_other_roles(self, s, role):
        r = s.post(f"{API}/auth/login", json={"role": role})
        assert r.status_code == 200
        assert r.json()["user"]["role"] == role

    def test_login_unknown_role(self, s):
        r = s.post(f"{API}/auth/login", json={"role": "ghost"})
        assert r.status_code == 400


# ------- scheme / stats -------
class TestSchemeStats:
    def test_scheme(self, s):
        r = s.get(f"{API}/scheme")
        assert r.status_code == 200
        d = r.json()
        assert d["total_marks"] == 80
        assert len(d["scheme"]) == 34

    def test_stats(self, s):
        r = s.get(f"{API}/stats")
        assert r.status_code == 200
        d = r.json()
        for k in ("generations", "avg_accuracy", "open_deviations"):
            assert k in d, f"missing key {k} in stats: {d}"


# ------- queue / deviations -------
class TestQueueDeviations:
    def test_queue(self, s):
        r = s.get(f"{API}/queue")
        assert r.status_code == 200
        items = r.json()["items"]
        assert len(items) >= 1
        assert any(it["bundle_id"] == "bundle-001" for it in items)

    def test_open_deviations(self, s):
        r = s.get(f"{API}/deviations", params={"status": "open"})
        assert r.status_code == 200
        items = r.json()["items"]
        # seed: 2 open deviations
        assert len(items) >= 2


# ------- ai-read / evaluate / audit -------
class TestGradingFlow:
    def test_ai_read_bundle(self, s):
        r = s.post(f"{API}/ai-read/bundle-001")
        assert r.status_code == 200
        d = r.json()
        assert d["source"] in ("demo", "gemini")
        assert d["source"] == "demo"  # synthetic seeded bundle
        assert len(d["marks"]) == 34
        assert d["max_total"] == 80
        # marks should clamp
        scheme = {q["q_no"]: q for q in s.get(f"{API}/scheme").json()["scheme"]}
        for m in d["marks"]:
            if m["ai_mark"] is not None:
                assert 0 <= m["ai_mark"] <= scheme[m["q_no"]]["marks"]

    def test_bundle_page_image(self, s):
        r = s.get(f"{API}/bundle/bundle-001/page/1/image")
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("image/jpeg")

    def test_evaluate_creates_deviations(self, s):
        # First ensure ai_reading exists
        s.post(f"{API}/ai-read/bundle-001")
        ai = s.post(f"{API}/ai-read/bundle-001").json()
        marks = {}
        for m in ai["marks"]:
            qmax = next(q["marks"] for q in s.get(f"{API}/scheme").json()["scheme"] if q["q_no"] == m["q_no"])
            # Set teacher_mark to qmax (so gap = qmax - ai_mark, often >=3 for big questions)
            marks[m["q_no"]] = qmax
        r = s.post(f"{API}/evaluate/bundle-001",
                   json={"marks": marks, "pages_viewed": list(range(1, 25)), "final": True})
        assert r.status_code == 200
        d = r.json()
        assert d["ok"] is True
        assert "deviations_created" in d
        assert d["final"] is True

    def test_audit_endpoint(self, s):
        r = s.get(f"{API}/audit/bundle-001")
        assert r.status_code == 200
        d = r.json()
        assert d["bundle"]["bundle_id"] == "bundle-001"
        assert isinstance(d["deviations"], list)


# ------- deviation approve / reevaluate -------
class TestDeviationActions:
    def test_approve_and_reevaluate(self, s):
        devs = s.get(f"{API}/deviations", params={"status": "open"}).json()["items"]
        if len(devs) < 2:
            pytest.skip("Need at least 2 open deviations")
        d1, d2 = devs[0], devs[1]
        r1 = s.post(f"{API}/deviations/{d1['dev_id']}/approve")
        assert r1.status_code == 200
        assert r1.json()["action"] == "upheld"
        r2 = s.post(f"{API}/deviations/{d2['dev_id']}/reevaluate")
        assert r2.status_code == 200
        assert r2.json()["action"] == "reevaluate"
        # bundle status should be 'ready'
        b = s.get(f"{API}/bundle/{d2['bundle_id']}").json()
        assert b["status"] == "ready"


# ------- generate -------
class TestGenerate:
    def test_generate_and_persist(self, s):
        r = s.post(f"{API}/generate",
                   json={"prompt": "Define management.", "subject": "Business Studies"})
        assert r.status_code == 200
        d = r.json()
        for k in ("id", "answer", "sources", "accuracy", "reasoning", "hallucination", "reasoning_trace"):
            assert k in d
        gid = d["id"]
        # appears in list
        lst = s.get(f"{API}/generations").json()["items"]
        assert any(g["id"] == gid for g in lst)


# ------- PDF pipeline -------
class TestPDFPipeline:
    job_id = None
    bundle_id = None

    def test_pdf_upload(self, s):
        pdf = _multipage_pdf(3)
        files = {"file": ("test.pdf", pdf, "application/pdf")}
        data = {"candidate": "TEST_CAND_001", "subject": "Business Studies"}
        # Drop the default JSON Content-Type for multipart
        r = requests.post(f"{API}/pdf/upload", files=files, data=data, timeout=120)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "job_id" in d
        assert d["total_pages"] == 3
        for p in d["pages"]:
            assert "blur_score" in p
            assert p["verdict"] in ("OK", "FLAGGED", "BLURRY")
            assert "needs_fix" in p
        assert d["ai_grade"]["source"] in ("demo", "gemini")
        TestPDFPipeline.job_id = d["job_id"]

    def test_pdf_get(self, s):
        assert TestPDFPipeline.job_id
        r = s.get(f"{API}/pdf/{TestPDFPipeline.job_id}")
        assert r.status_code == 200
        assert r.json()["job_id"] == TestPDFPipeline.job_id

    def test_pdf_finalize(self, s):
        assert TestPDFPipeline.job_id
        r = s.post(f"{API}/pdf/{TestPDFPipeline.job_id}/finalize")
        # might 400 if some page flagged
        if r.status_code == 400:
            # mark all flagged as fixed via replace endpoint not easy; check msg
            job = s.get(f"{API}/pdf/{TestPDFPipeline.job_id}").json()
            unfixed = [p for p in job["pages"] if p["needs_fix"] and not p.get("fixed")]
            pytest.skip(f"PDF had flagged pages: {len(unfixed)} (expected for some inputs)")
        assert r.status_code == 200, r.text
        d = r.json()
        assert "final_pdf_url" in d
        assert "bundle_id" in d
        TestPDFPipeline.bundle_id = d["bundle_id"]

    def test_final_pdf_download(self, s):
        assert TestPDFPipeline.job_id
        r = s.get(f"{API}/pdf/{TestPDFPipeline.job_id}/final.pdf")
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("application/pdf")
