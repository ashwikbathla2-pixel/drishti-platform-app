import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, BookOpen } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ScanBeam from "../components/ScanBeam";
import StatusPill from "../components/StatusPill";
import { fetchGenerations, fetchQueue } from "../lib/api";

export default function History() {
  const navigate = useNavigate();
  const [gens, setGens] = useState([]);
  const [bundles, setBundles] = useState([]);

  useEffect(() => {
    fetchGenerations().then(setGens).catch(() => {});
    fetchQueue().then(setBundles).catch(() => {});
  }, []);

  return (
    <div className="space-y-10">
      <PageHeader stage="Archive" title="History"
        description="Every generation and every ingested booklet, in one place." />
      <ScanBeam />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl glass p-6">
          <div className="font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground mb-4 flex items-center gap-2"><BookOpen className="h-3.5 w-3.5" /> Generations</div>
          <div className="space-y-2">
            {gens.map((g) => (
              <button key={g.id} onClick={() => navigate(`/dashboard/evaluations?gen=${g.id}`)}
                className="w-full text-left rounded-xl bg-white/[0.02] border border-white/[0.05] p-3 hover:border-white/15 transition-colors" data-testid={`hist-gen-${g.id}`}>
                <p className="font-sans text-sm line-clamp-1">{g.prompt}</p>
                <div className="mt-2 flex items-center gap-4 font-mono text-[10px]">
                  <span className="text-verified">ACC {g.accuracy}%</span>
                  <span className="text-rejected">HALLU {g.hallucination}%</span>
                  <span className="text-muted-foreground ml-auto">{g.subject}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl glass p-6">
          <div className="font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground mb-4 flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> Booklets</div>
          <div className="space-y-2">
            {bundles.map((b) => (
              <div key={b.bundle_id} className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3 flex items-center justify-between" data-testid={`hist-bundle-${b.bundle_id}`}>
                <div>
                  <p className="font-mono text-xs">{b.candidate_code}</p>
                  <p className="font-sans text-xs text-muted-foreground mt-0.5">{b.subject} · {b.page_count} pages</p>
                </div>
                <StatusPill status={b.status} label={b.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
