import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Activity, ArrowUpRight, Gauge, Brain, AlertTriangle, Cpu } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ScanBeam from "../components/ScanBeam";
import { fetchStats, fetchGenerations } from "../lib/api";
import { SUBJECTS } from "../lib/data";

function Metric({ label, value, suffix = "%", tone }) {
  const color = tone === "bad" ? "text-rejected" : tone === "warn" ? "text-flagged" : "text-verified";
  return (
    <div>
      <div className="font-mono uppercase tracking-[0.2em] text-[9px] text-muted-foreground">{label}</div>
      <div className={`font-display text-2xl ${color}`}>{value}{suffix}</div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [stats, setStats] = useState(null);
  const [gens, setGens] = useState([]);

  useEffect(() => {
    fetchStats().then(setStats).catch(() => {});
    fetchGenerations().then(setGens).catch(() => {});
  }, []);

  const submit = () => {
    if (!prompt.trim()) return;
    navigate(`/dashboard/answers?prompt=${encodeURIComponent(prompt)}&subject=${encodeURIComponent(subject)}`);
  };

  return (
    <div className="space-y-10">
      <PageHeader stage="Control Panel" title="Operations Home"
        description="Generate grounded answers, monitor evaluation throughput, and track the verification engine." />
      <ScanBeam />

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        {/* left */}
        <div className="space-y-6">
          <div className="rounded-2xl glass p-6" data-testid="ask-drishti">
            <div className="font-mono uppercase tracking-[0.2em] text-[10px] text-accent/80">Ask Drishti</div>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
              data-testid="prompt-input" rows={4}
              placeholder="e.g. Explain the importance of the planning function of management."
              className="mt-3 w-full resize-none rounded-xl bg-black/30 border border-white/[0.06] p-4 font-sans text-sm outline-none focus:border-accent/40 transition-colors placeholder:text-muted-foreground/60" />
            <div className="mt-3 flex flex-col sm:flex-row gap-3 sm:items-center">
              <select value={subject} onChange={(e) => setSubject(e.target.value)} data-testid="subject-select"
                className="rounded-xl bg-black/30 border border-white/[0.06] px-4 py-2.5 font-sans text-sm outline-none focus:border-accent/40">
                {SUBJECTS.map((s) => <option key={s} value={s} className="bg-popover">{s}</option>)}
              </select>
              <button onClick={submit} data-testid="generate-btn"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-accent text-[#050505] font-mono uppercase tracking-[0.15em] text-[11px] px-5 py-2.5 hover:bg-white transition-colors">
                <Send className="h-3.5 w-3.5" /> Generate & Evaluate
              </button>
            </div>
          </div>

          <div className="rounded-2xl glass p-6">
            <div className="font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground mb-4">Recent Generations</div>
            <div className="space-y-3">
              {gens.length === 0 && <p className="font-sans text-sm text-muted-foreground">No generations yet.</p>}
              {gens.slice(0, 5).map((g) => (
                <div key={g.id} className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 hover:border-white/15 transition-colors" data-testid={`gen-${g.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-sans text-sm text-foreground/90 line-clamp-1">{g.prompt}</p>
                    <span className="font-mono uppercase tracking-[0.15em] text-[9px] text-muted-foreground shrink-0">{g.subject}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-5">
                    <span className="font-mono text-[11px] text-verified">ACC {g.accuracy}%</span>
                    <span className="font-mono text-[11px] text-accent">REASON {g.reasoning}%</span>
                    <span className="font-mono text-[11px] text-rejected">HALLU {g.hallucination}%</span>
                    <button onClick={() => navigate(`/dashboard/answers?gen=${g.id}`)} className="ml-auto font-mono uppercase tracking-[0.15em] text-[9px] text-accent flex items-center gap-1">
                      Workspace <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* right */}
        <div className="space-y-6">
          <div className="rounded-2xl glass p-6" data-testid="workspace-stats">
            <div className="font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground mb-4">Workspace Statistics</div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <div className="font-mono uppercase tracking-[0.2em] text-[9px] text-muted-foreground">Generations</div>
                <div className="font-display text-2xl text-foreground">{stats?.generations ?? "—"}</div>
              </div>
              <div>
                <div className="font-mono uppercase tracking-[0.2em] text-[9px] text-muted-foreground">Queue</div>
                <div className="font-display text-2xl text-foreground">{stats?.booklets_in_queue ?? "—"}</div>
              </div>
              <Metric label="Avg Accuracy" value={stats?.avg_accuracy ?? "—"} tone="good" />
              <Metric label="Avg Hallucination" value={stats?.avg_hallucination ?? "—"} tone="bad" />
            </div>
          </div>

          <div className="rounded-2xl glass-strong p-6" data-testid="model-status">
            <div className="flex items-center justify-between">
              <div className="font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground">Model Status</div>
              <span className="flex items-center gap-1.5 font-mono uppercase tracking-[0.15em] text-[9px] text-verified">
                <span className="h-2 w-2 rounded-full bg-verified animate-pulse-dot" /> Active
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-accent" />
              <span className="font-display text-xl">gemini-3.1-pro-preview</span>
            </div>
            <div className="mt-1 font-mono text-[11px] text-muted-foreground">temp 0.2 · top-p 0.95</div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div><div className="font-mono uppercase tracking-[0.2em] text-[9px] text-muted-foreground">Grounding</div><div className="font-display text-lg text-accent">{stats ? Math.round(stats.grounding_ratio * 100) : "—"}%</div></div>
              <div><div className="font-mono uppercase tracking-[0.2em] text-[9px] text-muted-foreground">Latency</div><div className="font-display text-lg">{stats?.verification_latency_ms ?? "—"}ms</div></div>
              <div><div className="font-mono uppercase tracking-[0.2em] text-[9px] text-muted-foreground">Open Dev</div><div className="font-display text-lg text-rejected">{stats?.open_deviations ?? "—"}</div></div>
            </div>
          </div>

          <div className="rounded-2xl glass p-6" data-testid="system-actions">
            <div className="font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground mb-4">System Actions</div>
            <div className="space-y-2">
              {[
                { label: "Open Scan Intake", icon: Activity, to: "/dashboard/scan" },
                { label: "Booklet Marking Queue", icon: Gauge, to: "/dashboard/marking" },
                { label: "AI Deviation Audit", icon: AlertTriangle, to: "/dashboard/audit" },
                { label: "Reasoning & Evaluations", icon: Brain, to: "/dashboard/evaluations" },
              ].map((a) => (
                <button key={a.label} onClick={() => navigate(a.to)}
                  className="w-full flex items-center gap-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] px-4 py-3 transition-colors text-left">
                  <a.icon className="h-4 w-4 text-accent" />
                  <span className="font-sans text-sm">{a.label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
