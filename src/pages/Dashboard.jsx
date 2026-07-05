import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell, PieChart, Pie,
} from "recharts";
import { Flame, Users, IndianRupee, CalendarClock, TrendingUp, Trophy } from "lucide-react";
import { api } from "../lib/api.js";
import { inr, LOAN_SHORT, STATUS_ORDER, STATUS_LABELS } from "../lib/format.js";

const TIER_COLORS = { hot: "#e5484d", warm: "#e8930c", cold: "#64748b", unclassified: "#c7c9d6" };
const BRAND = "#2d2f8f";

function Kpi({ icon: Icon, label, value, foot, tint }) {
  return (
    <div className="card kpi">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="kpi-label">{label}</div>
        <div className="kpi-accent" style={{ background: tint?.bg }}>
          <Icon color={tint?.fg} />
        </div>
      </div>
      <div className="kpi-value">{value}</div>
      {foot && <div className="kpi-foot">{foot}</div>}
    </div>
  );
}

export default function Dashboard({ stats, reload }) {
  const navigate = useNavigate();
  const [data, setData] = useState(stats);

  useEffect(() => { setData(stats); }, [stats]);
  useEffect(() => { if (!stats) api.stats().then(setData).catch(() => {}); }, []);

  if (!data) return <div className="center"><div className="spinner" /></div>;

  const k = data.kpis;

  const funnel = STATUS_ORDER.map((s) => ({
    name: STATUS_LABELS[s], value: data.byStatus?.[s] || 0,
  }));
  const tierData = ["hot", "warm", "cold"].map((t) => ({ name: t, value: data.byTier?.[t] || 0 }));
  const loanData = Object.entries(data.byLoan || {})
    .filter(([k]) => k)
    .map(([k, v]) => ({ name: LOAN_SHORT[k] || k, value: v }))
    .sort((a, b) => b.value - a.value);
  const trend = data.trend?.map((d) => ({
    day: new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    leads: d.count,
  }));
  const agents = (data.byAgent || []).slice(0, 5);
  const maxAssigned = Math.max(1, ...agents.map((a) => a.assigned));

  return (
    <div className="page">
      <div className="grid kpi-grid" style={{ marginBottom: 16 }}>
        <Kpi icon={Users} label="Total leads" value={k.total}
          foot={`${k.today} today · ${k.month} this month`}
          tint={{ bg: "var(--brand-soft)", fg: BRAND }} />
        <Kpi icon={Flame} label="Hot leads" value={k.hot}
          foot={`${k.hotPct}% of all leads`}
          tint={{ bg: "var(--hot-bg)", fg: "var(--hot)" }} />
        <Kpi icon={IndianRupee} label="Open pipeline" value={inr(k.pipelineValue, true)}
          foot={`${k.pipelineCount} active leads`}
          tint={{ bg: "var(--ok-bg)", fg: "var(--ok)" }} />
        <Kpi icon={CalendarClock} label="Follow-ups due" value={k.overdueFollowUps}
          foot={k.overdueFollowUps ? "needs attention" : "all clear"}
          tint={{ bg: "var(--warm-bg)", fg: "var(--warm)" }} />
        <Kpi icon={Trophy} label="Disbursed" value={k.disbursed}
          foot="closed-won"
          tint={{ bg: "var(--accent-soft)", fg: "#b8860b" }} />
      </div>

      <div className="grid cols-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Leads over time</div>
              <div className="card-sub">Last 14 days</div>
            </div>
            <TrendingUp size={18} color="var(--muted)" />
          </div>
          <div className="card-pad" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: -22, right: 8, top: 6 }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BRAND} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={BRAND} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #eee", fontSize: 13 }} />
                <Area type="monotone" dataKey="leads" stroke={BRAND} strokeWidth={2.5} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Lead quality</div></div>
          <div className="card-pad" style={{ height: 240, display: "flex", alignItems: "center" }}>
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie data={tierData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={74} paddingAngle={3} stroke="none">
                  {tierData.map((d) => <Cell key={d.name} fill={TIER_COLORS[d.name]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #eee", fontSize: 13, textTransform: "capitalize" }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {tierData.map((d) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: TIER_COLORS[d.name] }} />
                  <span style={{ textTransform: "capitalize", fontSize: 13.5, flex: 1 }}>{d.name}</span>
                  <b style={{ fontFamily: "var(--font-display)" }}>{d.value}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid cols-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-head">
            <div><div className="card-title">Pipeline funnel</div><div className="card-sub">Where leads sit</div></div>
          </div>
          <div className="card-pad" style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} layout="vertical" margin={{ left: 32, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={92} tick={{ fontSize: 12, fill: "#555" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#faf9f6" }} contentStyle={{ borderRadius: 10, border: "1px solid #eee", fontSize: 13 }} />
                <Bar dataKey="value" fill={BRAND} radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div><div className="card-title">By loan type</div><div className="card-sub">Demand mix</div></div>
          </div>
          <div className="card-pad" style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loanData} margin={{ left: -22, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "#faf9f6" }} contentStyle={{ borderRadius: 10, border: "1px solid #eee", fontSize: 13 }} />
                <Bar dataKey="value" fill="var(--accent)" radius={[6, 6, 0, 0]} barSize={34} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <div className="card-head"><div className="card-title">Agent leaderboard</div></div>
          <div className="card-pad">
            {agents.length === 0 && <div className="muted" style={{ fontSize: 13 }}>No leads assigned yet.</div>}
            {agents.map((a) => (
              <div key={a.agent} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 5 }}>
                  <b>{a.agent}</b>
                  <span className="muted">{a.assigned} leads · {a.disbursed} disbursed</span>
                </div>
                <div style={{ height: 7, background: "var(--line-2)", borderRadius: 20 }}>
                  <div style={{ width: `${(a.assigned / maxAssigned) * 100}%`, height: "100%", background: BRAND, borderRadius: 20 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Top cities</div></div>
          <div className="card-pad">
            {(data.topCities || []).length === 0 && <div className="muted" style={{ fontSize: 13 }}>No city data.</div>}
            {(data.topCities || []).map((c, i) => (
              <div key={c.city} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: i < data.topCities.length - 1 ? "1px solid var(--line-2)" : "none" }}>
                <span style={{ width: 22, height: 22, borderRadius: 6, background: "var(--brand-soft)", color: BRAND, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700 }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 14 }}>{c.city}</span>
                <b style={{ fontFamily: "var(--font-display)" }}>{c.count}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
