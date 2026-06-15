import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, ArrowLeft } from "lucide-react";

export function PageViewer({ title, pageCount, getImageUrl, onBack, onViewedChange }) {
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [viewed, setViewed] = useState(() => new Set([1]));

  useEffect(() => {
    setViewed((prev) => {
      if (prev.has(page)) return prev;
      const next = new Set(prev);
      next.add(page);
      return next;
    });
  }, [page]);

  useEffect(() => {
    onViewedChange && onViewedChange(Array.from(viewed));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewed]);

  const go = (d) => setPage((p) => Math.min(pageCount, Math.max(1, p + d)));

  return (
    <div className="rounded-2xl glass overflow-hidden flex flex-col" data-testid="page-viewer">
      {/* control bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} data-testid="viewer-back"
              className="flex items-center gap-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] transition-colors px-3 py-1.5 font-mono uppercase tracking-[0.15em] text-[10px]">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Queue
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setZoom((z) => Math.max(50, z - 25))} data-testid="viewer-zoom-out"
            className="grid place-items-center h-7 w-7 rounded-lg bg-white/[0.03] hover:bg-white/[0.07]"><ZoomOut className="h-3.5 w-3.5" /></button>
          <span className="font-mono text-[11px] text-muted-foreground w-12 text-center">{zoom}%</span>
          <button onClick={() => setZoom((z) => Math.min(200, z + 25))} data-testid="viewer-zoom-in"
            className="grid place-items-center h-7 w-7 rounded-lg bg-white/[0.03] hover:bg-white/[0.07]"><ZoomIn className="h-3.5 w-3.5" /></button>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <button onClick={() => go(-1)} data-testid="viewer-prev" className="grid place-items-center h-7 w-7 rounded-lg bg-white/[0.03] hover:bg-white/[0.07]"><ChevronLeft className="h-3.5 w-3.5" /></button>
          <span className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">Page {page} of {pageCount}</span>
          <button onClick={() => go(1)} data-testid="viewer-next" className="grid place-items-center h-7 w-7 rounded-lg bg-white/[0.03] hover:bg-white/[0.07]"><ChevronRight className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {/* canvas */}
      <div className="relative bg-black/60 overflow-auto" style={{ height: "560px" }}>
        <div className="min-h-full grid place-items-center p-6">
          <img src={getImageUrl(page)} alt={`${title} page ${page}`}
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center top" }}
            className="max-w-full rounded-lg shadow-2xl transition-transform duration-200" data-testid="viewer-image" />
        </div>
        <div className="absolute top-3 left-3 rounded-full glass px-3 py-1 font-mono uppercase tracking-[0.2em] text-[9px] text-accent" data-testid="viewer-viewed-count">
          Viewed: {viewed.size} / {pageCount} pages
        </div>
      </div>

      {/* thumbnail strip */}
      <div className="flex gap-2 overflow-x-auto p-3 border-t border-white/[0.06]">
        {Array.from({ length: pageCount }).map((_, i) => {
          const n = i + 1;
          return (
            <button key={n} onClick={() => setPage(n)} data-testid={`thumb-${n}`}
              className={`relative shrink-0 h-16 w-12 rounded-md overflow-hidden border transition-all ${
                page === n ? "border-accent" : "border-white/10 hover:border-white/30"
              }`}>
              <img src={getImageUrl(n)} alt={`thumb ${n}`} className="h-full w-full object-cover" loading="lazy" />
              {viewed.has(n) && <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-verified" />}
              <span className="absolute bottom-0 inset-x-0 bg-black/60 font-mono text-[8px] text-center">{n}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PageViewer;
