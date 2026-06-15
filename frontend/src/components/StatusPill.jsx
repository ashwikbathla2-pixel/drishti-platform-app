const MAP = {
  verified: "text-verified border-verified/25 bg-verified/10",
  ok: "text-verified border-verified/25 bg-verified/10",
  ready: "text-verified border-verified/25 bg-verified/10",
  finalized: "text-verified border-verified/25 bg-verified/10",
  upheld: "text-verified border-verified/25 bg-verified/10",
  rejected: "text-rejected border-rejected/25 bg-rejected/10",
  blurry: "text-rejected border-rejected/25 bg-rejected/10",
  reevaluate: "text-rejected border-rejected/25 bg-rejected/10",
  flagged: "text-flagged border-flagged/25 bg-flagged/10",
  in_review: "text-flagged border-flagged/25 bg-flagged/10",
  processing: "text-flagged border-flagged/25 bg-flagged/10",
  neutral: "text-muted-foreground border-white/10 bg-white/[0.03]",
};

export function StatusPill({ status, label, className = "", ...rest }) {
  const key = (status || "neutral").toString().toLowerCase();
  const cls = MAP[key] || MAP.neutral;
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.2em] text-[10px] px-2.5 py-1 rounded-full border ${cls} ${className}`}
      {...rest}
    >
      {label || status}
    </span>
  );
}

export default StatusPill;
