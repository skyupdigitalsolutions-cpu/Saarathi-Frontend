import { useState, useCallback } from "react";
import { STATUS_LABELS } from "../lib/format.js";

export function Logo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path
        d="M40 22c-2-3-6-4-10-4-6 0-11 3-11 9 0 11 19 7 19 14 0 3-3 4-7 4-4 0-7-2-9-5"
        stroke="#f0b429" strokeWidth="6" strokeLinecap="round"
      />
    </svg>
  );
}

export function Tier({ tier }) {
  return (
    <span className={`badge tier-${tier || "unclassified"}`}>
      <span className="dot" />
      {tier || "unrated"}
    </span>
  );
}

export function Status({ status }) {
  return <span className="status-badge">{STATUS_LABELS[status] || status}</span>;
}

export function scoreColor(score) {
  if (score == null) return "var(--muted)";
  if (score >= 70) return "var(--hot)";
  if (score >= 45) return "var(--warm)";
  return "var(--cold)";
}

export function useToast() {
  const [msg, setMsg] = useState(null);
  const show = useCallback((m) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 2600);
  }, []);
  const node = msg ? <div className="toast">{msg}</div> : null;
  return { show, node };
}
