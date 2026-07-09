import { Lock } from "lucide-react";
import { Logo } from "./ui.jsx";

function fmt(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function LockScreen({ status }) {
  const disabled = status?.reason === "disabled";
  return (
    <div className="lock-screen">
      <div className="lock-card">
        <div className="lock-logo"><Logo /></div>
        <div className="lock-icon"><Lock size={26} /></div>
        <h1>{disabled ? "Access disabled" : "Subscription expired"}</h1>
        <p>
          {disabled
            ? "Access to the CRM has been temporarily disabled by the administrator."
            : `Your subscription ended on ${status?.endDate ? fmt(status.endDate) : "—"}. The CRM is locked until it is renewed.`}
        </p>
        <p className="lock-contact">Please contact the developer to restore access.</p>
        <a className="btn btn-primary" href="/dev">Developer login</a>
      </div>
    </div>
  );
}
