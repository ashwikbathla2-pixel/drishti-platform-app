# Drishti — AI Answer & Evaluation Platform (PRD)

## Original problem statement
Build "Drishti", a forensic OSM (On-Screen Marking) exam-evaluation workspace for CBSE Class 12
answer booklets. Three-stage pipeline: (1) Scan & verify booklet PDFs with per-page sharpness checks
and re-shoot, (2) AI grade against an 80-mark CBSE Business Studies marking scheme via Gemini with
per-question justification + confidence (null on illegible, never guess), (3) Human + AI reconciliation
with a Deviation Audit Studio. Design: "warm forensic dark" — champagne-gold (#e6c075) accent, glassmorphism,
film grain, WebGL dither hero, Instrument Serif / Libre Caslon Text / DM Mono typography.

## Architecture (as built)
- Frontend: React 19 (CRA + craco) + Tailwind, framer-motion, lucide-react, sonner, raw-WebGL dither shader.
- Backend: FastAPI, routes under `/api/v1`, JWT (pyjwt) role login, PyMuPDF + OpenCV (variance-of-Laplacian)
  PDF blur pipeline, PIL synthetic page generator, Gemini grading via emergentintegrations (EMERGENT_LLM_KEY, gemini-2.5-flash).
- DB: MongoDB collections — bundles, deviations, devices, generations, jobs (seeded idempotently on startup).
- Note: Original spec asked Next.js 16; adapted to the React+FastAPI+MongoDB platform stack, design & features preserved.

## User personas
- Scan Operator — uploads & verifies booklet scans.
- Evaluator — grades booklets question-by-question against the AI second reader.
- Moderator — audits deviations, upholds or sends for re-evaluation.
- Administrator — oversees devices/stations/engine config.

## Core requirements (static)
- Role-based identity (no passwords). 80-mark subject-pluggable scheme. Exact-match objectives, partial-credit
  descriptives, null-on-illegible. Deviation raised when |human − AI| ≥ 3. Champagne-only accent, status green/amber/red.

## Implemented (2026-06-15)
- Landing page (dither hero, morphing glass nav, spotlight feature cards, pipeline, CTA, footer).
- /login role-selection ("Who are you?") → JWT → dashboard.
- AppShell (sidebar rail + identity card + switch role, mobile drawer).
- Dashboard home: Ask Drishti composer, recent generations, workspace stats, model status, system actions.
- Scan Intake: candidate/subject inputs, PDF dropzone, per-page sharpness report (OpenCV), re-scan flagged pages,
  AI GradePanel, finalize → final PDF + auto-creates marking bundle.
- Booklet Marking: queue, split workspace (zoomable PageViewer + page-view tracking), AI Second Reader,
  per-question scoring with gap detection, submit guards (all marked + all viewed), deviation creation.
- AI Deviation Audit Studio: open deviations table, conflict workspace (Human vs AI, justification trace),
  uphold / re-evaluate verdicts.
- Answers, Evaluations, History, Settings pages. Full /api/v1 surface. Tested: backend 100%, frontend 95% (fixed submit-guard).

## Backlog
- P1: Real role-gated auth middleware (JWT verification dependency) on protected routes.
- P1: Live Gemini grading of synthetic seeded bundles (currently demo source by design; real uploads use Gemini).
- P2: Resizable split-pane divider with ScanBeam drag motif; lenis smooth scroll; devices heartbeat UI.
- P2: Additional subject schemes (Accountancy, Economics) to exercise subject-pluggable architecture.

## Next tasks
- Add JWT verification dependency if role-gated access is desired.
- Expand marking schemes for more subjects.
