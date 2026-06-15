import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ScanLine, GraduationCap, ShieldCheck, Settings2, Loader2, Sparkles } from "lucide-react";
import { login } from "../lib/api";
import { ROLE_CARDS } from "../lib/data";
import { toast } from "sonner";

const ICONS = { ScanLine, GraduationCap, ShieldCheck, Settings2 };

export default function Login() {
  const navigate = useNavigate();
  const [loadingRole, setLoadingRole] = useState(null);

  const pick = async (roleId) => {
    setLoadingRole(roleId);
    try {
      await login(roleId);
      navigate("/dashboard");
    } catch (e) {
      toast.error("Could not sign in — backend unreachable. Please try again.");
      setLoadingRole(null);
    }
  };

  return (
    <div className="relative min-h-screen grid place-items-center bg-background px-6 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 h-[480px] w-[480px] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(230,192,117,0.18), transparent 65%)" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl rounded-3xl glass-strong p-8 sm:p-10" data-testid="login-card">
        <div className="flex items-center gap-2 font-mono uppercase tracking-[0.2em] text-[10px] text-accent">
          <Sparkles className="h-3.5 w-3.5" /> Drishti Console
        </div>
        <h1 className="font-display text-4xl sm:text-5xl mt-4">Who are you?</h1>
        <h2 className="font-display-italic text-lg text-muted-foreground mt-2">
          Pick the role you are working as. No password needed.
        </h2>

        <motion.div initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }}
          className="grid sm:grid-cols-2 gap-4 mt-8">
          {ROLE_CARDS.map((r) => {
            const Icon = ICONS[r.icon];
            const loading = loadingRole === r.id;
            return (
              <motion.button key={r.id} onClick={() => pick(r.id)} disabled={!!loadingRole}
                data-testid={`role-${r.id}`}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                className="group relative overflow-hidden text-left rounded-2xl glass p-5 hover:border-accent/40 transition-colors duration-300 disabled:opacity-60">
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ background: "linear-gradient(90deg, rgba(230,192,117,0.10), transparent)" }} />
                <div className="relative">
                  <div className="grid place-items-center h-11 w-11 rounded-xl bg-accent/10 border border-accent/25">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <div className="mt-4 font-display text-2xl">{r.name}</div>
                  <p className="font-sans text-sm text-muted-foreground mt-1 leading-relaxed">{r.who}</p>
                  {loading && (
                    <div className="mt-3 flex items-center gap-2 text-accent font-mono uppercase tracking-[0.2em] text-[10px]">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Signing in…
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
}
