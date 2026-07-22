import { NavLink } from "react-router-dom";
import { useState } from "react";
import { LayoutDashboard, Users, MessageSquare, Settings, FileText, MessageCircle, Megaphone, LogOut, X } from "lucide-react";
import { Logo } from "./ui.jsx";
import { TERMS_INTRO, TERMS_SECTIONS } from "../lib/termsContent.js";

function TermsModal({ onClose }) {
  return (
    <div className="tg-overlay" onClick={onClose}>
      <div className="tg-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="tg-head">
          <div>
            <div className="tg-title">Terms &amp; Conditions</div>
            <div className="tg-subtitle">Saarathi CRM · Effective 20 July 2026</div>
          </div>
          <button
            className="btn-ghost"
            onClick={onClose}
            style={{ padding: 4, marginLeft: "auto" }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body — inline content, no iframe */}
        <div className="tg-body">
          <p className="tg-intro">{TERMS_INTRO}</p>
          {TERMS_SECTIONS.map((s, i) => (
            <div key={i} className="tg-section">
              <span className="tg-sec-head">{s.heading} </span>
              <span className="tg-sec-body">{s.body}</span>
            </div>
          ))}
          <div className="tg-end-marker">— End of Terms &amp; Conditions —</div>
        </div>

        {/* Footer */}
        <div className="tg-foot">
          <div className="tg-actions" style={{ justifyContent: "flex-end" }}>
            <button className="btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ stats, user, onLogout, open, onClose }) {
  const newToday = stats?.kpis?.today;
  const overdue = stats?.kpis?.overdueFollowUps;
  const [termsOpen, setTermsOpen] = useState(false);

  const link = ({ isActive }) => "nav-item" + (isActive ? " active" : "");

  return (
    <aside className={"sidebar" + (open ? " open" : "")}>
      <div className="brand">
        <div className="brand-mark"><Logo /></div>
        <div>
          <div className="brand-name">Saarathi</div>
          <div className="brand-sub">Associates</div>
        </div>
      </div>

      <nav className="nav">
        <div className="nav-label">Workspace</div>
        <NavLink to="/" end className={link}>
          <LayoutDashboard /> Dashboard
        </NavLink>
        <NavLink to="/leads" className={link}>
          <Users /> Leads
          {newToday ? <span className="nav-badge">{newToday}</span> : null}
        </NavLink>
        <NavLink to="/report" className={link}>
          <FileText /> Daily Report
        </NavLink>
        <NavLink to="/messaging" className={link}>
          <MessageSquare /> Messaging
        </NavLink>
        <NavLink to="/whatsapp" className={link}>
          <MessageCircle /> WhatsApp
        </NavLink>
        <NavLink to="/campaigns" className={link}>
          <Megaphone /> Campaigns
        </NavLink>

        <div className="nav-label">Account</div>
        <NavLink to="/settings" className={link}>
          <Settings /> Settings
        </NavLink>
      </nav>

      <div className="sidebar-foot">
        {overdue ? `${overdue} follow-up${overdue > 1 ? "s" : ""} due` : "All follow-ups clear"}
        {user && (
          <div className="sidebar-user">
            <div className="sidebar-user-info">
              <div className="sidebar-user-email">{user.email}</div>
              <div className="sidebar-user-role">{user.role}</div>
            </div>
            <button className="sidebar-logout" onClick={onLogout} title="Log out"><LogOut size={16} /></button>
          </div>
        )}
        <div className="sidebar-foot-links">
          <span style={{ opacity: 0.7 }}>Saarathi CRM v1.0</span>
          <button className="terms-link" onClick={() => setTermsOpen(true)}>
            Terms &amp; Conditions
          </button>
        </div>
      </div>

      {termsOpen && <TermsModal onClose={() => setTermsOpen(false)} />}
    </aside>
  );
}
