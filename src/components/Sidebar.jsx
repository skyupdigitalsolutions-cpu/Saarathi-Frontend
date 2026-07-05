import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, MessageSquare, Settings, FileText, MessageCircle } from "lucide-react";
import { Logo } from "./ui.jsx";

export default function Sidebar({ stats }) {
  const newToday = stats?.kpis?.today;
  const overdue = stats?.kpis?.overdueFollowUps;

  const link = ({ isActive }) => "nav-item" + (isActive ? " active" : "");

  return (
    <aside className="sidebar">
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

        <div className="nav-label">Account</div>
        <NavLink to="/settings" className={link}>
          <Settings /> Settings
        </NavLink>
      </nav>

      <div className="sidebar-foot">
        {overdue ? `${overdue} follow-up${overdue > 1 ? "s" : ""} due` : "All follow-ups clear"}
        <br />
        <span style={{ opacity: 0.7 }}>Saarathi CRM v1.0</span>
      </div>
    </aside>
  );
}
