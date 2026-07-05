import { useState, useRef } from "react";
import Papa from "papaparse";
import { X, UploadCloud, FileText, CheckCircle2, Download } from "lucide-react";

// canonical fields we import into, with header keywords for auto-mapping
const FIELDS = [
  { key: "name", label: "Name", hints: ["name", "full name", "customer", "lead name"] },
  { key: "phone", label: "Phone", hints: ["phone", "mobile", "contact", "number", "whatsapp"] },
  { key: "email", label: "Email", hints: ["email", "mail"] },
  { key: "city", label: "City", hints: ["city", "town", "location"] },
  { key: "loanType", label: "Loan type", hints: ["loan type", "loan", "product"] },
  { key: "amount", label: "Loan amount", hints: ["amount", "loan amount", "requirement", "ticket"] },
  { key: "employmentType", label: "Employment", hints: ["employment", "occupation", "profession", "job"] },
  { key: "monthlyIncome", label: "Monthly income", hints: ["income", "salary", "monthly income"] },
  { key: "urgency", label: "Urgency", hints: ["urgency", "how soon", "timeline", "when"] },
  { key: "existingLoan", label: "Existing loan", hints: ["existing", "current loan", "emi"] },
  { key: "status", label: "Status", hints: ["status", "stage"] },
  { key: "assignedTo", label: "Assigned to", hints: ["assigned", "owner", "agent", "rm"] },
  { key: "campaign", label: "Campaign", hints: ["campaign", "source campaign", "utm"] },
];

const CHUNK = 500;
const norm = (s) => String(s || "").toLowerCase().replace(/[_\-\s]+/g, " ").trim();

function autoMap(columns) {
  const m = {};
  for (const f of FIELDS) {
    const hit = columns.find((c) => f.hints.some((h) => norm(c) === norm(h)))
      || columns.find((c) => f.hints.some((h) => norm(c).includes(norm(h))));
    m[f.key] = hit || "";
  }
  return m;
}

function downloadTemplate() {
  const headers = FIELDS.map((f) => f.label).join(",");
  const example = ["Suresh Kumar", "98450 12345", "suresh@email.com", "Bengaluru", "Personal Loan", "500000", "Salaried", "75000", "Immediately", "No", "new", "Pooja", "Walk-in"].join(",");
  const blob = new Blob(["\uFEFF" + headers + "\n" + example + "\n"], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "saarathi-import-template.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function ImportModal({ onClose, onImported, importLeads, toast }) {
  const [step, setStep] = useState("pick"); // pick | map | importing | done
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [mapping, setMapping] = useState({});
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState({ inserted: 0, duplicates: 0, failed: 0 });
  const fileRef = useRef(null);

  function handleFile(file) {
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const cols = (res.meta.fields || []).filter(Boolean);
        const data = res.data || [];
        if (!cols.length || !data.length) return toast("Couldn't read any rows from that file");
        setColumns(cols);
        setRows(data);
        setMapping(autoMap(cols));
        setStep("map");
      },
      error: (err) => toast("Parse error: " + err.message),
    });
  }

  async function runImport() {
    if (!mapping.phone && !mapping.name) return toast("Map at least Name or Phone to a column");
    setStep("importing");
    setProgress({ done: 0, total: rows.length });

    // apply mapping -> canonical rows
    const canonical = rows.map((r) => {
      const o = {};
      for (const f of FIELDS) if (mapping[f.key]) o[f.key] = r[mapping[f.key]];
      return o;
    });

    const totals = { inserted: 0, duplicates: 0, failed: 0 };
    for (let i = 0; i < canonical.length; i += CHUNK) {
      const batch = canonical.slice(i, i + CHUNK);
      try {
        const res = await importLeads(batch);
        totals.inserted += res.inserted || 0;
        totals.duplicates += res.duplicates || 0;
        totals.failed += res.failed || 0;
      } catch (e) {
        totals.failed += batch.length;
      }
      setProgress({ done: Math.min(i + CHUNK, canonical.length), total: canonical.length });
    }
    setResult(totals);
    setStep("done");
    onImported?.();
  }

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="modal-wrap" onClick={step === "importing" ? undefined : onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-head">
          <div className="card-title">Import leads from CSV</div>
          {step !== "importing" && <button className="btn-ghost" onClick={onClose} style={{ padding: 4 }}><X size={20} /></button>}
        </div>

        <div className="modal-body">
          {step === "pick" && (
            <>
              <div
                onClick={() => fileRef.current?.click()}
                style={{ border: "2px dashed var(--line)", borderRadius: 14, padding: "40px 20px", textAlign: "center", cursor: "pointer", background: "#faf9f6" }}
              >
                <UploadCloud size={36} color="var(--brand)" style={{ marginBottom: 10 }} />
                <div style={{ fontWeight: 600 }}>Click to choose a .csv file</div>
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>Phone numbers are auto-cleaned and duplicates skipped.</div>
                <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
              </div>
              <button className="btn btn-ghost btn-sm" onClick={downloadTemplate} style={{ marginTop: 14 }}>
                <Download size={15} /> Download template CSV
              </button>
            </>
          )}

          {step === "map" && (
            <>
              <div className="row" style={{ alignItems: "center", marginBottom: 14, gap: 8 }}>
                <FileText size={16} color="var(--brand)" />
                <b>{rows.length.toLocaleString("en-IN")}</b> rows found · match your columns below
              </div>
              <div style={{ maxHeight: 320, overflowY: "auto", display: "grid", gap: 10 }}>
                {FIELDS.map((f) => (
                  <div key={f.key} style={{ display: "grid", gridTemplateColumns: "130px 1fr", alignItems: "center", gap: 12 }}>
                    <label style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-2)" }}>
                      {f.label}{(f.key === "phone" || f.key === "name") && <span style={{ color: "var(--brand)" }}> *</span>}
                    </label>
                    <select className="select" value={mapping[f.key] || ""} onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value })}>
                      <option value="">— skip —</option>
                      {columns.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 12 }}>* Map at least one. Imported leads are scored instantly (rule-based); you can AI re-score any lead later.</div>
            </>
          )}

          {step === "importing" && (
            <div style={{ padding: "20px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                <b>Importing…</b>
                <span className="muted">{progress.done.toLocaleString("en-IN")} / {progress.total.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ height: 10, background: "var(--line-2)", borderRadius: 20, overflow: "hidden" }}>
                <div style={{ width: pct + "%", height: "100%", background: "var(--brand)", borderRadius: 20, transition: "width .2s" }} />
              </div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 10, textAlign: "center" }}>Keep this open — large files import in batches.</div>
            </div>
          )}

          {step === "done" && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <CheckCircle2 size={44} color="var(--ok)" style={{ marginBottom: 12 }} />
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700 }}>Import complete</div>
              <div className="row" style={{ justifyContent: "center", gap: 22, marginTop: 18 }}>
                <div><div className="kpi-value" style={{ fontSize: 26, color: "var(--ok)" }}>{result.inserted}</div><div className="muted" style={{ fontSize: 12.5 }}>imported</div></div>
                <div><div className="kpi-value" style={{ fontSize: 26, color: "var(--warm)" }}>{result.duplicates}</div><div className="muted" style={{ fontSize: 12.5 }}>duplicates skipped</div></div>
                {result.failed > 0 && <div><div className="kpi-value" style={{ fontSize: 26, color: "var(--hot)" }}>{result.failed}</div><div className="muted" style={{ fontSize: 12.5 }}>failed</div></div>}
              </div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          {step === "map" && <button className="btn" onClick={() => setStep("pick")}>Back</button>}
          {step === "map" && <button className="btn btn-primary" onClick={runImport}>Import {rows.length.toLocaleString("en-IN")} leads</button>}
          {step === "done" && <button className="btn btn-primary" onClick={onClose}>Done</button>}
          {step === "pick" && <button className="btn" onClick={onClose}>Cancel</button>}
        </div>
      </div>
    </div>
  );
}
