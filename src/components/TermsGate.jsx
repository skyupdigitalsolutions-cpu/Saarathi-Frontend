// components/TermsGate.jsx
// Blocking T&C acceptance screen shown on first login.
// The checkbox is hidden until the user scrolls to the bottom.
// Cannot be dismissed without accepting (no backdrop click, no Escape, no X).
import { useState, useRef, useCallback, useEffect } from "react";
import { ShieldCheck, ArrowDown } from "lucide-react";

const TERMS_SECTIONS = [
  { heading: "1. Customer Data Accuracy", body: "The Customer is solely responsible for maintaining accurate customer, lead, employee and business information entered into the CRM." },
  { heading: "2. Lead Management", body: "Lead information, lead status, assignments and follow-up activities are maintained by the Customer and should be regularly verified." },
  { heading: "3. Sales Pipeline", body: "Pipeline stages, sales progress and opportunity records depend entirely on user-entered information." },
  { heading: "4. Campaign Management", body: "Campaign information, marketing activities and campaign reports should be independently verified before business use." },
  { heading: "5. Customer Communication", body: "Customers are responsible for all emails, WhatsApp messages, SMS and other communications sent through the CRM." },
  { heading: "6. WhatsApp Integration", body: "WhatsApp services are governed by Meta policies and Customers are responsible for complying with all applicable platform requirements." },
  { heading: "7. Third-Party Integrations", body: "Features integrated with Google, Meta, WhatsApp or other third-party services are subject to the availability and terms of those providers." },
  { heading: "8. AI Assistance", body: "AI-generated summaries, recommendations and responses should be independently reviewed before making business decisions." },
  { heading: "9. Reports & Analytics", body: "Reports and dashboards are generated from user-entered and synchronised data and should be independently verified." },
  { heading: "10. User Account Responsibility", body: "Organisations are responsible for assigning appropriate user roles and all activities performed through authorised accounts." },
  { heading: "11. Data Import", body: "Imported customer, lead and business data should be verified before use." },
  { heading: "12. Data Export", body: "Exported files become the Customer's responsibility after download." },
  { heading: "13. Document Management", body: "Customers are responsible for verifying quotations, documents and attachments before sharing." },
  { heading: "14. Notification Services", body: "Email, WhatsApp and other notifications depend on third-party services and internet availability." },
  { heading: "15. Task & Follow-up Management", body: "Customers are responsible for reviewing follow-up schedules, reminders and assigned tasks." },
  { heading: "16. Subscription Responsibility", body: "Access to the software depends on an active subscription and compliance with applicable licensing terms." },
  { heading: "17. Data Security", body: "Customers must safeguard user credentials, passwords, API keys and other authentication information." },
  { heading: "18. Confidential Information", body: "Customers are responsible for protecting confidential business information stored within the CRM." },
  { heading: "19. Software Updates", body: "SkyUp may release software updates, security patches and feature enhancements without prior notice." },
  { heading: "20. Software Availability", body: "Temporary downtime due to maintenance, cloud infrastructure or third-party services shall not constitute a breach of service." },
  { heading: "21. Data Backup", body: "Customers should maintain independent backups of important business information." },
  { heading: "22. Business Compliance", body: "Customers remain responsible for complying with all applicable business, privacy and communication laws." },
  { heading: "23. Fraud Prevention", body: "Customers must take reasonable measures to prevent unauthorised access and fraudulent use of their accounts." },
  { heading: "24. Intellectual Property", body: "All software, source code, trademarks, documentation and related intellectual property remain the exclusive property of SkyUp." },
  { heading: "25. Acceptable Use", body: "Customers shall not use the software for unlawful, abusive, fraudulent or unauthorised activities." },
  { heading: "26. Limitation of Liability", body: "SkyUp is not liable for business losses, loss of data, loss of customers, missed opportunities or damages resulting from user actions or third-party service failures." },
  { heading: "27. Force Majeure", body: "SkyUp shall not be responsible for service interruptions caused by events beyond its reasonable control." },
  { heading: "28. Suspension of Service", body: "SkyUp reserves the right to suspend access for violations of these Terms and Conditions or applicable laws." },
  { heading: "29. Changes to Terms", body: "SkyUp may revise these Terms and Conditions from time to time and continued use of the software constitutes acceptance of the updated version." },
  { heading: "30. Acceptance of CRM Records", body: "Records, reports, communications and documents generated through the software are deemed approved once created, downloaded, shared or transmitted by the Customer." },
];

const DECLARATION = "I have read, understood, and agree to the Terms and Conditions of Saarathi CRM.";

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
          <p className="tg-intro">
            These Terms and Conditions govern your use of the Saarathi CRM software
            operated by <strong>Skyup Digital Solutions</strong> on behalf of
            <strong> Sarathi Associates</strong>. By continuing to use this software
            you agree to comply with and be bound by the following terms. Effective
            date: <strong>20 July 2026</strong>.
          </p>

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
              <span>{DECLARATION}</span>
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
