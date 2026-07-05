import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Filter, Inbox, X, Sparkles, Upload, Download } from "lucide-react";
import { api } from "../lib/api.js";
import {
  inr, timeAgo, LOAN_SHORT, LOAN_LABELS, EMPLOYMENT_LABELS, URGENCY_LABELS,
  SOURCE_LABELS, STATUS_LABELS, followUpInfo,
} from "../lib/format.js";
import { Tier, Status, scoreColor, useToast } from "../components/ui.jsx";
import ImportModal from "../components/ImportModal.jsx";

const TIERS = ["", "hot", "warm", "cold"];
const STATUSES = ["", "new", "contacted", "qualified", "docs_collected", "sanctioned", "disbursed", "rejected", "lost"];
const LOANS = ["", "personal", "home", "car", "business", "lap", "gold"];

function NewLeadModal({ onClose, onCreated, toast }) {
  const [f, setF] = useState({
    name: "", phone: "", email: "", city: "",
    loanType: "personal", amount: "", employmentType: "salaried",
    monthlyIncome: "", urgency: "immediate", existingLoan: "false",
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit() {
    if (!f.name && !f.phone) return toast("Add at least a name or phone");
    setBusy(true);
    try {
      const body = {
        ...f,
        amount: f.amount ? Number(f.amount) : null,
        monthlyIncome: f.monthlyIncome ? Number(f.monthlyIncome) : null,
        existingLoan: f.existingLoan === "true",
      };
      const { duplicate, lead } = await api.testLead(body);
      toast(duplicate ? "Lead already exists" : `Added · scored ${lead.tier?.toUpperCase()}`);
      onCreated();
      onClose();
    } catch (e) {
      toast(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-wrap" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="card-title">Add a lead</div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: 4 }}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="row">
            <div className="field" style={{ flex: 1, minWidth: 180 }}>
              <label>Name</label>
              <input className="input" value={f.name} onChange={set("name")} placeholder="Customer name" />
            </div>
            <div className="field" style={{ flex: 1, minWidth: 180 }}>
              <label>Phone</label>
              <input className="input" value={f.phone} onChange={set("phone")} placeholder="98450 12345" />
            </div>
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1, minWidth: 180 }}>
              <label>Email</label>
              <input className="input" value={f.email} onChange={set("email")} placeholder="optional" />
            </div>
            <div className="field" style={{ flex: 1, minWidth: 180 }}>
              <label>City</label>
              <input className="input" value={f.city} onChange={set("city")} placeholder="Bengaluru" />
            </div>
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label>Loan type</label>
              <select className="select" value={f.loanType} onChange={set("loanType")}>
                {Object.entries(LOAN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label>Amount (₹)</label>
              <input className="input" type="number" value={f.amount} onChange={set("amount")} placeholder="500000" />
            </div>
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label>Employment</label>
              <select className="select" value={f.employmentType} onChange={set("employmentType")}>
                {Object.entries(EMPLOYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label>Monthly income (₹)</label>
              <input className="input" type="number" value={f.monthlyIncome} onChange={set("monthlyIncome")} placeholder="60000" />
            </div>
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label>Urgency</label>
              <select className="select" value={f.urgency} onChange={set("urgency")}>
                {Object.entries(URGENCY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label>Existing loan / EMI?</label>
              <select className="select" value={f.existingLoan} onChange={set("existingLoan")}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy ? <span className="spinner" style={{ width: 15, height: 15, borderTopColor: "#fff", borderColor: "rgba(255,255,255,.3)" }} /> : <Sparkles size={15} />}
            {busy ? "Scoring…" : "Add & classify"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Leads({ reload }) {
  const navigate = useNavigate();
  const { show, node } = useToast();
  const [leads, setLeads] = useState(null);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ tier: "", status: "", loanType: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [modal, setModal] = useState(false);
  const [importing, setImporting] = useState(false);

  const load = useCallback(() => {
    api.listLeads({ search, ...filters, limit: 100 })
      .then((d) => { setLeads(d.leads); setTotal(d.total); })
      .catch((e) => show(e.message));
  }, [search, filters, show]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const refreshAll = () => { load(); reload?.(); };

  function exportCsv() {
    const a = document.createElement("a");
    a.href = api.exportUrl({ search, ...filters });
    a.click();
  }

  return (
    <div className="page">
      <div className="toolbar">
        <div className="search">
          <Search />
          <input placeholder="Search name, phone, email, city…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className={"btn" + (showFilters ? " btn-primary" : "")} onClick={() => setShowFilters((s) => !s)}>
          <Filter size={16} /> Filters
        </button>
        <button className="btn" onClick={() => setImporting(true)}>
          <Upload size={16} /> Import
        </button>
        <button className="btn" onClick={exportCsv}>
          <Download size={16} /> Export
        </button>
        <button className="btn btn-accent" onClick={() => setModal(true)}>
          <Plus size={16} /> Add lead
        </button>
      </div>

      {showFilters && (
        <div className="row" style={{ marginBottom: 16 }}>
          <select className="chip-select" value={filters.tier} onChange={(e) => setFilters({ ...filters, tier: e.target.value })}>
            {TIERS.map((t) => <option key={t} value={t}>{t ? t[0].toUpperCase() + t.slice(1) + " tier" : "All tiers"}</option>)}
          </select>
          <select className="chip-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            {STATUSES.map((s) => <option key={s} value={s}>{s ? STATUS_LABELS[s] : "All statuses"}</option>)}
          </select>
          <select className="chip-select" value={filters.loanType} onChange={(e) => setFilters({ ...filters, loanType: e.target.value })}>
            {LOANS.map((l) => <option key={l} value={l}>{l ? LOAN_LABELS[l] : "All loan types"}</option>)}
          </select>
          {(filters.tier || filters.status || filters.loanType) && (
            <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ tier: "", status: "", loanType: "" })}>Clear</button>
          )}
        </div>
      )}

      <div className="card">
        {leads === null ? (
          <div style={{ padding: 60 }} className="center"><div className="spinner" /></div>
        ) : leads.length === 0 ? (
          <div className="empty">
            <Inbox />
            <div>No leads match. Try clearing filters or add one.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="leads">
              <thead>
                <tr>
                  <th>Lead</th><th>Loan</th><th>Amount</th><th>Tier</th>
                  <th>Score</th><th>Status</th><th>Owner</th><th>Follow-up</th><th>Added</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => {
                  const fu = followUpInfo(l.followUpAt);
                  return (
                    <tr key={l._id} onClick={() => navigate(`/leads/${l._id}`)}>
                      <td>
                        <div className="lead-name">{l.name || "(no name)"}</div>
                        <div className="lead-phone">{l.phone || "—"}{l.city ? ` · ${l.city}` : ""}</div>
                      </td>
                      <td className="nowrap">{LOAN_SHORT[l.loanType] || "—"}</td>
                      <td className="nowrap">{inr(l.amount, true)}</td>
                      <td><Tier tier={l.tier} /></td>
                      <td><span className="score-pill" style={{ color: scoreColor(l.score) }}>{l.score ?? "—"}</span></td>
                      <td><Status status={l.status} /></td>
                      <td className="nowrap muted">{l.assignedTo || "—"}</td>
                      <td className="nowrap" style={{ fontSize: 12.5, color: fu?.overdue ? "var(--hot)" : "var(--muted)", fontWeight: fu?.overdue ? 600 : 400 }}>
                        {fu ? fu.label : "—"}
                      </td>
                      <td className="nowrap muted" style={{ fontSize: 12.5 }}>{timeAgo(l.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {leads && <div className="muted" style={{ fontSize: 12.5, marginTop: 12, textAlign: "right" }}>{total} lead{total !== 1 ? "s" : ""}</div>}

      {modal && <NewLeadModal onClose={() => setModal(false)} onCreated={refreshAll} toast={show} />}
      {importing && <ImportModal onClose={() => setImporting(false)} onImported={refreshAll} importLeads={api.importLeads} toast={show} />}
      {node}
    </div>
  );
}
