import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api.js";
import { ShieldCheck, RefreshCw, Power, Save, LogOut } from "lucide-react";

const KEY_STORE = "sarathi_dev_key";
const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function DevPanel() {
  const [key, setKey] = useState(() => localStorage.getItem(KEY_STORE) || "");
  const [authed, setAuthed] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [status, setStatus] = useState(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const apply = useCallback((s) => {
    setStatus(s);
    setStart(toDateInput(s.startDate));
    setEnd(toDateInput(s.endDate));
    setEnabled(s.enabled);
  }, []);

  const load = useCallback(
    async (k) => {
      setErr("");
      try {
        const s = await api.subGet(k);
        apply(s);
        setAuthed(true);
        localStorage.setItem(KEY_STORE, k);
        setKey(k);
      } catch (e) {
        setAuthed(false);
        localStorage.removeItem(KEY_STORE);
        setErr(e.message || "Login failed");
      }
    },
    [apply]
  );

  useEffect(() => {
    if (key) load(key);
  }, [key, load]);

  const flash = (m) => { setMsg(m); setErr(""); setTimeout(() => setMsg(""), 2500); };

  const save = async () => {
    setBusy(true); setErr("");
    try {
      const s = await api.subSet(
        { startDate: `${start}T00:00:00`, endDate: `${end}T23:59:59`, enabled },
        key
      );
      apply(s); flash("Subscription updated");
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const renew = async (days) => {
    setBusy(true); setErr("");
    try { apply(await api.subRenew(days, key)); flash(`Renewed for ${days} days`); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const toggle = async () => {
    setBusy(true); setErr("");
    try { apply(await api.subToggle(!enabled, key)); flash(enabled ? "Access disabled" : "Access enabled"); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const logout = () => {
    localStorage.removeItem(KEY_STORE);
    setKey(""); setAuthed(false); setStatus(null); setKeyInput("");
  };

  // ---- login gate ----
  if (!authed) {
    return (
      <div className="dev-login">
        <div className="dev-login-card">
          <div className="lock-icon"><ShieldCheck size={24} /></div>
          <h1>Developer Panel</h1>
          <p>Enter the developer key to manage the subscription.</p>
          {err && <div className="dev-err">{err}</div>}
          <input
            type="password"
            className="input"
            placeholder="Developer key"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(keyInput)}
          />
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => load(keyInput)}>
            Unlock
          </button>
        </div>
      </div>
    );
  }

  // ---- panel ----
  const active = status?.active;
  return (
    <div className="page dev-page">
      <div className="dev-head">
        <div>
          <h1 className="page-title" style={{ fontSize: 22 }}>Subscription Control</h1>
          <p style={{ color: "var(--muted)", marginTop: 4 }}>Monthly plan — start / end dates and access.</p>
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
        <label className="dev-field">
          <span>Start date</span>
          <input type="date" className="input" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label className="dev-field">
          <span>End date (expiry)</span>
          <input type="date" className="input" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
        <label className="dev-toggle">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <span>Access enabled (master switch)</span>
        </label>
        <button className="btn btn-primary" disabled={busy} onClick={save}>
          <Save size={15} /> Save changes
        </button>
      </div>

      <div className="dev-actions">
        <button className="btn" disabled={busy} onClick={() => renew(30)}><RefreshCw size={15} /> Renew 30 days</button>
        <button className="btn" disabled={busy} onClick={() => renew(365)}><RefreshCw size={15} /> Renew 1 year</button>
        <button className={"btn " + (enabled ? "btn-danger" : "btn-primary")} disabled={busy} onClick={toggle}>
          <Power size={15} /> {enabled ? "Disable access now" : "Enable access"}
        </button>
      </div>
    </div>
  );
}
