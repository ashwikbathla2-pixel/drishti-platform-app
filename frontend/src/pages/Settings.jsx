import { useEffect, useState } from "react";
import { Cpu, Save, Database } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ScanBeam from "../components/ScanBeam";
import { fetchDevices } from "../lib/api";
import { toast } from "sonner";

const MODELS = ["gemini-2.5-flash", "gemini-3.1-pro-preview", "gemini-3-flash-preview"];

export default function Settings() {
  const [model, setModel] = useState(MODELS[1]);
  const [temp, setTemp] = useState(0.2);
  const [threshold, setThreshold] = useState(3);
  const [grounding, setGrounding] = useState("CBSE Syllabus, NCERT, Marking Scheme");
  const [devices, setDevices] = useState([]);

  useEffect(() => { fetchDevices().then(setDevices).catch(() => {}); }, []);

  return (
    <div className="space-y-10">
      <PageHeader stage="Control Panel" title="Verification Engine"
        description="Configure the grading model, reasoning temperature, grounding sources and the deviation threshold." />
      <ScanBeam />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl glass p-6 space-y-5">
          <div className="font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground flex items-center gap-2"><Cpu className="h-3.5 w-3.5 text-accent" /> Model</div>
          <select value={model} onChange={(e) => setModel(e.target.value)} data-testid="settings-model"
            className="w-full rounded-xl bg-black/30 border border-white/[0.06] px-4 py-2.5 font-sans text-sm outline-none focus:border-accent/40">
            {MODELS.map((m) => <option key={m} value={m} className="bg-popover">{m}</option>)}
          </select>

          <div>
            <div className="flex items-center justify-between font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground">
              <span>Temperature</span><span className="text-accent">{temp.toFixed(2)}</span>
            </div>
            <input type="range" min={0} max={1} step={0.05} value={temp} onChange={(e) => setTemp(Number(e.target.value))}
              data-testid="settings-temp" className="w-full mt-2 accent-[#e6c075]" />
          </div>

          <div>
            <div className="flex items-center justify-between font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground">
              <span>Deviation threshold</span><span className="text-accent">±{threshold}</span>
            </div>
            <input type="range" min={1} max={10} step={1} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))}
              data-testid="settings-threshold" className="w-full mt-2 accent-[#e6c075]" />
          </div>

          <div>
            <div className="font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground mb-2 flex items-center gap-2"><Database className="h-3.5 w-3.5" /> Grounding sources</div>
            <textarea value={grounding} onChange={(e) => setGrounding(e.target.value)} rows={3} data-testid="settings-grounding"
              className="w-full rounded-xl bg-black/30 border border-white/[0.06] p-3 font-sans text-sm outline-none focus:border-accent/40" />
          </div>

          <button onClick={() => toast.success("Settings saved")} data-testid="settings-save"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent text-[#050505] py-3 font-mono uppercase tracking-[0.15em] text-[10px] hover:bg-white transition-colors">
            <Save className="h-3.5 w-3.5" /> Save configuration
          </button>
        </div>

        <div className="rounded-2xl glass p-6">
          <div className="font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground mb-4">Devices & Stations</div>
          <div className="space-y-2">
            {devices.map((d) => (
              <div key={d.device_id} className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3 flex items-center justify-between" data-testid={`device-${d.device_id}`}>
                <div>
                  <p className="font-sans text-sm">{d.name}</p>
                  <p className="font-mono uppercase tracking-[0.15em] text-[9px] text-muted-foreground mt-0.5">{d.type}</p>
                </div>
                <span className={`flex items-center gap-1.5 font-mono uppercase tracking-[0.15em] text-[9px] ${d.status === "online" ? "text-verified" : "text-flagged"}`}>
                  <span className={`h-2 w-2 rounded-full ${d.status === "online" ? "bg-verified animate-pulse-dot" : "bg-flagged"}`} /> {d.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
