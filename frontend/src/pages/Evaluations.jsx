import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Gauge, Brain, AlertTriangle } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ScanBeam from "../components/ScanBeam";
import { fetchGeneration, fetchGenerations } from "../lib/api";

function Stat({ icon: Icon, label, value, tone }) {
  const color = tone === "bad" ? "text-rejected" : "text-verified";
  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4" /><span className="font-mono uppercase tracking-[0.2em] text-[10px]">{label}</span></div>
      <div className={`font-display text-4xl mt-2 ${color}`}>{value}%</div>
    </div>
  );
}

export default function Evaluations() {
  const [params] = useSearchParams();
  const [gen, setGen] = useState(null);
  const [list, setList] = useState([]);

  useEffect(() => {
    const id = params.get("gen");
    if (id) fetchGeneration(id).then(setGen).catch(() => {});
    else fetchGenerations().then(setList).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-10">
      <PageHeader stage="Evaluation Detail" title="Reasoning & Verification"
        description="Per-answer accuracy, reasoning completeness, hallucination risk and the reasoning trace." />
      <ScanBeam />

      {gen ? (
        <div className="space-y-6">
          <div className="rounded-2xl glass p-6">
            <div className="font-mono uppercase tracking-[0.2em] text-[10px] text-accent/80">{gen.subject}</div>
            <h3 className="font-display text-2xl mt-2">{gen.prompt}</h3>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Stat icon={Gauge} label="Accuracy" value={gen.accuracy} />
            <Stat icon={Brain} label="Reasoning" value={gen.reasoning} />
            <Stat icon={AlertTriangle} label="Hallucination Risk" value={gen.hallucination} tone="bad" />
          </div>
          <div className="rounded-2xl glass-strong p-6">
            <div className="font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground mb-3">Reasoning Trace</div>
            <ol className="space-y-3">
              {(gen.reasoning_trace || []).map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid place-items-center h-6 w-6 shrink-0 rounded-full bg-accent/10 border border-accent/25 font-mono text-[10px] text-accent">{i + 1}</span>
                  <p className="font-sans text-sm text-foreground/90 leading-relaxed">{s}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl glass overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-white/[0.06]">
              {["Prompt", "Subject", "Accuracy", "Hallucination"].map((h) => (
                <th key={h} className="text-left font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground px-5 py-3">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {list.map((g) => (
                <tr key={g.id} className="border-b border-white/[0.03]">
                  <td className="px-5 py-4 font-sans text-sm line-clamp-1">{g.prompt}</td>
                  <td className="px-5 py-4 font-sans text-sm text-muted-foreground">{g.subject}</td>
                  <td className="px-5 py-4 font-mono text-sm text-verified">{g.accuracy}%</td>
                  <td className="px-5 py-4 font-mono text-sm text-rejected">{g.hallucination}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
