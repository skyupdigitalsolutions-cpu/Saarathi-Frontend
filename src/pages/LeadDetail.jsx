import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Phone, Mail, MapPin, Sparkles, Trash2, RefreshCw, Lock,
  Send, CalendarClock, MessageSquare, StickyNote, ChevronRight,
} from "lucide-react";
import { api } from "../lib/api.js";
import {
  inr, dateTime, timeAgo, LOAN_LABELS, EMPLOYMENT_LABELS, URGENCY_LABELS,
  SOURCE_LABELS, STATUS_LABELS, STATUS_ORDER, followUpInfo,
} from "../lib/format.js";
import { Tier, Status, scoreColor, useToast } from "../components/ui.jsx";

const AGENTS = ["Pooja", "Ramesh", "Anjali"];

export default function LeadDetail({ reload }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show, node } = useToast();
  const [lead, setLead] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("activity");
  const [channels, setChannels] = useState({});
  const [draft, setDraft] = useState({ channel: "whatsapp", body: "" });
  const [fu, setFu] = useState("");

  const load = () => api.getLead(id).then(setLead).catch((e) => show(e.message));
  useEffect(() => { load(); api.channels().then((d) => setChannels(d.channels)).catch(() => {}); }, [id]);

  if (!lead) return <div className="center"><div className="spinner" /></div>;

  const refresh = (updated) => { setLead(updated); reload?.(); };
  const fuInfo = followUpInfo(lead.followUpAt);

  async function changeStatus(status) {
    const u = await api.setStatus(id, status); refresh(u); show(`Status → ${STATUS_LABELS[status]}`);
  }
  async function changeAssign(assignedTo) {
    const u = await api.assign(id, assignedTo || "unassigned"); refresh(u); show(assignedTo ? `Assigned to ${assignedTo}` : "Unassigned");
  }
  async function addNote() {
    if (!note.trim()) return;
    const u = await api.addNote(id, note.trim()); setNote(""); refresh(u); show("Note added");
  }
  async function reclassify() {
    setBusy(true);
    try { const u = await api.reclassify(id); refresh(u); show(`Re-scored ${u.tier?.toUpperCase()} (${u.score})`); }
    catch (e) { show(e.message); } finally { setBusy(false); }
  }
  async function saveFollowUp() {
    if (!fu) return;
    const u = await api.setFollowUp(id, new Date(fu).toISOString(), ""); refresh(u); setFu(""); show("Follow-up set");
  }
  async function clearFollowUp() {
    const u = await api.setFollowUp(id, "", ""); refresh(u); show("Follow-up cleared");
  }
  async function remove() {
    if (!confirm(`Delete ${lead.name || "this lead"}? This can't be undone.`)) return;
    await api.deleteLead(id); reload?.(); navigate("/leads");
  }
  async function sendMessage() {
    if (!draft.body.trim()) return show("Write a message first");
    if (!channels[draft.channel]) return show(`${draft.channel} channel is not activated yet`);
    try {
      await fetch("/api/messaging/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: id, channel: draft.channel, body: draft.body }),
      }).then((r) => r.json());
      setDraft({ ...draft, body: "" }); load(); show(`Sent via ${draft.channel}`);
    } catch (e) { show(e.message); }
  }

  const Row = ({ icon: Icon, label, value }) => (
    <>
      <dt style={{ display: "flex", alignItems: "center", gap: 6 }}>{Icon && <Icon size={14} />}{label}</dt>
      <dd>{value}</dd>
    </>
  );

  return (
    <div className="page">
      <button className="btn btn-ghost btn-sm" onClick={() => navigate("/leads")} style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> All leads
      </button>

      {/* header */}
      <div className="card card-pad" style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, letterSpacing: "-.02em" }}>{lead.name || "(no name)"}</h2>
            <Tier tier={lead.tier} />
            <span className="score-pill" style={{ color: scoreColor(lead.score), fontSize: 15 }}>{lead.score ?? "—"}<span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 12 }}>/100</span></span>
          </div>
          <div className="row" style={{ marginTop: 10, gap: 16, color: "var(--muted)", fontSize: 13.5 }}>
            {lead.phone && <span style={{ display: "flex", gap: 6, alignItems: "center" }}><Phone size={14} />{lead.phone}</span>}
            {lead.email && <span style={{ display: "flex", gap: 6, alignItems: "center" }}><Mail size={14} />{lead.email}</span>}
            {lead.city && <span style={{ display: "flex", gap: 6, alignItems: "center" }}><MapPin size={14} />{lead.city}</span>}
            <span>· via {SOURCE_LABELS[lead.source]}</span>
          </div>
        </div>
        <div className="row" style={{ alignItems: "flex-start" }}>
          <button className="btn btn-sm" onClick={reclassify} disabled={busy}>
            {busy ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <RefreshCw size={15} />} Re-score
          </button>
          <button className="btn btn-sm btn-danger" onClick={remove}><Trash2 size={15} /> Delete</button>
        </div>
      </div>

      <div className="detail-grid">
        {/* left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* AI box */}
          <div className="card card-pad">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Sparkles size={16} color="var(--accent)" />
              <span className="card-title" style={{ fontSize: 14 }}>AI assessment</span>
            </div>
            <div className="reason-box">
              {lead.classificationReason || "Not classified yet — hit Re-score."}
              {lead.suggestedProduct && lead.suggestedProduct !== lead.loanType && (
                <div style={{ marginTop: 8, fontSize: 13 }}>
                  <b>Suggested:</b> {LOAN_LABELS[lead.suggestedProduct] || lead.suggestedProduct}
                </div>
              )}
            </div>
            {lead.flags?.length > 0 && (
              <div className="row" style={{ marginTop: 12, gap: 7 }}>
                {lead.flags.map((f) => <span key={f} className="flag">{f}</span>)}
              </div>
            )}
            <div className="muted" style={{ fontSize: 11.5, marginTop: 12 }}>Indicative only — not a sanction or guaranteed rate.</div>
          </div>

          {/* details */}
          <div className="card">
            <div className="card-head"><div className="card-title">Loan details</div></div>
            <div className="card-pad">
              <dl className="kv">
                <Row label="Loan type" value={LOAN_LABELS[lead.loanType] || "—"} />
                <Row label="Amount" value={inr(lead.amount)} />
                <Row label="Employment" value={EMPLOYMENT_LABELS[lead.employmentType] || "—"} />
                <Row label="Monthly income" value={inr(lead.monthlyIncome)} />
                <Row label="Urgency" value={URGENCY_LABELS[lead.urgency] || "—"} />
                <Row label="Existing EMI" value={lead.existingLoan === true ? "Yes" : lead.existingLoan === false ? "No" : "—"} />
                <Row label="Campaign" value={lead.campaign || "—"} />
                <Row label="Captured" value={dateTime(lead.createdAt)} />
              </dl>
            </div>
          </div>

          {/* tabs: activity / message */}
          <div className="card">
            <div className="card-head">
              <div className="pill-tabs">
                <button className={"pill-tab" + (tab === "activity" ? " active" : "")} onClick={() => setTab("activity")}>
                  <StickyNote size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} />Activity
                </button>
                <button className={"pill-tab" + (tab === "message" ? " active" : "")} onClick={() => setTab("message")}>
                  <MessageSquare size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} />Message
                </button>
              </div>
            </div>
            <div className="card-pad">
              {tab === "activity" ? (
                <>
                  <div className="row" style={{ marginBottom: 14 }}>
                    <input className="input" placeholder="Add a note about this lead…" value={note}
                      onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNote()} style={{ flex: 1 }} />
                    <button className="btn btn-primary btn-sm" onClick={addNote}>Add</button>
                  </div>
                  {lead.notes?.length ? [...lead.notes].reverse().map((n, i) => (
                    <div key={i} className="note">
                      {n.text}
                      <div className="note-meta">{n.author} · {timeAgo(n.createdAt)}</div>
                    </div>
                  )) : <div className="muted" style={{ fontSize: 13 }}>No activity yet.</div>}
                </>
              ) : (
                <>
                  <div className="row" style={{ marginBottom: 12 }}>
                    {["whatsapp", "sms", "email"].map((ch) => (
                      <button key={ch} onClick={() => setDraft({ ...draft, channel: ch })}
                        className={"btn btn-sm" + (draft.channel === ch ? " btn-primary" : "")}>
                        {!channels[ch] && <Lock size={12} />} {ch}
                      </button>
                    ))}
                  </div>
                  {!channels[draft.channel] && (
                    <div className="banner locked" style={{ marginBottom: 12 }}>
                      <Lock /> {draft.channel} isn't activated yet. You can draft now; sending unlocks after DLT/registration.
                    </div>
                  )}
                  <textarea className="input" rows={4} placeholder={`Write a ${draft.channel} message…`}
                    value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
                  <div className="row" style={{ marginTop: 10, justifyContent: "flex-end" }}>
                    <button className="btn btn-primary btn-sm" onClick={sendMessage} disabled={!channels[draft.channel]}>
                      <Send size={14} /> {channels[draft.channel] ? "Send" : "Sending locked"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* right rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* pipeline */}
          <div className="card card-pad">
            <div className="card-title" style={{ fontSize: 14, marginBottom: 12 }}>Pipeline</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {STATUS_ORDER.map((s) => {
                const active = lead.status === s;
                const done = STATUS_ORDER.indexOf(lead.status) > STATUS_ORDER.indexOf(s);
                return (
                  <button key={s} onClick={() => changeStatus(s)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10,
                      background: active ? "var(--brand)" : "transparent", color: active ? "#fff" : done ? "var(--ink)" : "var(--muted)",
                      fontWeight: active ? 600 : 500, fontSize: 13.5, textAlign: "left", transition: "all .14s",
                    }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center",
                      border: `2px solid ${active ? "#fff" : done ? "var(--ok)" : "var(--line)"}`,
                      background: done ? "var(--ok)" : "transparent",
                    }}>
                      {done && <span style={{ color: "#fff", fontSize: 10 }}>✓</span>}
                    </span>
                    {STATUS_LABELS[s]}
                  </button>
                );
              })}
            </div>
            <div className="divider" />
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn-sm btn-danger" style={{ flex: 1 }} onClick={() => changeStatus("rejected")}>Rejected</button>
              <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => changeStatus("lost")}>Lost</button>
            </div>
          </div>

          {/* owner */}
          <div className="card card-pad">
            <div className="card-title" style={{ fontSize: 14, marginBottom: 10 }}>Owner</div>
            <select className="select" value={lead.assignedTo || ""} onChange={(e) => changeAssign(e.target.value)}>
              <option value="">Unassigned</option>
              {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
              {lead.assignedTo && !AGENTS.includes(lead.assignedTo) && <option value={lead.assignedTo}>{lead.assignedTo}</option>}
            </select>
          </div>

          {/* follow-up */}
          <div className="card card-pad">
            <div className="card-title" style={{ fontSize: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 7 }}>
              <CalendarClock size={15} /> Follow-up
            </div>
            {lead.followUpAt && (
              <div className="banner" style={{ marginBottom: 10, background: fuInfo.overdue ? "var(--hot-bg)" : "var(--ok-bg)", color: fuInfo.overdue ? "var(--hot)" : "var(--ok)" }}>
                {fuInfo.label}
              </div>
            )}
            <div className="row" style={{ gap: 8 }}>
              <input className="input" type="datetime-local" value={fu} onChange={(e) => setFu(e.target.value)} style={{ flex: 1 }} />
              <button className="btn btn-primary btn-sm" onClick={saveFollowUp}>Set</button>
            </div>
            {lead.followUpAt && <button className="btn btn-ghost btn-sm" onClick={clearFollowUp} style={{ marginTop: 8 }}>Clear</button>}
          </div>
        </div>
      </div>
      {node}
    </div>
  );
}
