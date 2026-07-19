import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users, Flame, Trophy, CheckCircle2, AlertCircle,
  RefreshCw, Copy, ArrowUpRight, Megaphone,
} from "lucide-react";
import { api } from "../lib/api.js";
import { timeAgo } from "../lib/format.js";
import { useToast } from "../components/ui.jsx";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const FALLBACK_BASE = "https://saarathi-backend.onrender.com";

function ConnRow({ ok, label, hint }) {
  return (
    <div className="conn-row">
      <span className={"conn-ic " + (ok ? "is-ok" : "is-pending")}>
        {ok ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
      </span>
      <div className="conn-row-text">
        <div className="conn-row-label">{label}</div>
        <div className="conn-row-hint muted">{hint}</div>
      </div>
      <span className={"conn-tag " + (ok ? "conn-tag-ok" : "conn-tag-pending")}>
        {ok ? "Set" : "Not set"}
      </span>
    </div>
  );
}

function StatTile({ icon, label, value, foot, accent }) {
  return (
    <div className="card kpi camp-stat">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="kpi-label">{label}</div>
        <div className="kpi-accent" style={{ background: accent.bg, color: accent.fg }}>
          {icon}
        </div>
      </div>
      <div className="kpi-value">{value}</div>
      {foot && <div className="kpi-foot">{foot}</div>}
    </div>
  );
}

export default function Campaigns() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const { show, node } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    setErr("");
    api
      .metaCampaigns()
      .then(setData)
      .catch((e) => setErr(e.message || "Could not load campaigns"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const conn = data?.connection;
  const webhookFull = (API_BASE || FALLBACK_BASE) + (conn?.webhookUrl || "/api/meta/webhook");

  const copyWebhook = () => {
    navigator.clipboard?.writeText(webhookFull).then(
      () => show("Webhook URL copied"),
      () => show("Copy failed — select it manually")
    );
  };

  const totals = (data?.campaigns || []).reduce(
    (a, c) => ({
      hot: a.hot + c.hot,
      converted: a.converted + (c.converted || 0),
    }),
    { hot: 0, converted: 0 }
  );

  return (
    <div className="page camp-page">
      {node}

      <div className="camp-head">
        <p className="muted camp-intro">
          Leads from your Meta (Facebook &amp; Instagram) ad campaigns, captured automatically.
        </p>
        <button className="btn btn-sm" onClick={load} disabled={loading}>
          <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {/* summary tiles */}
      {data && (
        <div className="grid kpi-grid camp-stats">
          <StatTile
            icon={<Users />} label="Meta leads" value={data.totalMetaLeads}
            foot={`${data.campaigns.length} campaign${data.campaigns.length === 1 ? "" : "s"}`}
            accent={{ bg: "var(--brand-soft)", fg: "var(--brand)" }}
          />
          <StatTile
            icon={<Flame />} label="Hot" value={totals.hot}
            foot="high-intent leads"
            accent={{ bg: "var(--hot-bg)", fg: "var(--hot)" }}
          />
          <StatTile
            icon={<Trophy />} label="Converted" value={totals.converted}
            foot="sanctioned or disbursed"
            accent={{ bg: "var(--accent-soft)", fg: "var(--accent)" }}
          />
        </div>
      )}

      {/* connection */}
      <div className="card camp-card">
        <div className="card-head">
          <div>
            <div className="card-title">Connection</div>
            <div className="card-sub">Meta Lead Ads webhook status</div>
          </div>
          {conn && (
            <span className={"conn-pill " + (conn.live ? "conn-pill-live" : "conn-pill-setup")}>
              <span className="conn-pill-dot" />
              {conn.live ? "Live" : "Setup incomplete"}
            </span>
          )}
        </div>

        {conn ? (
          <div className="card-pad">
            <div className="conn-list">
              <ConnRow ok={conn.verifyTokenSet} label="Verify token" hint="Handshake secret for the webhook" />
              <ConnRow ok={conn.appSecretSet} label="App secret" hint="Signs and verifies incoming leads" />
              <ConnRow ok={conn.pageTokenSet} label="Page access token" hint="Lets us fetch the lead details" />
            </div>

            {!conn.live && (
              <div className="conn-callout">
                Add the missing values on the backend, then connect the webhook in your Meta app.
                Until then, campaign leads can&apos;t be pulled in automatically.
              </div>
            )}

            <div className="conn-webhook">
              <div className="muted conn-webhook-label">Webhook URL — paste this into Meta</div>
              <div className="conn-webhook-row">
                <code>{webhookFull}</code>
                <button className="btn btn-sm" onClick={copyWebhook}>
                  <Copy size={13} /> Copy
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card-pad muted">{loading ? "Checking…" : "—"}</div>
        )}
      </div>

      {/* per-campaign */}
      <div className="card camp-card">
        <div className="card-head">
          <div>
            <div className="card-title">By campaign</div>
            <div className="card-sub">Lead quality split per ad campaign</div>
          </div>
        </div>

        {err && <div className="card-pad"><div className="banner locked">{err}</div></div>}

        {loading && !data ? (
          <div className="card-pad muted">Loading…</div>
        ) : data && data.campaigns.length ? (
          <div className="table-wrap">
            <table className="table camp-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th className="num">Leads</th>
                  <th className="num">Hot</th>
                  <th className="num">Warm</th>
                  <th className="num">Cold</th>
                  <th className="num">Converted</th>
                  <th className="camp-last">Last lead</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((c, i) => (
                  <tr key={i}>
                    <td className="camp-name">{c.campaign}</td>
                    <td className="num camp-total">{c.total}</td>
                    <td className="num"><span className="pill-count pc-hot">{c.hot}</span></td>
                    <td className="num"><span className="pill-count pc-warm">{c.warm}</span></td>
                    <td className="num"><span className="pill-count pc-cold">{c.cold}</span></td>
                    <td className="num camp-conv">{c.converted || "—"}</td>
                    <td className="camp-last muted">{timeAgo(c.lastLeadAt)}</td>
                    <td className="camp-action">
                      <Link className="btn btn-sm btn-ghost" to="/leads">
                        View <ArrowUpRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="camp-empty">
            <div className="camp-empty-ic"><Megaphone size={24} /></div>
            <div className="camp-empty-title">No campaign leads yet</div>
            <div className="muted camp-empty-sub">
              Once your lead ads are live and the webhook is connected, campaigns will appear here.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
