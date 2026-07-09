import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { api } from "../lib/api.js";
import { Logo } from "../components/ui.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email) return setErr("Enter your email.");
    setBusy(true); setErr("");
    try {
      const res = await api.forgot(email);
      setSent(true);
      if (res && res.emailConfigured === false)
        setNote("Email delivery isn't configured yet — ask the developer to send you the reset link.");
    } catch (e) {
      setErr(e.message || "Something went wrong.");
    }
    setBusy(false);
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo"><Logo /></div>
        <div className="lock-icon"><Mail size={22} /></div>
        <h1>Forgot password</h1>
        {sent ? (
          <>
            <p>If an account exists for <b>{email}</b>, a password-reset link has been sent. The link is valid for 1 hour.</p>
            {note && <div className="dev-err" style={{ background: "var(--warm-bg)", color: "#8a5300" }}>{note}</div>}
            <Link className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} to="/login">Back to login</Link>
          </>
        ) : (
          <>
            <p>Enter your email and we'll send you a reset link.</p>
            {err && <div className="dev-err">{err}</div>}
            <label className="auth-field">
              <span>Email</span>
              <input type="email" className="input" value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()} />
            </label>
            <button className="btn btn-primary" style={{ width: "100%" }} disabled={busy} onClick={submit}>
              {busy ? "Sending…" : "Send reset link"}
            </button>
            <div className="auth-links"><Link to="/login">Back to login</Link></div>
          </>
        )}
      </div>
    </div>
  );
}
