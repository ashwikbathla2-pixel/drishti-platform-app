import { useEffect, useState } from "react";
import { RefreshCw, User, Bot, CheckCircle2, AlertTriangle, ShieldCheck, RotateCcw, Loader2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ScanBeam from "../components/ScanBeam";
import StatusPill from "../components/StatusPill";
import PageViewer from "../components/PageViewer";
import { fetchDeviations, fetchAudit, approveDeviation, reevaluateDeviation, bundlePageImageUrl } from "../lib/api";
import { toast } from "sonner";

export default function Audit() {
  const [devs, setDevs] = useState([]);
  const [active, setActive] = useState(null); // { dev, bundle }
  const [busy, setBusy] = useState(false);

  const load = () => fetchDeviations("open").then(setDevs).catch(() => {});
  useEffect(() => { load(); }, []);

  const openAudit = async (dev) => {
    const data = await fetchAudit(dev.bundle_id);
    setActive({ dev, bundle: data.bundle });
  };

  const act = async (fn, label) => {
    setBusy(true);
    try {
      await fn(active.dev.dev_id);
      toast.success(label);
      setActive(null);
      load();
    } catch (e) { toast.error("Action failed"); } finally { setBusy(false); }
  };

  // ---- list view ----
  if (!active) {
    return (
      <div className="space-y-10">
        <PageHeader stage="OSM Moderator Console" title="AI Deviation Audit Studio"
          description="Audit booklets where human markings differ significantly from independent Gemini grades, inspect justifications, read candidate sheets, and reconcile differences."
          right={<button onClick={load} data-testid="refresh-devs" className="inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 font-mono uppercase tracking-[0.15em] text-[10px] hover:bg-white/5 transition-colors"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>} />
        <ScanBeam />

        {devs.length === 0 ? (
          <div className="rounded-2xl glass p-16 text-center" data-testid="all-aligned">
            <CheckCircle2 className="h-10 w-10 text-verified mx-auto" />
            <h3 className="font-display text-2xl mt-4">All Scores Fully Aligned!</h3>
            <p className="font-sans text-sm text-muted-foreground mt-1">No open deviations to audit right now.</p>
          </div>
        ) : (
          <div className="rounded-2xl glass overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Candidate", "Subject", "Question", "Teacher", "AI", "Gap", ""].map((h) => (
                    <th key={h} className="text-left font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {devs.map((d) => (
                  <tr key={d.dev_id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors" data-testid={`dev-row-${d.dev_id}`}>
                    <td className="px-5 py-4 font-mono text-xs">{d.candidate_code}</td>
                    <td className="px-5 py-4 font-sans text-sm text-muted-foreground">{d.subject}</td>
                    <td className="px-5 py-4 font-mono uppercase tracking-[0.15em] text-[11px] text-accent">{d.q_no}</td>
                    <td className="px-5 py-4 font-mono text-sm">{d.teacher_mark}</td>
                    <td className="px-5 py-4 font-mono text-sm">{d.ai_mark === null ? <span className="text-rejected">illegible</span> : d.ai_mark}</td>
                    <td className="px-5 py-4"><span className="font-mono text-[11px] text-rejected border border-rejected/25 bg-rejected/10 rounded-full px-2.5 py-1">±{d.gap}</span></td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => openAudit(d)} data-testid={`audit-${d.dev_id}`}
                        className="rounded-full bg-accent text-[#050505] font-mono uppercase tracking-[0.15em] text-[10px] px-4 py-1.5 hover:bg-white transition-colors">Audit deviation</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ---- workspace ----
  const { dev, bundle } = active;
  return (
    <div className="space-y-6">
      <PageHeader stage="OSM Moderator Console" title="Conflict Investigation" description={`${dev.candidate_code} · ${dev.q_no}`} />
      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <PageViewer title={bundle.candidate_code} pageCount={bundle.page_count}
          getImageUrl={(n) => bundlePageImageUrl(bundle.bundle_id, n)} onBack={() => setActive(null)} />

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl glass p-4">
              <div className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" /><span className="font-mono uppercase tracking-[0.2em] text-[10px]">Human Mark</span></div>
              <div className="font-display text-4xl mt-2">{dev.teacher_mark}</div>
            </div>
            <div className="rounded-2xl glass p-4">
              <div className="flex items-center gap-2 text-accent"><Bot className="h-4 w-4" /><span className="font-mono uppercase tracking-[0.2em] text-[10px]">AI Mark</span></div>
              <div className="font-display text-4xl mt-2">{dev.ai_mark === null ? <span className="text-rejected text-2xl">illegible</span> : dev.ai_mark}</div>
              <div className="font-mono text-[9px] text-muted-foreground mt-1">engine · gemini-3.1-pro</div>
            </div>
          </div>

          <div className="rounded-2xl border border-rejected/30 bg-rejected/5 p-4" data-testid="deviation-warning">
            <div className="flex items-center gap-2 text-rejected"><AlertTriangle className="h-4 w-4" /><span className="font-mono uppercase tracking-[0.2em] text-[10px]">Deviation Warning</span></div>
            <p className="font-sans text-sm text-foreground/90 mt-2">A mark difference of <span className="text-rejected font-mono">±{dev.gap} marks</span> exists on question {dev.q_no}.</p>
          </div>

          <div className="rounded-2xl glass-strong p-4">
            <div className="font-mono uppercase tracking-[0.2em] text-[10px] text-accent/80">Gemini Justification Trace</div>
            <p className="font-display-italic text-sm text-muted-foreground mt-2 leading-relaxed">{dev.justification || "No justification recorded."}</p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button onClick={() => act(approveDeviation, "Human evaluator mark upheld")} disabled={busy} data-testid="uphold-btn"
              className="flex items-center justify-center gap-2 rounded-xl bg-verified/15 text-verified hover:bg-verified/25 transition-colors py-3 font-mono uppercase tracking-[0.15em] text-[10px] disabled:opacity-50">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />} Uphold Human Evaluator Mark
            </button>
            <button onClick={() => act(reevaluateDeviation, "Booklet sent for re-evaluation")} disabled={busy} data-testid="reeval-btn"
              className="flex items-center justify-center gap-2 rounded-xl bg-rejected/15 text-rejected hover:bg-rejected/25 transition-colors py-3 font-mono uppercase tracking-[0.15em] text-[10px] disabled:opacity-50">
              <RotateCcw className="h-3.5 w-3.5" /> Reject and Send for Re-evaluation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
