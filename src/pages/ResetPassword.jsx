import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { api, setToken } from "../lib/api.js";
import { Logo } from "../components/ui.jsx";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (pw.length < 6) return setErr("Password must be at least 6 characters.");
    if (pw !== pw2) return setErr("Passwords do not match.");
    setBusy(true); setErr("");
    try {
      const { token: jwt } = await api.resetPassword(token, pw);
      if (jwt) setToken(jwt);
      navigate("/");
    } catch (e) {
      setErr(e.message || "Reset failed.");
    }
    setBusy(false);
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo"><Logo /></div>
        <div className="lock-icon"><KeyRound size={22} /></div>
        <h1>Set a new password</h1>
        {!token ? (
          <>
            <p>This reset link is missing or invalid.</p>
            <Link className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} to="/forgot">Request a new link</Link>
          </>
        ) : (
          <>
            <p>Choose a new password for your account.</p>
            {err && <div className="dev-err">{err}</div>}
            <label className="auth-field">
              <span>New password</span>
              <input type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} />
            </label>
            <label className="auth-field">
              <span>Confirm password</span>
              <input type="password" className="input" value={pw2} onChange={(e) => setPw2(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()} />
            </label>
            <button className="btn btn-primary" style={{ width: "100%" }} disabled={busy} onClick={submit}>
              {busy ? "Saving…" : "Save new password"}
            </button>
            <div className="auth-links"><Link to="/login">Back to login</Link></div>
          </>
        )}
      </div>
    </div>
  );
}
