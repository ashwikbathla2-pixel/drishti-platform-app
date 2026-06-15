"""Deterministic synthetic 'scanned answer page' generator (PIL) used to give the
booklet viewer something real to display for seeded demo bundles.
"""
import io
import base64
import hashlib
import textwrap
from PIL import Image, ImageDraw, ImageFont


def _font(size: int):
    for path in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ):
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    return ImageFont.load_default()


def gen_answer_page(candidate_code: str, page_no: int, subject: str = "Business Studies") -> bytes:
    W, H = 900, 1180
    img = Image.new("RGB", (W, H), (244, 241, 233))
    d = ImageDraw.Draw(img)

    # subtle paper grain via deterministic dots
    seed = int(hashlib.md5(f"{candidate_code}-{page_no}".encode()).hexdigest(), 16)
    rnd = seed
    def nxt():
        nonlocal rnd
        rnd = (1103515245 * rnd + 12345) & 0x7fffffff
        return rnd
    for _ in range(1400):
        x = nxt() % W
        y = nxt() % H
        shade = 225 + (nxt() % 18)
        d.point((x, y), fill=(shade, shade - 4, shade - 12))

    # header band
    d.rectangle([0, 0, W, 96], fill=(232, 227, 216))
    d.line([0, 96, W, 96], fill=(150, 140, 120), width=2)
    fb = _font(26)
    fs = _font(18)
    d.text((34, 24), "CBSE CLASS XII  ·  ANSWER BOOKLET", font=fb, fill=(40, 36, 30))
    d.text((34, 60), f"{subject}   |   {candidate_code}", font=fs, fill=(80, 72, 60))
    d.text((W - 150, 36), f"PAGE {page_no:02d}", font=fb, fill=(60, 54, 46))

    # ruled lines
    y = 150
    fline = _font(22)
    handwriting = [
        "Ans. Planning is the primary function of management which",
        "involves setting objectives and deciding in advance the",
        "course of action. It provides direction and reduces the",
        "risk of uncertainty in the organisation.",
        "",
        "It bridges the gap between where we are and where we",
        "want to reach. Standards set during planning act as the",
        "basis of the controlling function of management.",
        "",
        "The principles given by Henri Fayol such as Unity of",
        "Command and Unity of Direction guide managers in",
        "organising the work efficiently across departments.",
    ]
    fh = _font(24)
    idx = (page_no - 1) % len(handwriting)
    for i in range(22):
        d.line([34, y, W - 34, y], fill=(205, 199, 188), width=1)
        if i % 2 == 0 and idx < len(handwriting):
            d.text((44, y - 30), handwriting[idx], font=fh, fill=(28, 40, 90))
            idx += 1
        y += 46

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=80)
    return buf.getvalue()


def _outcome(candidate_code: str, q_no: str) -> str:
    """Deterministic per-candidate, per-question outcome: mostly 'full'."""
    h = int(hashlib.md5(f"{candidate_code}-{q_no}".encode()).hexdigest(), 16)
    r = h % 10
    if r in (0,):
        return "blank"      # ~10% not attempted -> 0 / null
    if r in (1, 2):
        return "partial"    # ~20% partial credit
    return "full"           # ~70% correct / full


def _student_answer(q: dict, outcome: str) -> str:
    """Build the candidate's written answer for one scheme question."""
    qtype = q.get("type")
    if outcome == "blank":
        return "Not attempted."
    if qtype in ("mcq", "one_word"):
        correct = (q.get("answer") or "").strip()
        if outcome == "full":
            if q.get("options") and correct in q["options"]:
                return f"({correct}) {q['options'][correct]}"
            return correct
        # wrong answer
        if q.get("options"):
            for k, v in q["options"].items():
                if k != correct:
                    return f"({k}) {v}"
        return "Don't know"
    # descriptive
    kps = q.get("key_points") or []
    if not kps:
        return "Answer based on the prescribed concept with relevant explanation."
    take = len(kps) if outcome == "full" else max(1, len(kps) // 2)
    pts = kps[:take]
    return ". ".join(pts) + "."


def build_demo_answer_pages(candidate_code: str, scheme: list, subject: str = "Business Studies"):
    """Render the candidate's REAL Business Studies answers (deterministic, mostly
    correct) across several JPEG pages, returned as base64 strings. Gemini reads
    these and grades them against the scheme -> a realistic score out of 80."""
    W, H = 900, 1180
    fb = _font(24)
    fq = _font(20)
    fa = _font(21)
    margin = 40
    line_h = 30
    pages_b64 = []

    def new_page(page_no):
        img = Image.new("RGB", (W, H), (245, 242, 234))
        d = ImageDraw.Draw(img)
        d.rectangle([0, 0, W, 84], fill=(232, 227, 216))
        d.line([0, 84, W, 84], fill=(150, 140, 120), width=2)
        d.text((margin, 20), "CBSE CLASS XII  ·  ANSWER BOOKLET", font=fb, fill=(40, 36, 30))
        d.text((margin, 52), f"{subject}  |  {candidate_code}", font=_font(15), fill=(80, 72, 60))
        d.text((W - 150, 30), f"PAGE {page_no:02d}", font=fb, fill=(60, 54, 46))
        return img, d

    page_no = 1
    img, d = new_page(page_no)
    y = 110

    def flush():
        nonlocal pages_b64
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=78)
        pages_b64.append(base64.b64encode(buf.getvalue()).decode())

    for q in scheme:
        outcome = _outcome(candidate_code, q["q_no"])
        ans = _student_answer(q, outcome)
        wrapped = textwrap.wrap(ans, width=80) or [""]
        block_h = line_h + len(wrapped) * line_h + 16
        if y + block_h > H - 40:
            flush()
            page_no += 1
            img, d = new_page(page_no)
            y = 110
        d.text((margin, y), f"{q['q_no']}.  [{q['marks']} mark]", font=fq, fill=(90, 70, 30))
        y += line_h
        for ln in wrapped:
            d.text((margin + 24, y), ln, font=fa, fill=(28, 40, 90))
            y += line_h
        y += 16

    flush()
    return pages_b64
