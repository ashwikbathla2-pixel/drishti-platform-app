import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Sparkles, LayoutDashboard, ScanLine, PenLine, Scale, History, Settings,
  Menu, X, LogOut,
} from "lucide-react";
import { getCurrentUser, clearToken } from "../lib/api";
import FilmGrain from "./FilmGrain";

const NAV = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/dashboard/scan", label: "Scan Intake", icon: ScanLine },
  { to: "/dashboard/marking", label: "Booklet Marking", icon: PenLine },
  { to: "/dashboard/audit", label: "AI Deviation Audit", icon: Scale },
  { to: "/dashboard/history", label: "History", icon: History },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

const ROLE_LABEL = {
  scan_operator: "Scan Operator", evaluator: "Evaluator",
  moderator: "Moderator", admin: "Administrator",
};

function Rail({ onNavigate }) {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const switchRole = () => { clearToken(); navigate("/login"); };

  return (
    <div className="flex h-full flex-col" style={{ background: "rgba(3,3,3,0.85)", backdropFilter: "blur(40px) saturate(1.8)" }}>
      <div className="px-5 pt-6 pb-4">
        <button onClick={() => { navigate("/dashboard"); onNavigate && onNavigate(); }} className="flex items-center gap-2.5" data-testid="shell-brand">
          <span className="grid place-items-center h-8 w-8 rounded-lg bg-accent/15 border border-accent/30">
            <Sparkles className="h-4 w-4 text-accent" />
          </span>
          <span className="font-display text-2xl leading-none">Drishti</span>
        </button>
      </div>
      <div className="px-5 font-mono uppercase tracking-[0.2em] text-[10px] text-muted-foreground mb-3">Workspace</div>

      <nav className="relative px-3 flex-1 space-y-1">
        <span className="absolute left-[26px] top-2 bottom-2 w-px bg-white/[0.06]" />
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} onClick={() => onNavigate && onNavigate()}
            data-testid={`nav-${n.label.toLowerCase().replace(/\s/g, "-")}`}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-300 ${
                isActive ? "text-foreground" : "text-sidebar-foreground hover:text-foreground"
              }`}>
            {({ isActive }) => (
              <>
                <span className={`grid place-items-center h-7 w-7 rounded-lg border transition-colors duration-300 ${
                  isActive ? "bg-accent text-[#050505] border-accent" : "bg-white/[0.02] border-white/[0.06]"
                }`}>
                  <n.icon className="h-4 w-4" />
                </span>
                <span className="font-sans text-sm">{n.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3">
        <div className="rounded-2xl glass p-3" data-testid="identity-card">
          {user ? (
            <>
              <div className="font-display text-lg leading-tight">{user.name}</div>
              <div className="font-mono uppercase tracking-[0.2em] text-[9px] text-muted-foreground mt-0.5">
                {ROLE_LABEL[user.role] || user.role}
              </div>
              <button onClick={switchRole} data-testid="switch-role"
                className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] transition-colors py-2 font-mono uppercase tracking-[0.15em] text-[10px]">
                <LogOut className="h-3.5 w-3.5" /> Switch role
              </button>
            </>
          ) : (
            <button onClick={() => navigate("/login")} className="font-sans text-sm text-accent">Sign in — who are you?</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AppShell() {
  const [open, setOpen] = useState(false);
  return (
    <div className="grain min-h-screen bg-background">
      {/* desktop rail */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 border-r border-white/[0.06] z-30">
        <Rail />
      </aside>

      {/* mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-5 py-4 glass-nav">
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center h-8 w-8 rounded-lg bg-accent/15 border border-accent/30">
            <Sparkles className="h-4 w-4 text-accent" />
          </span>
          <span className="font-display text-2xl leading-none">Drishti</span>
        </div>
        <button onClick={() => setOpen(true)} data-testid="mobile-menu"><Menu className="h-5 w-5" /></button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-white/[0.06]">
            <button onClick={() => setOpen(false)} className="absolute top-5 right-4 z-10"><X className="h-5 w-5" /></button>
            <Rail onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 py-8 sm:py-12">
          <Outlet />
        </div>
      </main>
      <FilmGrain />
    </div>
  );
}
