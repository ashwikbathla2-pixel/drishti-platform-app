import { useEffect, useState } from "react";
import { RefreshCw, Bot, Loader2, Save, CheckCheck, Inbox } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ScanBeam from "../components/ScanBeam";
import StatusPill from "../components/StatusPill";
import PageViewer from "../components/PageViewer";
import { fetchQueue, fetchScheme, fetchBundleDetail, aiReadBundle, submitEvaluation, bundlePageImageUrl } from "../lib/api";
import { toast } from "sonner";

function fmtDate(s) { try { return new Date(s).toLocaleDateString(undefined, { day: "2-digit", month: "short" }); } catch { return s; } }

export default function Marking() {
  const [queue, setQueue] = useState([]);
  const [scheme, setScheme] = useState([]);
  const [bundle, setBundle] = useState(null);
  const [marks, setMarks] = useState({});
  const [ai, setAi] = useState(null);
  const [pagesViewed, setPagesViewed] = useState([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadQueue = () => fetchQueue().then(setQueue).catch(() => {});
  useEffect(() => { loadQueue(); fetchScheme().then((s) => setScheme(s.scheme)).catch(() => {}); }, []);

  const open = async (item) => {
    const detail = await fetchBundleDetail(item.bundle_id);
    setBundle(detail);
    setAi(detail.ai_reading || null);
    setMarks({});
    setPagesViewed([]);
  };

  const runAi = async () => {
    setAiBusy(true);
    try {
      const res = await aiReadBundle(bundle.bundle_id);
      setAi(res);
      toast.success(`AI second reader complete — ${res.total_ai_mark}/${res.max_total}`);
    } catch (e) { toast.error("AI grading failed"); } finally { setAiBusy(false); }
  };

  const aiByNo = ai ? Object.fromEntries(ai.marks.map((m) => [m.q_no, m])) : {};
  const setMark = (q, max, v) => {
    const n = v === "" ? "" : Math.max(0, Math.min(Number(v), max));
    setMarks((m) => ({ ...m, [q]: n }));
  };
  const total = Object.values(marks).reduce((a, b) => a + (Number(b) || 0), 0);
  const allMarked = scheme.length > 0 && scheme.every((q) => marks[q.q_no] !== undefined && marks[q.q_no] !== "");
  const allViewed = bundle && pagesViewed.length >= bundle.page_count;

  const submit = async (final) => {
    if (final && (!allMarked || !allViewed)) {
      toast.error(!allMarked ? "Mark every question before submitting." : "View all pages before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const cleaned = Object.fromEntries(Object.entries(marks).filter(([, v]) => v !== "").map(([k, v]) => [k, Number(v)]));
      const res = await submitEvaluation(bundle.bundle_id, cleaned, pagesViewed, final);
      if (final) {
        toast.success(`Submitted · ${res.deviations_created} deviation(s) raised`);
        setBundle(null);
        loadQueue();
      } else {
        toast.success("Draft saved");
      }
    } catch (e) { toast.error("Submission failed"); } finally { setSubmitting(false); }
  };

  // ---- queue view ----
  if (!bundle) {
    return (
      <div className="space-y-10">
        <PageHeader stage="OSM Evaluator Station" title="Booklet Evaluation Workspace"
          description="Verify scanned CBSE Class 12 answer books, enter official marks question-by-question, and compare against the independent AI second-reader."
          right={<button onClick={loadQueue} data-testid="sync-queue" className="inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 font-mono uppercase tracking-[0.15em] text-[10px] hover:bg-white/5 transition-colors"><RefreshCw className="h-3.5 w-3.5" /> Sync</button>} />
        <ScanBeam />

        <div className="rounded-2xl glass overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Candidate", "Subject", "Pages", "Ingested", "Status", ""].map((h) => (
                  <th key={h} className="text-left font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queue.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-16 text-center">
                  <Inbox className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="font-sans text-sm text-muted-foreground mt-3">Queue is empty. Operators add booklets from <span className="text-accent">Scan Intake</span>.</p>
                </td></tr>
              )}
              {queue.map((b) => (
                <tr key={b.bundle_id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors" data-testid={`queue-row-${b.bundle_id}`}>
                  <td className="px-5 py-4 font-mono text-xs">{b.candidate_code}</td>
                  <td className="px-5 py-4 font-sans text-sm text-muted-foreground">{b.subject}</td>
                  <td className="px-5 py-4 font-mono text-sm">{b.page_count}/24</td>
                  <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{fmtDate(b.ingested_at)}</td>
                  <td className="px-5 py-4"><StatusPill status={b.status} label={b.status} /></td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => open(b)} data-testid={`grade-${b.bundle_id}`}
                      className="rounded-full bg-accent text-[#050505] font-mono uppercase tracking-[0.15em] text-[10px] px-4 py-1.5 hover:bg-white transition-colors">Grade booklet</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ---- workspace ----
  return (
    <div className="space-y-6">
      <PageHeader stage="OSM Evaluator Station" title="Grading Booklet"
        description={bundle.candidate_code} />
      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <PageViewer title={bundle.candidate_code} pageCount={bundle.page_count}
          getImageUrl={(n) => bundlePageImageUrl(bundle.bundle_id, n)}
          onBack={() => setBundle(null)} onViewedChange={setPagesViewed} />

        <div className="space-y-4">
          <div className="rounded-2xl glass p-4">
            <div className="font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground">Candidate</div>
            <div className="font-mono text-sm mt-1">{bundle.candidate_code}</div>
            <div className="font-sans text-sm text-muted-foreground">{bundle.subject}</div>
          </div>

          <div className="rounded-2xl glass-strong p-4" data-testid="ai-second-reader">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Bot className="h-4 w-4 text-accent" /><span className="font-display text-lg">AI Second Reader</span></div>
              {ai && <StatusPill status={ai.source === "gemini" ? "verified" : "flagged"} label={ai.source} />}
            </div>
            {ai ? (
              <div className="mt-2 font-sans text-sm text-muted-foreground">Independent grade: <span className="text-accent font-mono">{ai.total_ai_mark}/{ai.max_total}</span></div>
            ) : (
              <button onClick={runAi} disabled={aiBusy} data-testid="run-ai-grade"
                className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-accent text-[#050505] font-mono uppercase tracking-[0.15em] text-[10px] py-2.5 hover:bg-white transition-colors disabled:opacity-50">
                {aiBusy ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading…</> : "Run AI Grade"}
              </button>
            )}
          </div>

          {/* question rows */}
          <div className="rounded-2xl glass p-4 space-y-2 max-h-[420px] overflow-auto">
            {scheme.map((q) => {
              const aiM = aiByNo[q.q_no];
              const t = marks[q.q_no];
              const gap = aiM && aiM.ai_mark !== null && t !== "" && t !== undefined ? Math.abs(Number(t) - aiM.ai_mark) : 0;
              const big = gap >= 3;
              return (
                <div key={q.q_no} className={`rounded-xl border p-3 ${big ? "border-rejected/40 bg-rejected/5" : "border-white/[0.05] bg-white/[0.02]"}`} data-testid={`q-row-${q.q_no}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono uppercase tracking-[0.15em] text-[10px]">{q.q_no} <span className="text-muted-foreground">/ {q.marks}</span></span>
                    <input type="number" min={0} max={q.marks} value={t ?? ""} onChange={(e) => setMark(q.q_no, q.marks, e.target.value)}
                      data-testid={`mark-${q.q_no}`}
                      className="w-16 rounded-lg bg-black/30 border border-white/[0.06] px-2 py-1 font-mono text-sm text-right outline-none focus:border-accent/40" />
                  </div>
                  {aiM && (
                    <div className="mt-1.5">
                      <span className="font-mono text-[10px] text-accent">AI: {aiM.ai_mark === null ? "illegible" : `${aiM.ai_mark}/${aiM.max_mark}`}</span>
                      <p className="font-display-italic text-xs text-muted-foreground mt-0.5">{aiM.justification}</p>
                      {big && <p className="font-mono uppercase tracking-[0.15em] text-[9px] text-rejected mt-1">Gap of {gap} marks detected!</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl glass p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground">Aggregate</span>
              <span className="font-display text-2xl">{total} <span className="text-muted-foreground text-base">/ 80</span></span>
            </div>
            <div className="mt-2 font-mono text-[10px] text-muted-foreground">
              Viewed {pagesViewed.length}/{bundle.page_count} pages · {Object.values(marks).filter((v) => v !== "").length}/{scheme.length} marked
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => submit(false)} disabled={submitting} data-testid="save-draft"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl glass py-2.5 font-mono uppercase tracking-[0.15em] text-[10px] hover:bg-white/5 transition-colors disabled:opacity-50">
                <Save className="h-3.5 w-3.5" /> Save Draft
              </button>
              <button onClick={() => submit(true)} disabled={submitting} data-testid="submit-grading"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent text-[#050505] py-2.5 font-mono uppercase tracking-[0.15em] text-[10px] hover:bg-white transition-colors disabled:opacity-50">
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />} Submit Grading
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
