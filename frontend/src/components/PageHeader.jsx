export function PageHeader({ stage, title, description, right }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" data-testid="page-header">
      <div className="space-y-2">
        <div className="font-mono uppercase tracking-[0.2em] text-[10px] text-accent/80 flex items-center gap-2">
          <span className="inline-block h-[6px] w-[6px] rounded-full bg-accent" />
          {stage}
        </div>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.05] text-foreground">{title}</h1>
        {description && (
          <p className="font-sans text-sm text-muted-foreground max-w-2xl leading-relaxed">{description}</p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

export default PageHeader;
