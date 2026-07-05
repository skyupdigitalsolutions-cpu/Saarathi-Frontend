import { useEffect, useState } from "react";
import { MessageCircle, Smartphone, Mail, Lock, Check, Send } from "lucide-react";
import { api } from "../lib/api.js";
import { useToast } from "../components/ui.jsx";

const CHANNELS = [
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, desc: "Template & session messages via MSG91", env: "CHANNEL_WHATSAPP" },
  { key: "sms", label: "SMS", icon: Smartphone, desc: "DLT-approved transactional SMS via MSG91", env: "CHANNEL_SMS" },
  { key: "email", label: "Email", icon: Mail, desc: "Transactional email to leads", env: "CHANNEL_EMAIL" },
];

export default function Messaging() {
  const { show, node } = useToast();
  const [channels, setChannels] = useState(null);
  const [pick, setPick] = useState("whatsapp");
  const [body, setBody] = useState("");

  useEffect(() => { api.channels().then((d) => setChannels(d.channels)).catch((e) => show(e.message)); }, []);
  if (!channels) return <div className="center"><div className="spinner" /></div>;

  const live = channels[pick];

  return (
    <div className="page">
      <div className="grid cols-3" style={{ marginBottom: 20 }}>
        {CHANNELS.map((c) => {
          const on = channels[c.key];
          return (
            <div key={c.key} className="card card-pad">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: on ? "var(--ok-bg)" : "var(--line-2)", display: "grid", placeItems: "center" }}>
                  <c.icon size={20} color={on ? "var(--ok)" : "var(--muted)"} />
                </div>
                <span className="badge" style={{ background: on ? "var(--ok-bg)" : "var(--line-2)", color: on ? "var(--ok)" : "var(--muted)" }}>
                  {on ? <><Check size={12} /> Live</> : <><Lock size={12} /> Locked</>}
                </span>
              </div>
              <div className="card-title" style={{ marginTop: 14, fontSize: 15 }}>{c.label}</div>
              <div className="card-sub" style={{ marginTop: 4 }}>{c.desc}</div>
              {!on && (
                <div className="muted" style={{ fontSize: 12, marginTop: 12, lineHeight: 1.5 }}>
                  Activate by setting <code style={{ background: "var(--line-2)", padding: "1px 6px", borderRadius: 5 }}>{c.env}=true</code> in the backend <b>.env</b> once registration clears.
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="banner locked" style={{ marginBottom: 20 }}>
        <Lock />
        Sending is intentionally disabled until DLT / MSG91 registration is complete. The UI and Copilot can <b>draft</b> messages now — flip the channel flags to go live.
      </div>

      <div className="card">
        <div className="card-head">
          <div><div className="card-title">Broadcast</div><div className="card-sub">Send to a filtered set of leads</div></div>
        </div>
        <div className="card-pad">
          <div className="row" style={{ marginBottom: 14 }}>
            {CHANNELS.map((c) => (
              <button key={c.key} className={"btn btn-sm" + (pick === c.key ? " btn-primary" : "")} onClick={() => setPick(c.key)}>
                {!channels[c.key] && <Lock size={12} />} {c.label}
              </button>
            ))}
          </div>
          <textarea className="input" rows={4} placeholder={`Compose a ${pick} broadcast…`} value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="row" style={{ marginTop: 12, justifyContent: "space-between" }}>
            <span className="muted" style={{ fontSize: 12.5 }}>
              {live ? "Ready to send." : `${pick} is locked — drafting only.`}
            </span>
            <button className="btn btn-primary btn-sm" disabled={!live} onClick={() => show(live ? "Broadcast queued" : "Channel locked")}>
              <Send size={14} /> {live ? "Send broadcast" : "Locked"}
            </button>
          </div>
        </div>
      </div>
      {node}
    </div>
  );
}
