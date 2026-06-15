"""PDF scan pipeline — rasterize pages, compute a variance-of-Laplacian
sharpness score, build thumbnails, replace pages, and assemble a final PDF.
"""
import io
import base64
import logging
from typing import List, Tuple

import fitz  # PyMuPDF
import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger("drishti.pdf")

# sharpness thresholds (variance of Laplacian on rendered grayscale)
BLURRY_BELOW = 80.0
FLAGGED_BELOW = 170.0


def _laplacian_variance(pil_img: Image.Image) -> float:
    gray = np.array(pil_img.convert("L"))
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def _verdict(score: float) -> Tuple[str, bool, str]:
    if score < BLURRY_BELOW:
        return "BLURRY", True, "Page is too blurry / out of focus to read reliably."
    if score < FLAGGED_BELOW:
        return "FLAGGED", True, "Low sharpness — text may be partially obscured. Re-shoot recommended."
    return "OK", False, ""


def _to_jpeg_b64(pil_img: Image.Image, max_w: int, quality: int) -> str:
    img = pil_img
    if img.width > max_w:
        ratio = max_w / img.width
        img = img.resize((max_w, int(img.height * ratio)))
    buf = io.BytesIO()
    img.convert("RGB").save(buf, format="JPEG", quality=quality)
    return base64.b64encode(buf.getvalue()).decode()


def process_pdf(pdf_bytes: bytes) -> List[dict]:
    """Return a list of page dicts: page_no, full_b64, thumb_b64, blur_score,
    needs_fix, fixed, verdict, reason."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages = []
    for i, page in enumerate(doc):
        pix = page.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))
        pil = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        score = round(_laplacian_variance(pil), 1)
        verdict, needs_fix, reason = _verdict(score)
        pages.append({
            "page_no": i + 1,
            "full_b64": _to_jpeg_b64(pil, 1100, 82),
            "thumb_b64": _to_jpeg_b64(pil, 180, 60),
            "blur_score": score,
            "needs_fix": needs_fix,
            "fixed": False,
            "verdict": verdict,
            "reason": reason,
        })
    doc.close()
    return pages


def process_single_image(img_bytes: bytes) -> dict:
    """Used when an operator re-shoots a single page (image upload)."""
    pil = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    score = round(_laplacian_variance(pil), 1)
    verdict, needs_fix, reason = _verdict(score)
    return {
        "full_b64": _to_jpeg_b64(pil, 1100, 82),
        "thumb_b64": _to_jpeg_b64(pil, 180, 60),
        "blur_score": score,
        "verdict": verdict,
        "needs_fix": needs_fix,
        "reason": reason,
    }


def build_final_pdf(pages: List[dict]) -> bytes:
    """Assemble a clean single PDF from the (fixed) page images."""
    imgs = []
    for p in sorted(pages, key=lambda x: x["page_no"]):
        data = base64.b64decode(p["full_b64"])
        imgs.append(Image.open(io.BytesIO(data)).convert("RGB"))
    buf = io.BytesIO()
    if imgs:
        imgs[0].save(buf, format="PDF", save_all=True, append_images=imgs[1:])
    return buf.getvalue()


def images_for_grading(pages: List[dict]) -> List[str]:
    return [p["full_b64"] for p in sorted(pages, key=lambda x: x["page_no"])]
