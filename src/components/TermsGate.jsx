// components/TermsGate.jsx
// Blocking T&C acceptance screen shown on first login.
// The checkbox is hidden until the user scrolls to the bottom.
// Cannot be dismissed without accepting (no backdrop click, no Escape, no X).
import { useState, useRef, useCallback, useEffect } from "react";
import { ShieldCheck, ArrowDown } from "lucide-react";
import { TERMS_INTRO, TERMS_SECTIONS, TERMS_DECLARATION } from "../lib/termsContent.js";

export default function TermsGate({ onAccept, onLogout }) {
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const bodyRef = useRef(null);

  const checkScrolled = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    // 12px tolerance — "close enough" counts as end
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 12) {
      setScrolledToEnd(true);
    }
  }, []);

  // Check immediately in case the content is short
  useEffect(() => { checkScrolled(); }, [checkScrolled]);

  const canAgree = scrolledToEnd && checked;

  const agree = async () => {
    if (!canAgree || busy) return;
    setBusy(true);
    setErr("");
    try {
      await onAccept();
    } catch {
      setErr("Could not save your acceptance. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="tg-overlay">
      <div className="tg-modal">

        {/* Header — no close button intentionally */}
        <div className="tg-head">
          <ShieldCheck size={20} color="var(--brand)" className="tg-shield" />
          <div>
            <div className="tg-title">Terms &amp; Conditions</div>
            <div className="tg-subtitle">Please read and accept to continue using Saarathi CRM.</div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="tg-body" ref={bodyRef} onScroll={checkScrolled}>
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
          {!scrolledToEnd && (
            <div className="tg-scroll-hint">
              <ArrowDown size={14} className="tg-bounce" />
              Scroll to the bottom to enable the checkbox.
            </div>
          )}

          {scrolledToEnd && (
            <label className="tg-check-label">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="tg-checkbox"
              />
              <span>{TERMS_DECLARATION}</span>
            </label>
          )}

          {err && <div className="tg-err">{err}</div>}

          <div className="tg-actions">
            <button className="tg-logout" onClick={onLogout} type="button">
              Sign out instead
            </button>
            <button
              className="btn"
              onClick={agree}
              disabled={!canAgree || busy}
              type="button"
            >
              {busy ? "Saving…" : "I Agree & Continue"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
