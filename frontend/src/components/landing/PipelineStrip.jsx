import { FileText, Brain, ShieldCheck } from "lucide-react";

const STEPS = [
  { icon: FileText, label: "Structure", text: "A grounded answer is generated against the prescribed scheme." },
  { icon: Brain, label: "Reasoning constraints", text: "The model reasons under explicit rubric constraints, step by step." },
  { icon: ShieldCheck, label: "Factual verification", text: "Every claim is verified against the reference — illegible stays null." },
];

export function PipelineStrip() {
  return (
    <div className="grid gap-4 md:grid-cols-3" data-testid="pipeline-strip">
      {STEPS.map((s, i) => (
        <div key={s.label} className="relative rounded-2xl glass p-6">
          <div className="font-mono uppercase tracking-[0.2em] text-[10px] text-accent/70">Step {i + 1}</div>
          <div className="mt-4 grid place-items-center h-11 w-11 rounded-xl bg-accent/10 border border-accent/25">
            <s.icon className="h-5 w-5 text-accent" />
          </div>
          <h3 className="mt-4 font-display text-2xl">{s.label}</h3>
          <p className="mt-2 font-sans text-sm text-muted-foreground leading-relaxed">{s.text}</p>
          {i < STEPS.length - 1 && (
            <div className="hidden md:block absolute top-1/2 -right-2 h-px w-4 bg-accent/30" />
          )}
        </div>
      ))}
    </div>
  );
}

export default PipelineStrip;
