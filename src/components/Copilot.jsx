import { useState, useRef, useEffect } from "react";
import { Sparkles, X, ArrowUp, Check, AlertTriangle } from "lucide-react";
import { api } from "../lib/api.js";

const SUGGESTIONS = [
  "What should I focus on today?",
  "Show me hot leads not contacted yet",
  "Personal loan leads above ₹5L",
  "Why are most leads cold this week?",
];

// very small inline formatter: **bold** + keep line breaks
function render(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : <span key={i}>{p}</span>
  );
}

function ActionChips({ actions }) {
  if (!actions?.length) return null;
  // only surface write actions that actually changed something
  const meaningful = actions.filter(
    (a) => a.result && (a.result.ok || a.result.sent || a.result.channelDisabled)
  );
  if (!meaningful.length) return null;
  return (
    <div>
      {meaningful.map((a, i) => {
        const warn = a.result.channelDisabled;
        return (
          <span key={i} className={"action-chip" + (warn ? " warn" : "")}>
            {warn ? <AlertTriangle /> : <Check />}
            {labelFor(a)}
          </span>
        );
      })}
    </div>
  );
}

function labelFor(a) {
  const r = a.result;
  switch (a.tool) {
    case "update_lead_status": return `Status → ${r.status}`;
    case "assign_lead": return `Assigned → ${r.assignedTo}`;
    case "update_lead": return `Updated ${r.name}`;
    case "add_note": return "Note added";
    case "set_follow_up": return "Follow-up set";
    case "reclassify_lead": return `Re-scored → ${r.tier}`;
    case "delete_lead": return `Deleted ${r.deleted}`;
    case "send_message": return r.channelDisabled ? `${r.channel}: channel off` : `Sent via ${r.channel}`;
    default: return a.tool;
  }
}

export default function Copilot({ open, onClose, onChanged }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi — I'm your Saarathi Copilot. Ask me to find leads, summarize one, prep a call, or take actions like updating a status or setting a follow-up.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, busy]);

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setInput("");
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setBusy(true);
    try {
      // send only visible turns (role + string content) — backend is stateless
      const history = next.map((m) => ({ role: m.role, content: m.content }));
      const { reply, actions } = await api.copilot(history);
      setMessages((m) => [...m, { role: "assistant", content: reply, actions }]);
      if (actions?.some((a) => a.result?.ok || a.result?.sent)) onChanged?.();
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "⚠️ " + e.message }]);
    } finally {
      setBusy(false);
    }
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="copilot-panel">
        <div className="copilot-head">
          <div className="mark"><Sparkles color="#fff" /></div>
          <div style={{ flex: 1 }}>
            <div className="copilot-title">Saarathi Copilot</div>
            <div className="copilot-status">Reads & acts on your leads</div>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ color: "#fff", padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        <div className="copilot-body" ref={bodyRef}>
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="msg user">{m.content}</div>
            ) : (
              <div key={i} className="msg assistant">
                <div className="bubble">{render(m.content)}</div>
                <ActionChips actions={m.actions} />
              </div>
            )
          )}
          {busy && (
            <div className="msg assistant">
              <div className="bubble" style={{ padding: 0 }}>
                <div className="typing"><span /><span /><span /></div>
              </div>
            </div>
          )}
          {messages.length <= 1 && !busy && (
            <div className="suggestions" style={{ marginTop: 4 }}>
              {SUGGESTIONS.map((s) => (
                <button key={s} className="suggestion" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          )}
        </div>

        <div className="copilot-foot">
          <div className="copilot-input">
            <textarea
              ref={taRef}
              rows={1}
              placeholder="Ask about your leads…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
            />
            <button className="send-btn" onClick={() => send()} disabled={busy || !input.trim()}>
              <ArrowUp size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
