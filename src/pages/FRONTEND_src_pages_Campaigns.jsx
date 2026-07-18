import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Megaphone, CheckCircle2, AlertCircle, RefreshCw, Copy, ExternalLink } from "lucide-react";
import { api } from "../lib/api.js";
import { timeAgo } from "../lib/format.js";
import { useToast } from "../components/ui.jsx";

// Backend base, so we can show the full public webhook URL to paste into Meta.
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const FALLBACK_BASE = "https://saarathi-backend.onrender.com";

function ConnCheck({ ok, label }) {
  return (
    <div className="conn-check">
      {ok ? (
        <CheckCircle2 size={16} className="conn-ok" />
      ) : (
        <AlertCircle size={16} className="conn-pending" />
      )}
      <span className="conn-check-label">{label}</span>
      <span className={"conn-tag " + (ok ? "conn-tag-ok" : "conn-tag-pending")}>
        {ok ? "Set" : "Not set"}
      </span>
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

  useEffect(() => {
    load();
  }, [load]);

  const conn = data?.connection;
  const webhookFull =
    (API_BASE || FALLBACK_BASE) + (conn?.webhookUrl || "/api/meta/webhook");

  const copyWebhook = () => {
    navigator.clipboard?.writeText(webhookFull).then(
      () => show("Webhook URL copied"),
      () => show("Copy failed — select it manually")
    );
  };

  return (
    <div className="page" style={{ maxWidth: 1080 }}>
      {node}

      <div className="camp-head">
        <div>
          <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 18 }}>
            <Megaphone size={19} color="var(--brand)" /> Campaigns
          </div>
          <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
            Meta (Facebook &amp; Instagram) lead ads flowing into the CRM.
          </div>
        </div>
        <button className="btn btn-sm" onClick={load} disabled={loading}>
          <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {/* ---- Connection status ---- */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div className="card-title">Connection</div>
          {conn && (
            <span className={"conn-pill " + (conn.live ? "conn-pill-live" : "conn-pill-setup")}>
              {conn.live ? "Live" : "Setup incomplete"}
            </span>
          )}
        </div>

        {conn ? (
          <>
            <div className="conn-grid">
              <ConnCheck ok={conn.verifyTokenSet} label="Verify token" />
              <ConnCheck ok={conn.appSecretSet} label="App secret" />
              <ConnCheck ok={conn.pageTokenSet} label="Page access token" />
            </div>

            {!conn.live && (
              <div className="muted conn-note">
                Add the missing values on the backend, then connect the webhook in your Meta app.
                Until then, campaign leads can&apos;t be pulled in automatically.
              </div>
            )}

            <div className="conn-webhook">
              <div className="muted conn-webhook-label">Webhook URL (paste into Meta)</div>
              <div className="conn-webhook-row">
                <code>{webhookFull}</code>
                <button className="btn btn-sm" onClick={copyWebhook}>
                  <Copy size={13} /> Copy
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="muted">{loading ? "Checking…" : "—"}</div>
        )}
      </div>

      {/* ---- Per-campaign breakdown ---- */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">By campaign</div>
          {data && (
            <span className="muted" style={{ fontSize: 13 }}>
              {data.totalMetaLeads} lead{data.totalMetaLeads === 1 ? "" : "s"} from Meta
            </span>
          )}
        </div>

        {err && <div className="banner locked" style={{ marginBottom: 12 }}>{err}</div>}

        {loading && !data ? (
          <div className="muted">Loading…</div>
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
                  <th>Last lead</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((c, i) => (
                  <tr key={i}>
                    <td className="camp-name">{c.campaign}</td>
                    <td className="num"><strong>{c.total}</strong></td>
                    <td className="num"><span className="badge tier-hot">{c.hot}</span></td>
                    <td className="num"><span className="badge tier-warm">{c.warm}</span></td>
                    <td className="num"><span className="badge tier-cold">{c.cold}</span></td>
                    <td className="num">{c.converted || "—"}</td>
                    <td className="muted" style={{ fontSize: 13 }}>{timeAgo(c.lastLeadAt)}</td>
                    <td>
                      <Link className="btn btn-sm" to="/leads">
                        View <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="camp-empty">
            <Megaphone size={26} color="var(--muted)" />
            <div style={{ fontWeight: 600, marginTop: 8 }}>No Meta leads yet.</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4, maxWidth: 380 }}>
              Once your lead ads are live and the webhook is connected, campaigns will appear here.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
