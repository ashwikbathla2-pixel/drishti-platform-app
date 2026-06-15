import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, Sparkles, BookOpen, ArrowUpRight } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ScanBeam from "../components/ScanBeam";
import { generateAnswer, fetchGeneration } from "../lib/api";

function ScoreBar({ label, value, tone }) {
  const color = tone === "bad" ? "bg-rejected" : tone === "warn" ? "bg-flagged" : "bg-verified";
  return (
    <div>
      <div className="flex items-center justify-between font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground">
        <span>{label}</span><span className="text-foreground">{value}%</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function Answers() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [gen, setGen] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const genId = params.get("gen");
    const prompt = params.get("prompt");
    const subject = params.get("subject") || "Business Studies";
    if (genId) {
      setLoading(true);
      fetchGeneration(genId).then(setGen).finally(() => setLoading(false));
    } else if (prompt) {
      setLoading(true);
      generateAnswer(prompt, subject).then(setGen).finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-10">
      <PageHeader stage="Answer Workspace" title="Grounded Answer"
        description="Structured answer generated under rubric constraints, with inline grounding sources." />
      <ScanBeam />

      {loading && (
        <div className="rounded-2xl glass p-16 grid place-items-center" data-testid="answer-loading">
          <Loader2 className="h-8 w-8 text-accent animate-spin" />
          <p className="font-sans text-sm text-muted-foreground mt-3">Generating & evaluating…</p>
        </div>
      )}

      {!loading && !gen && (
        <div className="rounded-2xl glass p-16 text-center">
          <Sparkles className="h-8 w-8 text-accent mx-auto" />
          <p className="font-sans text-sm text-muted-foreground mt-3">Ask a question from the <button onClick={() => navigate("/dashboard")} className="text-accent">Operations Home</button>.</p>
        </div>
      )}

      {!loading && gen && (
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
          <div className="rounded-2xl glass p-6">
            <div className="font-mono uppercase tracking-[0.2em] text-[10px] text-accent/80">Prompt · {gen.subject}</div>
            <h3 className="font-display text-2xl mt-2">{gen.prompt}</h3>
            <div className="hairline my-5" />
            <p className="font-sans text-base text-foreground/90 leading-relaxed whitespace-pre-line" data-testid="answer-body">{gen.answer}</p>
            <div className="mt-6">
              <div className="font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground mb-2 flex items-center gap-2"><BookOpen className="h-3.5 w-3.5" /> Grounding sources</div>
              <div className="flex flex-wrap gap-2">
                {(gen.sources || []).map((s) => (
                  <span key={s} className="rounded-full glass px-3 py-1 font-mono uppercase tracking-[0.15em] text-[9px] text-muted-foreground">{s}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl glass-strong p-6 space-y-4" data-testid="answer-scores">
              <div className="font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground">Evaluation</div>
              <ScoreBar label="Accuracy" value={gen.accuracy} tone="good" />
              <ScoreBar label="Reasoning Completeness" value={gen.reasoning} tone="good" />
              <ScoreBar label="Hallucination Risk" value={gen.hallucination} tone="bad" />
            </div>
            <button onClick={() => navigate(`/dashboard/evaluations?gen=${gen.id}`)} data-testid="open-evaluation"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent text-[#050505] py-3 font-mono uppercase tracking-[0.15em] text-[10px] hover:bg-white transition-colors">
              Open Evaluation Detail <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
