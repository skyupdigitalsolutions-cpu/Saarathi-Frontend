import { useState, useEffect, useCallback } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import Sidebar from "./components/Sidebar.jsx";
import Copilot from "./components/Copilot.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Leads from "./pages/Leads.jsx";
import LeadDetail from "./pages/LeadDetail.jsx";
import Report from "./pages/Report.jsx";
import Messaging from "./pages/Messaging.jsx";
import WhatsApp from "./pages/WhatsApp.jsx";
import Settings from "./pages/Settings.jsx";
import { api } from "./lib/api.js";

const TITLES = {
  "/": "Dashboard",
  "/leads": "Leads",
  "/report": "Daily Report",
  "/messaging": "Messaging",
  "/whatsapp": "WhatsApp",
  "/settings": "Settings",
};

export default function App() {
  const [stats, setStats] = useState(null);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const { pathname } = useLocation();

  const loadStats = useCallback(() => {
    api.stats().then(setStats).catch(() => {});
  }, []);
  useEffect(() => { loadStats(); }, [loadStats]);

  const title = TITLES[pathname] || (pathname.startsWith("/leads/") ? "Lead detail" : "Saarathi CRM");

  return (
    <div className="app">
      <Sidebar stats={stats} />
      <div className="main">
        <header className="topbar">
          <div className="page-title">{title}</div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btn-sm" onClick={() => setCopilotOpen(true)}>
              <Sparkles size={15} color="var(--brand)" /> Ask Copilot
            </button>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Dashboard stats={stats} reload={loadStats} />} />
          <Route path="/leads" element={<Leads reload={loadStats} />} />
          <Route path="/leads/:id" element={<LeadDetail reload={loadStats} />} />
          <Route path="/report" element={<Report />} />
          <Route path="/messaging" element={<Messaging />} />
          <Route path="/whatsapp" element={<WhatsApp />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>

      {!copilotOpen && (
        <button className="copilot-fab" onClick={() => setCopilotOpen(true)} title="Ask Saarathi Copilot">
          <Sparkles />
        </button>
      )}
      <Copilot open={copilotOpen} onClose={() => setCopilotOpen(false)} onChanged={loadStats} />
    </div>
  );
}
