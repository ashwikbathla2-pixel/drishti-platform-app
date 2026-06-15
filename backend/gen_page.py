"""Deterministic synthetic 'scanned answer page' generator (PIL) used to give the
booklet viewer something real to display for seeded demo bundles.
"""
import io
import hashlib
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
