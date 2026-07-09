import { useState } from "react";
import { Link } from "react-router-dom";
import { LogIn, ShieldCheck } from "lucide-react";
import { api, setToken } from "../lib/api.js";
import { Logo } from "./ui.jsx";

export default function Login({ developer = false, onAuthed }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !password) return setErr("Enter your email and password.");
    setBusy(true); setErr("");
    try {
      const { token, user } = await api.login(email, password);
      if (developer && user.role !== "developer") {
        setErr("This account does not have developer access.");
        setBusy(false);
        return;
      }
      setToken(token);
      onAuthed?.(user);
    } catch (e) {
      setErr(e.message || "Login failed.");
    }
    setBusy(false);
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo"><Logo /></div>
        <div className={"lock-icon" + (developer ? " dev" : "")}>
          {developer ? <ShieldCheck size={22} /> : <LogIn size={22} />}
        </div>
        <h1>{developer ? "Developer Login" : "Sarathi CRM"}</h1>
        <p>{developer ? "Sign in with a developer account." : "Sign in to your account."}</p>

        {err && <div className="dev-err">{err}</div>}

        <label className="auth-field">
          <span>Email</span>
          <input
            type="email" className="input" autoComplete="username"
            value={email} onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </label>
        <label className="auth-field">
          <span>Password</span>
          <input
            type="password" className="input" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </label>

        <button className="btn btn-primary" style={{ width: "100%" }} disabled={busy} onClick={submit}>
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <div className="auth-links">
          <Link to="/forgot">Forgot password?</Link>
        </div>
      </div>
    </div>
  );
}
