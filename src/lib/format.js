export const LOAN_LABELS = {
  personal: "Personal Loan",
  home: "Home Loan",
  car: "Car Loan",
  business: "Business Loan",
  lap: "Loan Against Property",
  gold: "Gold Loan",
};
export const LOAN_SHORT = {
  personal: "Personal", home: "Home", car: "Car", business: "Business", lap: "LAP", gold: "Gold",
};
export const EMPLOYMENT_LABELS = {
  salaried: "Salaried", self_employed: "Self-employed", business_owner: "Business owner",
};
export const URGENCY_LABELS = {
  immediate: "Immediately", within_month: "Within a month", exploring: "Just exploring",
};
export const STATUS_LABELS = {
  new: "New", contacted: "Contacted", qualified: "Qualified",
  docs_collected: "Docs Collected", sanctioned: "Sanctioned", disbursed: "Disbursed",
  rejected: "Rejected", lost: "Lost",
};
export const STATUS_ORDER = ["new", "contacted", "qualified", "docs_collected", "sanctioned", "disbursed"];
export const SOURCE_LABELS = {
  meta: "Meta Ads", manual: "Manual", chatbot: "Chatbot", website: "Website", import: "Import", other: "Other",
};

export function inr(n, compact = false) {
  if (n == null || n === "") return "—";
  const v = Number(n);
  if (compact) {
    if (v >= 1e7) return "₹" + (v / 1e7).toFixed(v % 1e7 ? 1 : 0) + "Cr";
    if (v >= 1e5) return "₹" + (v / 1e5).toFixed(v % 1e5 ? 1 : 0) + "L";
    if (v >= 1e3) return "₹" + (v / 1e3).toFixed(0) + "k";
  }
  return "₹" + v.toLocaleString("en-IN");
}

export function timeAgo(date) {
  if (!date) return "—";
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  const d = Math.floor(s / 86400);
  if (d === 1) return "yesterday";
  if (d < 30) return d + "d ago";
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function dateTime(date) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
  });
}

export function followUpInfo(date) {
  if (!date) return null;
  const diff = new Date(date) - Date.now();
  const overdue = diff < 0;
  return { overdue, label: (overdue ? "Overdue · " : "") + dateTime(date) };
}

export const tierClass = (t) => `badge tier-${t || "unclassified"}`;
sdhkdshsjhdjsjkds