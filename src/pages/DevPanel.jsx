import { useState, useEffect, useCallback } from "react";
import { api, setToken } from "../lib/api.js";
import Login from "../components/Login.jsx";
import { RefreshCw, Power, Save, LogOut, UserPlus, Trash2 } from "lucide-react";

const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function DevPanel() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState(null);
  const [users, setUsers] = useState([]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  // new user form
  const [nu, setNu] = useState({ name: "", email: "", password: "", role: "user" });

  const applyStatus = useCallback((s) => {
    setStatus(s);
    setStart(toDateInput(s.startDate));
    setEnd(toDateInput(s.endDate));
    setEnabled(s.enabled);
  }, []);

  const load = useCallback(async () => {
    try {
      const s = await api.subGet();
      applyStatus(s);
      setUsers(await api.listUsers().catch(() => []));
      setAuthed(true);
    } catch {
      setAuthed(false);
    }
    setChecking(false);
  }, [applyStatus]);

  useEffect(() => { load(); }, [load]);

  const flash = (m) => { setMsg(m); setErr(""); setTimeout(() => setMsg(""), 2500); };

  const save = async () => {
    setBusy(true); setErr("");
    try {
      applyStatus(await api.subSet({ startDate: `${start}T00:00:00`, endDate: `${end}T23:59:59`, enabled }));
      flash("Subscription updated");
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  const renew = async (days) => {
    setBusy(true); setErr("");
    try { applyStatus(await api.subRenew(days)); flash(`Renewed for ${days} days`); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  };
  const toggle = async () => {
    setBusy(true); setErr("");
    try { applyStatus(await api.subToggle(!enabled)); flash(enabled ? "Access disabled" : "Access enabled"); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  };
  const addUser = async () => {
    if (!nu.email || nu.password.length < 6) return setErr("Email and a 6+ char password are required.");
    setBusy(true); setErr("");
    try {
      await api.createUser(nu);
      setNu({ name: "", email: "", password: "", role: "user" });
      setUsers(await api.listUsers());
      flash("User created");
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  const delUser = async (id) => {
    setBusy(true); setErr("");
    try { await api.deleteUser(id); setUsers(await api.listUsers()); flash("User removed"); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  };
  const logout = () => { setToken(null); setAuthed(false); setStatus(null); };

  if (checking) return <div className="auth-screen" />;
  if (!authed) return <Login developer onAuthed={() => { setChecking(true); load(); }} />;

  const active = status?.active;
  return (
    <div className="page dev-page">
      <div className="dev-head">
        <div>
          <h1 className="page-title" style={{ fontSize: 22 }}>Subscription Control</h1>
          <p style={{ color: "var(--muted)", marginTop: 4 }}>Monthly plan, access control &amp; users.</p>
        </div>
        <button className="btn btn-sm" onClick={logout}><LogOut size={14} /> Log out</button>
      </div>

      {msg && <div className="banner ok" style={{ marginBottom: 16 }}>{msg}</div>}
      {err && <div className="banner locked" style={{ marginBottom: 16 }}>{err}</div>}

      <div className="dev-status-row">
        <div className={"dev-stat " + (active ? "on" : "off")}>
          <span className="dev-stat-label">Status</span>
          <span className="dev-stat-val">{active ? "Active" : status?.reason === "disabled" ? "Disabled" : "Expired"}</span>
        </div>
        <div className="dev-stat">
          <span className="dev-stat-label">Days left</span>
          <span className="dev-stat-val">{status?.daysLeft ?? "—"}</span>
        </div>
        <div className="dev-stat">
          <span className="dev-stat-label">Ends</span>
          <span className="dev-stat-val">{fmt(status?.endDate)}</span>
        </div>
      </div>

      <div className="card dev-card">
        <label className="dev-field"><span>Start date</span>
          <input type="date" className="input" value={start} onChange={(e) => setStart(e.target.value)} /></label>
        <label className="dev-field"><span>End date (expiry)</span>
          <input type="date" className="input" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
        <label className="dev-toggle">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <span>Access enabled (master switch)</span>
        </label>
        <button className="btn btn-primary" disabled={busy} onClick={save}><Save size={15} /> Save changes</button>
      </div>

      <div className="dev-actions">
        <button className="btn" disabled={busy} onClick={() => renew(30)}><RefreshCw size={15} /> Renew 30 days</button>
        <button className="btn" disabled={busy} onClick={() => renew(365)}><RefreshCw size={15} /> Renew 1 year</button>
        <button className={"btn " + (enabled ? "btn-danger" : "btn-primary")} disabled={busy} onClick={toggle}>
          <Power size={15} /> {enabled ? "Disable access now" : "Enable access"}
        </button>
      </div>

      <h2 className="page-title" style={{ fontSize: 18, margin: "30px 0 14px" }}>Users</h2>
      <div className="card dev-card" style={{ maxWidth: 620 }}>
        <div className="dev-userform">
          <input className="input" placeholder="Name" value={nu.name} onChange={(e) => setNu({ ...nu, name: e.target.value })} />
          <input className="input" placeholder="Email" type="email" value={nu.email} onChange={(e) => setNu({ ...nu, email: e.target.value })} />
          <input className="input" placeholder="Password (min 6)" type="text" value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} />
          <select className="input" value={nu.role} onChange={(e) => setNu({ ...nu, role: e.target.value })}>
            <option value="user">User</option>
            <option value="developer">Developer</option>
          </select>
          <button className="btn btn-primary" disabled={busy} onClick={addUser}><UserPlus size={15} /> Add</button>
        </div>
      </div>
      <div className="dev-userlist">
        {users.map((u) => (
          <div className="dev-userrow" key={u.id}>
            <div>
              <div className="dev-username">{u.name || "—"} <span className={"role-tag " + u.role}>{u.role}</span></div>
              <div className="dev-useremail">{u.email}</div>
            </div>
            <button className="btn btn-sm btn-danger" disabled={busy} onClick={() => delUser(u.id)}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
