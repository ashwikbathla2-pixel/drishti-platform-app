<div align="center">

```
        ▁▂▃▄▅▆▇█  D R I S H T I  █▇▆▅▄▃▂▁
        the machine that reads what students wrote
```

# दृष्टि · Drishti

### *Answers That Think Before They Speak.*

**An AI answer-evaluation platform that scans CBSE answer booklets, reads the real handwriting,
grades it against an 80-mark scheme, and lets a human and a machine argue about the marks — on the record.**

`forensic AI verification` · `structured grading` · `human-in-the-loop`

<sub>Champagne-gold on OLED black · dithered waves · glass · Instrument Serif</sub>

</div>

---

> **drishti** *(दृष्टि, n.)* — sight; the focused gaze. In yoga, the single point your eyes hold so the rest of the world goes quiet.
> This app holds that gaze on one thing: **what is actually written on the page.** Not a plausible answer. Not a demo. The real ink.

---

## 🔍 The case it solves

Every exam season, lakhs of handwritten booklets get marked by tired humans under a clock. Mistakes hide in the pile: a skipped page, a misread digit, a 6 that should've been a 1. Drishti doesn't replace the examiner — it gives them a **second pair of eyes that never blinks**, and a paper trail when the two disagree.

```
  ┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
  │  SCAN   │ ──▶ │  CHECK   │ ──▶ │   MARK   │ ──▶ │  AUDIT   │
  │ booklet │     │ vs 80-mk │     │  human + │     │ resolve  │
  │  + QR   │     │  scheme  │     │ AI reader│     │ the gaps │
  └─────────┘     └──────────┘     └──────────┘     └──────────┘
   operator         Gemini          evaluator        moderator
```

Four roles, one chain of custody, zero silent errors.

---

## 🎭 Who are you? — pick a badge, no password

Identity *is* the role. Sign in by choosing the seat you're sitting in.

| Badge | You say… | You get |
|---|---|---|
| 🛰️ **Scan Operator** | *"I capture answer sheets at a station."* | The intake bench — upload, blur-check, re-shoot, finalize |
| 🎓 **Evaluator** | *"I grade the bundles assigned to me."* | The marking workspace — read every page, score every question |
| 🛡️ **Moderator** | *"I run AI audits and resolve deviations."* | The deviation studio — referee human vs machine |
| ⚙️ **Administrator** | *"I oversee stations and the whole platform."* | The control panel — stations, throughput, the big picture |

> The login screen literally asks **"Who are you?"** in upright Instrument Serif. No friction, no password reset emails — a 12-hour JWT and you're in.

---

## 🧪 The forensic pipeline, in detail

### 1 · Intake — *trust no scan*
Drop one multi-page booklet PDF. Drishti counts the pages, renders each one, and runs a **variance-of-Laplacian sharpness check**. Blurry, smudged, or thumb-over-lens pages get a red **`BLURRY`** verdict and a human-readable reason (*"Motion blur on handwritten base — sharpness 780 < threshold 1200"*). You re-shoot **only those pages**. The **"Build final PDF"** button stays locked until every flag is clear — so a smudged answer can never reach an examiner.

### 2 · The reference — *grade against the truth, not a vibe*
The marking scheme is the law. Ships as typed data ([`lib/server/marking-scheme.ts`](lib/server/marking-scheme.ts)) for **CBSE Class 12 Business Studies, 80 marks**:

```
Section A · 20 × 1   objective   (MCQ / one-word / assertion-reason)  → exact-match
Section B ·  4 × 3   short        ─┐
Section C ·  4 × 4   short         ├─ descriptive → partial credit per key point
Section D ·  4 × 5   long         │
Section E ·  2 × 6   case-based  ─┘
                     ─────────
                       80 marks
```
Swap the data file, grade a different subject. The engine doesn't care.

### 3 · The read — *Gemini transcribes before it scores*
The booklet goes to **Google Gemini** (`gemini-2.5-flash`) as a native PDF/image. The grader prompt forces it to **transcribe the real handwriting first**, then award marks that follow from that transcription. The non-negotiables:

- ✅ Objective → full marks **only** on an exact match, else 0
- ✅ Descriptive → partial credit per `key_point` covered, never above max
- 🚫 Illegible or blank → `ai_mark = null`, `confidence = 0.0` — **it never guesses**
- 🚫 No API key? It says so honestly (`source: "demo"`) instead of pretending

### 4 · The judgement — *two readers, one truth*
The human evaluator scores every question — and **can't submit until they've actually viewed every page** (we track it). Gemini scores in parallel as a silent second reader. Wherever the two diverge by **≥ 3 marks**, the system raises a **deviation**.

### 5 · The audit — *settle it on the record*
The moderator opens the **AI Deviation Audit Studio**: the candidate's sheet on the left (zoom, pan, thumbnails), the conflict on the right — human mark vs AI mark vs **Gemini's written justification for that exact question**. Two verdicts:

> ⚖️ **Uphold the human** — the examiner was right, case closed.
> 🔁 **Send for re-evaluation** — back to the queue, fresh eyes.

Every disagreement is logged. Nothing is overwritten in the dark.

---

## 🎨 The look — "warm forensic dark"

This isn't a dashboard skin. It's a deliberate visual language.

- **Dither.** A live WebGL field of champagne-gold waves (Perlin → 4-octave FBM → domain warp) crushed through an **8×8 Bayer ordered dither** to ~4 color levels. The hero literally looks like a vintage scanner's halftone output. Mouse-reactive. ([`components/landing/dither.tsx`](components/landing/dither.tsx))
- **Glass.** Layered `backdrop-blur` chrome (`.glass`, `.glass-strong`, `.glass-nav`) over OLED black `#050508`, warm-tinted, with a film-grain overlay and a morphing nav that lerps between expanded and compact as you scroll.
- **Type with a job.** *Instrument Serif* for headlines (upright H1/H3, **italic** H2), *Libre Caslon Text* for prose, *DM Mono* for every label, badge, and metric.
- **One accent, forever.** Champagne gold `#E6C075` — never blue. Status speaks only in green / amber / red.
- **The scan-beam.** A 1px champagne hairline recurring as a divider — a scanner pass frozen in the UI.

---

## 🏗️ Architecture — one origin, two engines

Drishti runs as a **single Render service**: a **FastAPI** backend that *also serves the static Next.js export* from the same origin — so the browser makes relative calls and there is **no CORS**.

```
                      ┌────────────────────────────────────┐
   browser  ─────────▶│  one origin (Render / Docker)       │
   (phone on LAN too) │                                     │
                      │  Next.js 16 static  ◀── served by ──┤
                      │  FastAPI  /api/v1/* ── Gemini ──▶ 🤖 │
                      │           /ws/station (live scans)   │
                      └────────────────────────────────────┘
```

…and a **self-contained "lite" build** where Next.js Route Handlers (`app/api/v1/*` + `lib/server/*`) mirror the Python API one-for-one, so the whole thing runs on Vercel with real Gemini grading and seeded demo data. One client ([`lib/api.ts`](lib/api.ts)) drives either — it auto-resolves same-origin, an explicit URL, or `:8000` on the current host.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind v4 · Three / R3F / postprocessing · Motion · Lenis · `@google/genai` · `pdf-lib` · `jose` (JWT) · FastAPI.

---

## 🚀 Run it

```bash
# 1 · install
npm install

# 2 · give Gemini its eyes (without this, grading falls back to demo marks)
cp .env.local.example .env.local   # then edit:
#   GEMINI_API_KEY=AIza...your_real_key
#   GEMINI_MODEL=gemini-2.5-flash
#   JWT_SECRET=change-me-in-production

# 3 · run
npm run dev
```

Open **http://localhost:3000** → land on the dithered hero → **Open Console** → pick a badge → you're in the workspace.

> **Lite vs full:** `npm run dev` gives you the Next.js lite build (real Gemini grading, in-memory bundles). For real PDF rasterization, OpenCV blur scoring, persistence, and the live scan WebSocket, run the FastAPI service in [`backend/`](backend/) (see [`render.yaml`](render.yaml) / [`Dockerfile`](Dockerfile)).

### Environment

| Var | What it does | Falls back to |
|---|---|---|
| `GEMINI_API_KEY` / `GOOGLE_API_KEY` | live grading | deterministic demo marks |
| `GEMINI_MODEL` | model id | `gemini-2.5-flash` |
| `JWT_SECRET` | signs the 12h session token | an insecure dev secret |
| `NEXT_PUBLIC_SAME_ORIGIN` | `1` for the unified deploy (relative API) | host `:8000` |
| `NEXT_PUBLIC_API_URL` | explicit backend URL override | — |

---

## 🗺️ Where things live

```
app/
  page.tsx                  ← dithered landing hero
  login/                    ← "Who are you?" role picker
  (work)/dashboard/
    scan/                   ← 🛰️ intake + sharpness check + finalize
    marking/                ← 🎓 split-pane evaluator workspace
    audit/                  ← 🛡️ AI Deviation Audit Studio
    history · settings
  api/v1/                   ← lite backend (mirrors FastAPI)
components/
  landing/dither.tsx        ← the champagne-gold dither shader
  app-shell.tsx             ← glass rail + identity footer
lib/
  api.ts                    ← the one client, origin-aware
  server/
    gemini.ts               ← the grader (transcribe → score → never guess)
    marking-scheme.ts       ← the 80-mark CBSE reference
    pdf.ts · auth.ts · store.ts
backend/                    ← FastAPI: real CV, persistence, WebSocket
```

---

## 🧭 The three laws of Drishti

1. **Read the real page.** No demo answer, no assumed mark, no fabricated thumbnail. If Gemini can't read it, it says `null` — out loud.
2. **The human has the last word.** The AI is a second reader, never the judge. Every override is logged.
3. **Nothing changes in the dark.** Deviations are surfaced, audited, and resolved on the record.

---

<div align="center">

### *Think Better. Answer Better.*

```
  ──────────────────────────────────────────────────────────
   Drishti Answer Platform · forensic AI verification &
   structured output generation · built with a steady gaze
  ──────────────────────────────────────────────────────────
```

</div>
