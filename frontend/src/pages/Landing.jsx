import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, FileText, Gauge, Lightbulb, Database } from "lucide-react";
import Dither from "../components/landing/Dither";
import LandingNav from "../components/landing/LandingNav";
import HeroScanner from "../components/landing/HeroScanner";
import SpotlightCard from "../components/landing/SpotlightCard";
import PipelineStrip from "../components/landing/PipelineStrip";
import ScanBeam from "../components/ScanBeam";

const FEATURES = [
  { icon: FileText, title: "Answer Generation", text: "Structured, syllabus-grounded answers produced under explicit rubric constraints." },
  { icon: Gauge, title: "Evaluation", text: "Independent second-reader grading against an 80-mark CBSE marking scheme." },
  { icon: Lightbulb, title: "Explainability", text: "Per-question justification and confidence — every mark is defensible." },
  { icon: Database, title: "Knowledge Grounding", text: "Verified against the reference corpus; illegible stays null, never guessed." },
];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("is-visible"); });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export default function Landing() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  useReveal();

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      <LandingNav />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-28 pb-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 opacity-90">
            <Dither waveColor={[0.902, 0.753, 0.459]} waveSpeed={0.12} waveFrequency={3}
              waveAmplitude={0.3} colorNum={4} pixelSize={2} mouseRadius={0.7} enableMouseInteraction />
          </div>
          <div className="absolute inset-0" style={{ background: "radial-gradient(900px circle at 72% 32%, rgba(230,192,117,0.12), transparent 60%)" }} />
          <div className="absolute inset-0" style={{ background: "rgba(5,5,8,0.28)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(5,5,8,0.72) 0%, rgba(5,5,8,0.30) 48%, transparent 82%)" }} />
          <div className="absolute inset-x-0 bottom-0 h-72" style={{ background: "linear-gradient(180deg, transparent, #050508)" }} />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 sm:px-8 grid lg:grid-cols-2 gap-14 items-center w-full">
          <motion.div initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}>
            {[
              <div key="e" className="font-mono uppercase tracking-[0.2em] text-[11px] text-accent flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" /> AI Answer & Evaluation Platform
              </div>,
              <h1 key="h" className="font-display text-5xl sm:text-6xl lg:text-[4.2rem] leading-[1.02] mt-5">
                Answers That Think Before They Speak.
              </h1>,
              <h2 key="s" className="font-display-italic text-xl sm:text-2xl text-muted-foreground mt-5">
                Generate structured, evaluated, and explainable answers.
              </h2>,
              <p key="p" className="font-sans text-base text-muted-foreground/90 mt-5 max-w-lg leading-relaxed">
                Drishti is a forensic on-screen marking workspace — it scans answer booklets, verifies
                every page, and grades against an 80-mark CBSE reference with a justification per question.
              </p>,
              <div key="c" className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
                <button onClick={() => navigate("/login")} data-testid="hero-open-console"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-accent text-[#050505] font-mono uppercase tracking-[0.15em] text-[11px] px-6 py-3 hover:bg-white transition-colors duration-300">
                  Open Console <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <div className="flex items-center gap-2 rounded-full glass px-2 py-2">
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu"
                    data-testid="waitlist-email"
                    className="bg-transparent outline-none font-sans text-sm px-3 w-40 placeholder:text-muted-foreground/60" />
                  <button onClick={() => email && setJoined(true)} data-testid="waitlist-join"
                    className="rounded-full bg-white/5 hover:bg-white/10 transition-colors font-mono uppercase tracking-[0.15em] text-[10px] px-4 py-1.5">
                    {joined ? "Added ✓" : "Join Waitlist"}
                  </button>
                </div>
              </div>,
            ].map((child, i) => (
              <motion.div key={i} variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } } }}>
                {child}
              </motion.div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}>
            <HeroScanner />
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 sm:px-8"><ScanBeam /></div>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 sm:px-8 py-24">
        <div className="reveal">
          <div className="font-mono uppercase tracking-[0.2em] text-[11px] text-accent/80">Platform Capabilities</div>
          <h2 className="font-display-italic text-3xl sm:text-4xl mt-3 max-w-xl">Rigorously evaluated answers, by design.</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          {FEATURES.map((f) => (
            <SpotlightCard key={f.title} className="reveal" data-testid={`feature-${f.title.toLowerCase().replace(/\s/g, "-")}`}>
              <div className="grid place-items-center h-11 w-11 rounded-xl bg-accent/10 border border-accent/25">
                <f.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-display text-2xl mt-5">{f.title}</h3>
              <p className="font-sans text-sm text-muted-foreground mt-2 leading-relaxed">{f.text}</p>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 sm:px-8 py-24">
        <div className="reveal mb-12">
          <div className="font-mono uppercase tracking-[0.2em] text-[11px] text-accent/80">How it works</div>
          <h2 className="font-display-italic text-3xl sm:text-4xl mt-3 max-w-2xl">Three steps from prompt to verified response.</h2>
        </div>
        <div className="reveal"><PipelineStrip /></div>
      </section>

      {/* CTA */}
      <section className="relative py-28">
        <div className="absolute inset-0" style={{ background: "radial-gradient(600px circle at 50% 50%, rgba(230,192,117,0.08), transparent 70%)" }} />
        <div className="relative mx-auto max-w-3xl px-6 text-center reveal">
          <h2 className="font-display-italic text-4xl sm:text-5xl">Think Better. Answer Better.</h2>
          <button onClick={() => navigate("/login")} data-testid="cta-launch"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent text-[#050505] font-mono uppercase tracking-[0.15em] text-[11px] px-7 py-3.5 hover:bg-white transition-colors duration-300">
            Launch Drishti Console <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 sm:px-8"><div className="hairline" /></div>
      <footer className="mx-auto max-w-6xl px-6 sm:px-8 py-10">
        <p className="font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground">
          Drishti Answer Platform · Forensic AI verification & structured output generation
        </p>
      </footer>
    </div>
  );
}
