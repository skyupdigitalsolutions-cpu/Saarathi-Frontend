import { useState, useEffect, useCallback } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { Sparkles, Menu } from "lucide-react";
import Sidebar from "./components/Sidebar.jsx";
import Copilot from "./components/Copilot.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Leads from "./pages/Leads.jsx";
import LeadDetail from "./pages/LeadDetail.jsx";
import Report from "./pages/Report.jsx";
import Messaging from "./pages/Messaging.jsx";
import WhatsApp from "./pages/WhatsApp.jsx";
import Campaigns from "./pages/Campaigns.jsx";
import Settings from "./pages/Settings.jsx";
import DevPanel from "./pages/DevPanel.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Login from "./components/Login.jsx";
import ExpiryBanner from "./components/ExpiryBanner.jsx";
import LockScreen from "./components/LockScreen.jsx";
import TermsGate from "./components/TermsGate.jsx";
import { api, getToken, setToken } from "./lib/api.js";

const TITLES = {
  "/": "Dashboard",
  "/leads": "Leads",
  "/report": "Daily Report",
  "/messaging": "Messaging",
  "/whatsapp": "WhatsApp",
  "/campaigns": "Campaigns",
  "/settings": "Settings",
};

function AppShell({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sub, setSub] = useState(null);
  const { pathname } = useLocation();

  const loadStats = useCallback(() => { api.stats().then(setStats).catch(() => {}); }, []);
  const loadSub = useCallback(() => { api.subscriptionStatus().then(setSub).catch(() => {}); }, []);

  useEffect(() => { loadStats(); loadSub(); }, [loadStats, loadSub]);
  useEffect(() => { const t = setInterval(loadSub, 5 * 60 * 1000); return () => clearInterval(t); }, [loadSub]);
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const title = TITLES[pathname] || (pathname.startsWith("/leads/") ? "Lead detail" : "Saarathi CRM");

  if (sub && sub.locked) return <LockScreen status={sub} />;

  return (
    <div className="app">
      <Sidebar stats={stats} user={user} onLogout={onLogout} open={menuOpen} onClose={() => setMenuOpen(false)} />
      {menuOpen && <div className="sidebar-scrim" onClick={() => setMenuOpen(false)} />}
      <div className="main">
        <header className="topbar">
          <button className="hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu /></button>
          <div className="page-title">{title}</div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btn-sm" onClick={() => setCopilotOpen(true)}>
              <Sparkles size={15} color="var(--brand)" /> <span className="btn-label">Ask Copilot</span>
            </button>
          </div>
        </header>

        <ExpiryBanner status={sub} />

        <Routes>
          <Route path="/" element={<Dashboard stats={stats} reload={loadStats} />} />
          <Route path="/leads" element={<Leads reload={loadStats} />} />
          <Route path="/leads/:id" element={<LeadDetail reload={loadStats} />} />
          <Route path="/report" element={<Report />} />
          <Route path="/messaging" element={<Messaging />} />
          <Route path="/whatsapp" element={<WhatsApp />} />
          <Route path="/campaigns" element={<Campaigns />} />
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

export default function App() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [auth, setAuth] = useState({ loading: true, user: null });

  const loadMe = useCallback(async () => {
    if (!getToken()) { setAuth({ loading: false, user: null }); return; }
    try {
      const { user } = await api.me();
      setAuth({ loading: false, user });
    } catch {
      setToken(null);
      setAuth({ loading: false, user: null });
    }
  }, []);
  useEffect(() => { loadMe(); }, [loadMe]);

  // Public routes (no login required)
  if (pathname === "/forgot") return <ForgotPassword />;
  if (pathname === "/reset") return <ResetPassword />;
  // Developer panel manages its own developer login
  if (pathname.startsWith("/dev")) return <DevPanel />;

  if (auth.loading) return <div className="auth-screen" />;

  if (!auth.user) {
    return <Login onAuthed={(u) => { setAuth({ loading: false, user: u }); navigate("/"); }} />;
  }

  // Developers belong in the developer panel, not the user CRM — keep them separate.
  if (auth.user.role === "developer") return <Navigate to="/dev" replace />;

  // First-time login: show blocking T&C gate until accepted.
  if (!auth.user.termsAccepted) {
    return (
      <TermsGate
        onAccept={async () => {
          const { user } = await api.acceptTerms();
          setAuth({ loading: false, user });
        }}
        onLogout={() => { setToken(null); setAuth({ loading: false, user: null }); }}
      />
    );
  }

  // Logged in — if sitting on /login, send home
  if (pathname === "/login") return <Navigate to="/" replace />;

  return (
    <AppShell
      user={auth.user}
      onLogout={() => { setToken(null); setAuth({ loading: false, user: null }); navigate("/login"); }}
    />
  );
}
