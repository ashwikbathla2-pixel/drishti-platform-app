import { useState, useRef } from "react";
import { Upload, Loader2, FileCheck2, RefreshCw, Download, ScanLine, CheckCircle2, AlertTriangle } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ScanBeam from "../components/ScanBeam";
import StatusPill from "../components/StatusPill";
import { uploadPdf, replacePdfPage, finalizePdfJob, finalPdfUrl } from "../lib/api";
import { SUBJECTS } from "../lib/data";
import { toast } from "sonner";

function GradePanel({ grade }) {
  const [open, setOpen] = useState(false);
  if (!grade) return null;
  const pct = Math.round((grade.total_ai_mark / grade.max_total) * 100);
  return (
    <div className="rounded-2xl glass-strong p-6" data-testid="grade-panel">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono uppercase tracking-[0.2em] text-[10px] text-accent/80">AI Grade · 80-mark reference</div>
          <div className="mt-2 flex items-end gap-2">
            <span className="font-display text-4xl">{grade.total_ai_mark}</span>
            <span className="font-sans text-muted-foreground mb-1">/ {grade.max_total} ({pct}%)</span>
          </div>
          <p className="font-sans text-xs text-muted-foreground mt-1">
            {grade.source === "gemini"
              ? "Graded directly from your uploaded answer sheet."
              : "Demo marks (set GEMINI_API_KEY for live grading)."}
          </p>
        </div>
        <StatusPill status={grade.source === "gemini" ? "verified" : "flagged"} label={grade.source} />
      </div>
      <button onClick={() => setOpen((o) => !o)} data-testid="grade-toggle"
        className="mt-4 font-mono uppercase tracking-[0.15em] text-[10px] text-accent">
        {open ? "Hide" : "Show"} per-question breakdown
      </button>
      {open && (
        <div className="mt-4 space-y-2 max-h-80 overflow-auto pr-2">
          {grade.marks.map((m) => (
            <div key={m.q_no} className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono uppercase tracking-[0.15em] text-[10px]">{m.q_no}</span>
                <span className={`font-mono text-[11px] ${m.ai_mark === null ? "text-rejected" : "text-verified"}`}>
                  {m.ai_mark === null ? "NULL" : m.ai_mark} / {m.max_mark}
                  <span className="text-muted-foreground ml-2">conf {Math.round(m.confidence * 100)}%</span>
                </span>
              </div>
              <p className="font-display-italic text-sm text-muted-foreground mt-1">{m.justification}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PageCard({ page, onRescan, busy }) {
  const inputRef = useRef(null);
  const bad = page.needs_fix && !page.fixed;
  return (
    <div className={`rounded-2xl glass p-3 ${bad ? "border-rejected/30" : ""}`} data-testid={`page-card-${page.page_no}`}>
      <div className="relative rounded-xl overflow-hidden bg-black/40 aspect-[3/4]">
        <img src={page.thumb_url} alt={`page ${page.page_no}`} className="h-full w-full object-cover" />
        <span className="absolute top-2 left-2 font-mono text-[9px] bg-black/60 rounded px-1.5 py-0.5">P{page.page_no}</span>
        <span className="absolute top-2 right-2">
          <StatusPill status={page.verdict} label={page.fixed ? "fixed" : page.verdict} />
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-[10px] text-muted-foreground">sharpness {page.blur_score}</span>
        {page.fixed && <span className="font-mono uppercase tracking-[0.15em] text-[9px] text-verified">re-scanned · fixed</span>}
      </div>
      {bad && <p className="font-sans text-xs text-rejected/90 mt-1 leading-snug">{page.reason}</p>}
      {bad && (
        <>
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files[0] && onRescan(page.page_no, e.target.files[0])} />
          <button onClick={() => inputRef.current.click()} disabled={busy} data-testid={`rescan-${page.page_no}`}
            className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg bg-rejected/15 text-rejected hover:bg-rejected/25 transition-colors py-2 font-mono uppercase tracking-[0.15em] text-[10px] disabled:opacity-50">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Re-scan this page
          </button>
        </>
      )}
    </div>
  );
}

export default function ScanIntake() {
  const [candidate, setCandidate] = useState("CBSE2026|CAND-0001|BusinessStudies");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [job, setJob] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [busyPage, setBusyPage] = useState(null);
  const [finalizing, setFinalizing] = useState(false);
  const fileRef = useRef(null);

  const onUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setJob(null);
    try {
      const res = await uploadPdf(file, candidate, subject);
      setJob(res);
      toast.success(`Processed ${res.total_pages} pages`);
    } catch (e) {
      toast.error("Upload failed — please ensure it is a valid PDF.");
    } finally {
      setUploading(false);
    }
  };

  const onRescan = async (pageNo, imageFile) => {
    setBusyPage(pageNo);
    try {
      const res = await replacePdfPage(job.job_id, pageNo, imageFile);
      setJob(res);
      toast.success(`Page ${pageNo} re-scanned`);
    } catch (e) {
      toast.error("Re-scan failed");
    } finally {
      setBusyPage(null);
    }
  };

  const flagged = job ? job.pages.filter((p) => p.needs_fix && !p.fixed).length : 0;
  const allClean = job && flagged === 0;

  const onFinalize = async () => {
    setFinalizing(true);
    try {
      const res = await finalizePdfJob(job.job_id);
      setJob({ ...job, status: "finalized", final_pdf_url: res.final_pdf_url });
      toast.success("Final PDF built — sent to the marking queue");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Finalize failed");
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div className="space-y-10">
      <PageHeader stage="Scan Station · Intake" title="Upload & Verify Booklet"
        description="Upload the full answer-booklet PDF. Drishti checks every page, flags blurry or obscured scans, you re-shoot just those pages, then it builds one clean PDF for the evaluators." />
      <ScanBeam />

      {/* inputs */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl glass p-4">
          <label className="font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground">Candidate code (from QR)</label>
          <input value={candidate} onChange={(e) => setCandidate(e.target.value)} data-testid="candidate-input"
            className="mt-2 w-full rounded-xl bg-black/30 border border-white/[0.06] px-4 py-2.5 font-mono text-sm outline-none focus:border-accent/40" />
        </div>
        <div className="rounded-2xl glass p-4">
          <label className="font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground">Subject</label>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} data-testid="scan-subject"
            className="mt-2 w-full rounded-xl bg-black/30 border border-white/[0.06] px-4 py-2.5 font-sans text-sm outline-none focus:border-accent/40">
            {SUBJECTS.map((s) => <option key={s} value={s} className="bg-popover">{s}</option>)}
          </select>
        </div>
      </div>

      {/* dropzone */}
      <div>
        <input ref={fileRef} type="file" accept="application/pdf" className="hidden"
          onChange={(e) => onUpload(e.target.files[0])} data-testid="pdf-input" />
        <button onClick={() => !uploading && fileRef.current.click()} disabled={uploading} data-testid="dropzone"
          className="w-full rounded-2xl border border-dashed border-white/15 hover:border-accent/40 transition-colors bg-white/[0.01] py-12 grid place-items-center">
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 text-accent animate-spin" />
              <span className="font-sans text-sm text-muted-foreground">Processing every page — checking sharpness…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <span className="grid place-items-center h-14 w-14 rounded-2xl bg-accent/10 border border-accent/25">
                <Upload className="h-6 w-6 text-accent" />
              </span>
              <span className="font-display text-2xl">Drop the booklet PDF</span>
              <span className="font-sans text-sm text-muted-foreground">one multi-page PDF · we check sharpness page by page</span>
            </div>
          )}
        </button>
      </div>

      {job && (
        <div className="space-y-6">
          {/* summary bar */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl glass p-4" data-testid="summary-bar">
            <span className="font-mono text-sm text-foreground">{job.candidate_code}</span>
            <span className="text-muted-foreground">·</span>
            <span className="font-sans text-sm text-muted-foreground">{job.subject}</span>
            <span className="text-muted-foreground">·</span>
            <span className="font-mono text-sm">{job.total_pages} pages</span>
            <div className="ml-auto">
              {allClean ? (
                <span className="flex items-center gap-1.5 text-verified font-mono uppercase tracking-[0.15em] text-[10px]"><CheckCircle2 className="h-4 w-4" /> all pages clean</span>
              ) : (
                <span className="flex items-center gap-1.5 text-flagged font-mono uppercase tracking-[0.15em] text-[10px]"><AlertTriangle className="h-4 w-4" /> {flagged} need re-scan</span>
              )}
            </div>
          </div>

          <GradePanel grade={job.ai_grade} />

          {/* pages grid */}
          <div>
            <div className="font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground mb-3 flex items-center gap-2">
              <ScanLine className="h-3.5 w-3.5 text-accent" /> Page sharpness report
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {job.pages.map((p) => (
                <PageCard key={p.page_no} page={p} onRescan={onRescan} busy={busyPage === p.page_no} />
              ))}
            </div>
          </div>

          {/* finalize */}
          <div className="flex justify-end">
            {job.final_pdf_url ? (
              <a href={finalPdfUrl(job.job_id)} target="_blank" rel="noreferrer" data-testid="download-final"
                className="inline-flex items-center gap-2 rounded-full bg-verified text-[#06222a] font-mono uppercase tracking-[0.15em] text-[11px] px-6 py-3 hover:opacity-90 transition-opacity">
                <Download className="h-4 w-4" /> Download final PDF
              </a>
            ) : (
              <button onClick={onFinalize} disabled={!allClean || finalizing} data-testid="finalize-btn"
                title={allClean ? "" : "Fix all flagged pages first"}
                className="inline-flex items-center gap-2 rounded-full bg-accent text-[#050505] font-mono uppercase tracking-[0.15em] text-[11px] px-6 py-3 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {finalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />} Build final PDF for teachers
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
