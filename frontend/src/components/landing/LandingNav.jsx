import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Menu, X } from "lucide-react";

const lerp = (a, b, t) => a + (b - a) * t;

export function LandingNav() {
  const navigate = useNavigate();
  const [p, setP] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const prog = Math.min(window.scrollY / 200, 1);
      setP(prog);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const style = {
    "--nav-radius": `${lerp(0, 22, p)}px`,
    marginTop: `${lerp(0, 14, p)}px`,
    width: `calc(100% - ${lerp(0, 48, p)}px)`,
    paddingTop: `${lerp(20, 12, p)}px`,
    paddingBottom: `${lerp(20, 12, p)}px`,
    borderRadius: `var(--nav-radius)`,
    backgroundColor: `rgba(5,5,5,${lerp(0.2, 0.7, p)})`,
    transition: "all 0.7s var(--ease-cinematic)",
  };

  const links = [
    { label: "Capabilities", href: "#features" },
    { label: "How it works", href: "#how" },
  ];

  return (
    <header className="fixed left-1/2 -translate-x-1/2 top-0 z-40 mx-auto max-w-6xl px-6 sm:px-8 flex items-center justify-between glass-nav"
      style={style} data-testid="landing-nav">
      <button onClick={() => navigate("/")} className="flex items-center gap-2.5" data-testid="nav-brand">
        <span className="grid place-items-center h-8 w-8 rounded-lg bg-accent/15 border border-accent/30">
          <Sparkles className="h-4 w-4 text-accent" />
        </span>
        <span className="font-display text-2xl leading-none">
          <span className="text-foreground">Drish</span>
          <span className="font-display-italic text-accent">ti</span>
        </span>
      </button>

      <nav className="hidden md:flex items-center gap-8">
        {links.map((l) => (
          <a key={l.label} href={l.href} className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
            {l.label}
          </a>
        ))}
        <button onClick={() => navigate("/login")} data-testid="nav-open-console"
          className="rounded-full bg-accent text-[#050505] font-mono uppercase tracking-[0.15em] text-[11px] px-5 py-2 hover:bg-white transition-colors duration-300">
          Open Console
        </button>
      </nav>

      <button className="md:hidden text-foreground" onClick={() => setOpen((o) => !o)} data-testid="nav-burger">
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-strong rounded-2xl p-5 flex flex-col gap-4 md:hidden">
          {links.map((l) => (
            <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="font-sans text-sm text-muted-foreground">{l.label}</a>
          ))}
          <button onClick={() => navigate("/login")} className="rounded-full bg-accent text-[#050505] font-mono uppercase tracking-[0.15em] text-[11px] px-5 py-2.5">
            Open Console
          </button>
        </div>
      )}
    </header>
  );
}

export default LandingNav;
