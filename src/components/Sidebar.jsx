import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, MessageSquare, Settings, FileText, MessageCircle, Megaphone, LogOut } from "lucide-react";
import { Logo } from "./ui.jsx";

export default function Sidebar({ stats, user, onLogout, open, onClose }) {
  const newToday = stats?.kpis?.today;
  const overdue = stats?.kpis?.overdueFollowUps;

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
        <span style={{ opacity: 0.7 }}>Saarathi CRM v1.0</span>
      </div>
    </aside>
  );
}
