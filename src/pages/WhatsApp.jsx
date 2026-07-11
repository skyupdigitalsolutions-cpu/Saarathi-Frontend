import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle, Send, Search, X, Lock, Check, CheckCheck, AlertTriangle, Plus, Clock, Zap,
} from "lucide-react";
import { api } from "../lib/api.js";
import { inr, LOAN_SHORT, timeAgo, dateTime } from "../lib/format.js";
import { Tier, useToast } from "../components/ui.jsx";

const WA_GREEN = "#25d366";
const WA_OUT = "#d9fdd3";

function Ticks({ status }) {
  if (status === "failed") return <AlertTriangle size={13} color="var(--hot)" />;
  if (status === "read") return <CheckCheck size={14} color="#53bdeb" />;
  if (status === "delivered") return <CheckCheck size={14} color="#8696a0" />;
  if (status === "sent") return <Check size={14} color="#8696a0" />;
  return <Clock size={12} color="#8696a0" />;
}

function NewChatModal({ onPick, onClose, toast }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (!q.trim()) return setResults([]);
      api.listLeads({ search: q, limit: 8 }).then((d) => setResults(d.leads)).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="modal-wrap" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-head">
          <div className="card-title">Start a WhatsApp chat</div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: 4 }}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="search" style={{ marginBottom: 12 }}>
            <Search />
            <input autoFocus placeholder="Search a lead by name or phone…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {results.map((l) => (
              <div key={l._id} onClick={() => (l.phone ? onPick(l) : toast("This lead has no phone number"))}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 8px", borderBottom: "1px solid var(--line-2)", cursor: "pointer" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{l.name || "(no name)"}</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>{l.phone || "no phone"} · {LOAN_SHORT[l.loanType] || "—"}</div>
                </div>
                <Tier tier={l.tier} />
              </div>
            ))}
            {q && results.length === 0 && <div className="muted" style={{ fontSize: 13, padding: 12 }}>No leads found.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WhatsApp() {
  const navigate = useNavigate();
  const { show, node } = useToast();
  const [status, setStatus] = useState(null);
  const [convos, setConvos] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [thread, setThread] = useState(null);
  const [text, setText] = useState("");
  const [tpl, setTpl] = useState("");
  const [mode, setMode] = useState("text"); // text | template
  const [sending, setSending] = useState(false);
  const [newChat, setNewChat] = useState(false);
  const [automation, setAutomation] = useState(null);
  const [savingAuto, setSavingAuto] = useState(false);
  const bodyRef = useRef(null);

  const loadConvos = useCallback(() => {
    api.waConversations().then((d) => setConvos(d.conversations)).catch(() => {});
  }, []);

  useEffect(() => {
    api.waStatus().then(setStatus).catch(() => setStatus({ enabled: false, configured: false }));
    api.waTemplates().then((d) => setTemplates(d.templates)).catch(() => {});
    api.waGetAutomation().then(setAutomation).catch(() => {});
    loadConvos();
  }, [loadConvos]);

  async function saveAutomation(next) {
    setSavingAuto(true);
    try {
      const saved = await api.waSetAutomation(next);
      setAutomation(saved);
      show("Automation saved");
    } catch (e) { show(e.message); } finally { setSavingAuto(false); }
  }

  const loadThread = useCallback((id) => {
    if (!id) return;
    api.waThread(id).then((t) => {
      setThread(t);
      setMode(t.windowOpen ? "text" : "template");
    }).catch((e) => show(e.message));
  }, [show]);

  useEffect(() => { loadThread(activeId); }, [activeId, loadThread]);

  // light polling for inbound replies / status ticks
  useEffect(() => {
    if (!activeId) return;
    const t = setInterval(() => { loadThread(activeId); loadConvos(); }, 15000);
    return () => clearInterval(t);
  }, [activeId, loadThread, loadConvos]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [thread]);

  async function sendText() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await api.waSend({ leadId: activeId, type: "text", text: text.trim() });
      setText("");
      loadThread(activeId); loadConvos();
    } catch (e) { show(e.message); } finally { setSending(false); }
  }

  async function sendTemplate() {
    if (!tpl || sending) return;
    setSending(true);
    try {
      await api.waSend({ leadId: activeId, type: "template", templateName: tpl });
      show("Template sent");
      setTpl("");
      loadThread(activeId); loadConvos();
    } catch (e) { show(e.message); } finally { setSending(false); }
  }

  function pickNew(lead) {
    setNewChat(false);
    setActiveId(lead.leadId || lead._id);
    if (!convos.find((c) => c.leadId === (lead.leadId || lead._id))) loadConvos();
  }

  const notReady = status && (!status.enabled || !status.configured);
  const selectedTpl = templates.find((t) => t.name === tpl);

  return (
    <div className="page" style={{ maxWidth: 1180 }}>
      {notReady && (
        <div className="banner locked" style={{ marginBottom: 16 }}>
          <Lock />
          {!status.enabled
            ? <>WhatsApp channel is off — set <b>CHANNEL_WHATSAPP=true</b> in the backend .env and restart.</>
            : <>WhatsApp is on but not connected yet — add your <b>WHATSAPP_TOKEN</b> and <b>WHATSAPP_PHONE_NUMBER_ID</b> in .env. You can still browse the interface below.</>}
        </div>
      )}

      {automation && (
        <div className="card wa-automation" style={{ marginBottom: 16, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Zap size={16} color={WA_GREEN} />
              <div>
                <div className="card-title">Auto-send on new lead</div>
                <div className="muted" style={{ fontSize: 12.5 }}>
                  Sends a template automatically when a lead is added — chosen by where the lead came from.
                </div>
              </div>
            </div>
            <label className="dev-toggle" style={{ margin: 0 }}>
              <input type="checkbox" checked={automation.enabled} disabled={savingAuto}
                onChange={(e) => saveAutomation({ enabled: e.target.checked, templates: automation.templates })} />
              <span>{automation.enabled ? "On" : "Off"}</span>
            </label>
          </div>
          <div className="wa-auto-grid" style={{ opacity: automation.enabled ? 1 : 0.5, pointerEvents: automation.enabled ? "auto" : "none" }}>
            {[["website", "Website form"], ["meta", "Meta lead ad"], ["manual", "Manual add"]].map(([key, label]) => (
              <label key={key} className="wa-auto-field">
                <span>{label}</span>
                <select className="input" value={automation.templates?.[key] || ""} disabled={savingAuto}
                  onChange={(e) => saveAutomation({ enabled: automation.enabled, templates: { ...automation.templates, [key]: e.target.value } })}>
                  <option value="">— Don't send —</option>
                  {templates.map((t) => <option key={t.name} value={t.name}>{t.label || t.name}</option>)}
                </select>
              </label>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, height: "calc(100vh - 180px)", minHeight: 480 }}>
        {/* conversation list */}
        <div className="card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div className="card-head" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MessageCircle size={17} color={WA_GREEN} />
              <div className="card-title">Chats</div>
            </div>
            <button className="btn btn-sm btn-primary" onClick={() => setNewChat(true)} style={{ padding: "5px 9px" }}>
              <Plus size={14} /> New
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {convos.length === 0 ? (
              <div className="empty" style={{ padding: "40px 18px" }}>
                <MessageCircle />
                <div style={{ fontSize: 13.5 }}>No conversations yet. Hit <b>New</b> to message a lead.</div>
              </div>
            ) : convos.map((c) => (
              <div key={c.leadId} onClick={() => setActiveId(c.leadId)}
                style={{
                  display: "flex", gap: 11, padding: "12px 16px", cursor: "pointer",
                  borderBottom: "1px solid var(--line-2)",
                  background: activeId === c.leadId ? "var(--brand-soft)" : "transparent",
                }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: WA_GREEN, color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, flexShrink: 0 }}>
                  {(c.name || "?").trim()[0]?.toUpperCase() || "?"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                    <b style={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</b>
                    <span className="muted" style={{ fontSize: 11, flexShrink: 0 }}>{timeAgo(c.lastAt)}</span>
                  </div>
                  <div className="muted" style={{ fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.lastDir === "out" ? "You: " : ""}{c.lastText}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* thread */}
        <div className="card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {!thread ? (
            <div className="center" style={{ flexDirection: "column", color: "var(--muted)", height: "100%" }}>
              <MessageCircle size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
              <div style={{ fontSize: 14 }}>Select a chat or start a new one</div>
            </div>
          ) : (
            <>
              {/* header */}
              <div className="card-head" style={{ padding: "12px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: WA_GREEN, color: "#fff", display: "grid", placeItems: "center", fontWeight: 700 }}>
                    {(thread.lead.name || "?").trim()[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{thread.lead.name || thread.lead.phone}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{thread.lead.phone}</div>
                  </div>
                </div>
                <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/leads/${thread.lead.id}`)}>Open lead →</button>
              </div>

              {/* messages */}
              <div ref={bodyRef} style={{ flex: 1, overflowY: "auto", padding: "18px", background: "#efeae2", display: "flex", flexDirection: "column", gap: 8 }}>
                {thread.messages.length === 0 && (
                  <div style={{ textAlign: "center", color: "#667781", fontSize: 13, marginTop: 20 }}>
                    No messages yet. Start with an approved template below.
                  </div>
                )}
                {thread.messages.map((m) => (
                  <div key={m._id} style={{ alignSelf: m.direction === "out" ? "flex-end" : "flex-start", maxWidth: "72%" }}>
                    <div style={{
                      background: m.direction === "out" ? WA_OUT : "#fff",
                      padding: "7px 11px 5px", borderRadius: 8, fontSize: 14, lineHeight: 1.4,
                      boxShadow: "0 1px 1px rgba(0,0,0,.08)", position: "relative",
                    }}>
                      {m.templateName && <div style={{ fontSize: 10.5, color: WA_GREEN, fontWeight: 700, marginBottom: 2 }}>TEMPLATE · {m.templateName}</div>}
                      <span>{m.body}</span>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 2 }}>
                        <span style={{ fontSize: 10.5, color: "#667781" }}>{new Date(m.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</span>
                        {m.direction === "out" && <Ticks status={m.status} />}
                      </div>
                      {m.status === "failed" && m.error && <div style={{ fontSize: 11, color: "var(--hot)", marginTop: 2 }}>{m.error}</div>}
                    </div>
                  </div>
                ))}
              </div>

              {/* composer */}
              <div style={{ borderTop: "1px solid var(--line)", padding: 12, background: "#f7f6f3" }}>
                {!thread.windowOpen && (
                  <div style={{ fontSize: 12, color: "#7a5a00", background: "var(--accent-soft)", border: "1px solid #f3e2b8", borderRadius: 8, padding: "7px 11px", marginBottom: 10, display: "flex", gap: 7, alignItems: "center" }}>
                    <Clock size={14} /> Free-form replies unlock for 24h after the lead messages you. Start with an approved <b>template</b>.
                  </div>
                )}
                <div className="row" style={{ marginBottom: 10, gap: 6 }}>
                  <button className={"btn btn-sm" + (mode === "text" ? " btn-primary" : "")} disabled={!thread.windowOpen} onClick={() => setMode("text")}>
                    {!thread.windowOpen && <Lock size={12} />} Reply
                  </button>
                  <button className={"btn btn-sm" + (mode === "template" ? " btn-primary" : "")} onClick={() => setMode("template")}>Template</button>
                </div>

                {mode === "text" ? (
                  <div className="row" style={{ gap: 8 }}>
                    <input className="input" placeholder="Type a message…" value={text} disabled={!thread.windowOpen}
                      onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendText()} style={{ flex: 1 }} />
                    <button className="btn btn-primary" onClick={sendText} disabled={sending || !text.trim()} style={{ background: WA_GREEN, borderColor: WA_GREEN }}>
                      <Send size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="row" style={{ gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <select className="select" value={tpl} onChange={(e) => setTpl(e.target.value)} style={{ flex: 1, minWidth: 180 }}>
                      <option value="">Choose a template…</option>
                      {templates.map((t) => <option key={t.name} value={t.name}>{t.label}</option>)}
                    </select>
                    <button className="btn btn-primary" onClick={sendTemplate} disabled={sending || !tpl} style={{ background: WA_GREEN, borderColor: WA_GREEN }}>
                      <Send size={15} /> Send
                    </button>
                    {selectedTpl && (
                      <div style={{ width: "100%", fontSize: 13, color: "var(--muted)", background: "#fff", border: "1px solid var(--line)", borderRadius: 8, padding: "8px 11px", marginTop: 2 }}>
                        Preview: {selectedTpl.preview.replace(/\{\{1\}\}/g, thread.lead.name || "there")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {newChat && <NewChatModal onPick={pickNew} onClose={() => setNewChat(false)} toast={show} />}
      {node}
    </div>
  );
}
