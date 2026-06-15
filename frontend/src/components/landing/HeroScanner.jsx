import { ScanLine, CheckCircle2 } from "lucide-react";

export function HeroScanner() {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-[3/4] rounded-2xl glass-strong overflow-hidden" data-testid="hero-scanner">
      {/* faux document */}
      <div className="absolute inset-5 rounded-xl bg-[#0c0b0a] border border-white/10 p-5 overflow-hidden">
        <div className="font-mono uppercase tracking-[0.2em] text-[9px] text-accent/70 mb-3">CBSE · Answer Booklet</div>
        <div className="space-y-2.5">
          {Array.from({ length: 13 }).map((_, i) => (
            <div key={i} className="h-1.5 rounded-full bg-white/[0.06]" style={{ width: `${55 + ((i * 37) % 42)}%` }} />
          ))}
        </div>
        <div className="mt-5 flex items-center gap-2 text-verified">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="font-mono uppercase tracking-[0.2em] text-[9px]">Sharpness OK</span>
        </div>
      </div>

      {/* scanning beam */}
      <div className="absolute left-5 right-5 h-16 pointer-events-none animate-beam-sweep"
        style={{ background: "linear-gradient(180deg, transparent, rgba(230,192,117,0.18) 50%, transparent)" }} />
      <div className="absolute left-5 right-5 top-0 h-px bg-accent/60 animate-beam-sweep" />

      <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-accent">
          <ScanLine className="h-3.5 w-3.5" />
          <span className="font-mono uppercase tracking-[0.2em] text-[9px]">Scanning</span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">2048 px</span>
      </div>
    </div>
  );
}

export default HeroScanner;
