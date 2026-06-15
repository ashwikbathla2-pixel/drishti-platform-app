import "@/index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { isAuthed } from "@/lib/api";
import AppShell from "@/components/AppShell";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ScanIntake from "@/pages/ScanIntake";
import Marking from "@/pages/Marking";
import Audit from "@/pages/Audit";
import HistoryPage from "@/pages/History";
import SettingsPage from "@/pages/Settings";
import Answers from "@/pages/Answers";
import Evaluations from "@/pages/Evaluations";

function Guard({ children }) {
  return isAuthed() ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" theme="dark" toastOptions={{
        style: { background: "#0a0a09", border: "1px solid rgba(255,255,255,0.08)", color: "#f0ece4", fontFamily: "Libre Caslon Text, serif" },
      }} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Guard><AppShell /></Guard>}>
          <Route index element={<Dashboard />} />
          <Route path="scan" element={<ScanIntake />} />
          <Route path="marking" element={<Marking />} />
          <Route path="audit" element={<Audit />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="answers" element={<Answers />} />
          <Route path="evaluations" element={<Evaluations />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
