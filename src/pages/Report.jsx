import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw, Send, Sparkles, Flame, CalendarClock, IndianRupee, Inbox,
  Phone, ChevronRight, Info, CheckCircle2,
} from "lucide-react";
import { api } from "../lib/api.js";
import { inr, dateTime, LOAN_SHORT, followUpInfo } from "../lib/format.js";
import { Tier, scoreColor, useToast } from "../components/ui.jsx";

function Stat({ icon: Icon, label, value, tint }) {
  return (
    <div className="card kpi">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="kpi-label">{label}</div>
        <div className="kpi-accent" style={{ background: tint?.bg }}><Icon color={tint?.fg} /></div>
      </div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}

export default function Report() {
  const navigate = useNavigate();
  const { show, node } = useToast();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [tg, setTg] = useState({ configured: false });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.dailyReport();
      setReport(r);
    } catch (e) {
      show(e.message);
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => {
    load();
    api.telegramStatus().then(setTg).catch(() => {});
  }, [load]);

  async function sendTelegram() {
    setSending(true);
    try {
      await api.sendReportTelegram();
      show("Report sent to Telegram ✓");
    } catch (e) {
      show(e.message);
    } finally {
      setSending(false);
    }
  }

  if (loading && !report) {
    return (
      <div className="page">
        <div className="center"><div style={{ textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto 12px" }} /><div className="muted" style={{ fontSize: 13 }}>Writing today's report…</div></div></div>
      </div>
    );
  }
  if (!report) return null;

  const s = report.summary;

  const LeadRow = ({ l, showFollow }) => {
    const fu = showFollow ? followUpInfo(l.followUpAt) : null;
    return (
      <div
        onClick={() => navigate(`/leads/${l.id}`)}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid var(--line-2)", cursor: "pointer" }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{l.name}</div>
          <div className="muted" style={{ fontSize: 12.5 }}>
            {LOAN_SHORT[l.loanType] || "—"} · {inr(l.amount, true)}
            {showFollow && fu ? <span style={{ color: fu.overdue ? "var(--hot)" : "var(--muted)", fontWeight: fu.overdue ? 600 : 400 }}> · {fu.label}</span> : null}
          </div>
        </div>
        {!showFollow && (
          <span className="lead-phone nowrap" style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Phone size={13} />{l.phone}
          </span>
        )}
        {!showFollow && <span className="score-pill" style={{ color: scoreColor(l.score) }}>{l.score ?? "—"}</span>}
        <ChevronRight size={16} color="var(--muted)" />
      </div>
    );
  };

  return (
    <div className="page">
      {/* header */}
      <div className="card card-pad" style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700 }}>
            {new Date(report.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>End-of-day snapshot</div>
        </div>
        <div className="row">
          <button className="btn btn-sm" onClick={load} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <RefreshCw size={15} />} Regenerate
          </button>
          <button className="btn btn-primary btn-sm" onClick={sendTelegram} disabled={sending || !tg.configured} title={tg.configured ? "" : "Configure Telegram in .env first"}>
            {sending ? <span className="spinner" style={{ width: 14, height: 14, borderTopColor: "#fff", borderColor: "rgba(255,255,255,.3)" }} /> : <Send size={15} />}
            {tg.configured ? "Send to Telegram" : "Telegram not set up"}
          </button>
        </div>
      </div>

      {!tg.configured && (
        <div className="banner locked" style={{ marginBottom: 16 }}>
          <Info />
          To enable Telegram delivery: create a bot via <b>@BotFather</b>, then set <code style={{ background: "rgba(0,0,0,.06)", padding: "1px 6px", borderRadius: 5 }}>TELEGRAM_BOT_TOKEN</code> and <code style={{ background: "rgba(0,0,0,.06)", padding: "1px 6px", borderRadius: 5 }}>TELEGRAM_CHAT_ID</code> in the backend <b>.env</b> and restart.
        </div>
      )}

      {/* AI summary */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={16} color="var(--accent)" />
            <div className="card-title">Today in a nutshell</div>
          </div>
        </div>
        <div className="card-pad">
          <div className="reason-box" style={{ fontSize: 14.5, lineHeight: 1.6 }}>{report.narrative}</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid kpi-grid" style={{ marginBottom: 16 }}>
        <Stat icon={Inbox} label="New leads today" value={s.newToday} tint={{ bg: "var(--brand-soft)", fg: "var(--brand)" }} />
        <Stat icon={Flame} label="Hot to call" value={report.hotToCall.length} tint={{ bg: "var(--hot-bg)", fg: "var(--hot)" }} />
        <Stat icon={CalendarClock} label="Follow-ups due" value={s.followUpsDue} tint={{ bg: "var(--warm-bg)", fg: "var(--warm)" }} />
        <Stat icon={IndianRupee} label="Open pipeline" value={inr(s.pipelineValue, true)} tint={{ bg: "var(--ok-bg)", fg: "var(--ok)" }} />
        <Stat icon={CheckCircle2} label="Disbursed today" value={s.disbursedToday} tint={{ bg: "var(--accent-soft)", fg: "#b8860b" }} />
      </div>

      {/* lists */}
      <div className="grid cols-2">
        <div className="card">
          <div className="card-head">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Flame size={16} color="var(--hot)" />
              <div className="card-title">Hot — call first</div>
            </div>
            <span className="card-sub">{report.hotToCall.length}</span>
          </div>
          <div className="card-pad">
            {report.hotToCall.length === 0 ? (
              <div className="muted" style={{ fontSize: 13 }}>No hot leads waiting — pipeline's clean. 👍</div>
            ) : (
              report.hotToCall.map((l) => <LeadRow key={l.id} l={l} />)
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CalendarClock size={16} color="var(--warm)" />
              <div className="card-title">Follow-ups due</div>
            </div>
            <span className="card-sub">{report.followUpsDue.length}</span>
          </div>
          <div className="card-pad">
            {report.followUpsDue.length === 0 ? (
              <div className="muted" style={{ fontSize: 13 }}>Nothing overdue. All caught up. ✅</div>
            ) : (
              report.followUpsDue.map((l) => <LeadRow key={l.id} l={l} showFollow />)
            )}
          </div>
        </div>
      </div>
      {node}
    </div>
  );
}
