const json = (r) => r.json();

// In production (Cloudflare Pages) set VITE_API_URL to the Render backend URL,
// e.g. https://saarathi-crm-api.onrender.com  (no trailing slash).
// In dev leave it empty so Vite proxies /api -> localhost:5000.
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const TOKEN_KEY = "sarathi_token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

async function req(path, opts = {}) {
  const token = getToken();
  const res = await fetch(API_BASE + "/api" + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(opts.headers || {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  // Session invalid/expired on a protected route -> bounce to login.
  // (Skip /auth and /subscription: those handle their own 401 — the dev panel
  //  probes /subscription to decide whether to show its developer login.)
  if (res.status === 401 && !path.startsWith("/auth") && !path.startsWith("/subscription")) {
    setToken(null);
    if (!location.pathname.startsWith("/login")) location.assign("/login");
    throw new Error("Session expired");
  }
  if (!res.ok && res.status !== 423 && res.status !== 200) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Request failed (${res.status})`);
  }
  return json(res);
}

export const api = {
  // auth
  login: (email, password) => req("/auth/login", { method: "POST", body: { email, password } }),
  me: () => req("/auth/me"),
  forgot: (email) => req("/auth/forgot", { method: "POST", body: { email } }),
  resetPassword: (token, password) => req("/auth/reset", { method: "POST", body: { token, password } }),
  changePassword: (currentPassword, newPassword) =>
    req("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } }),
  // user management (developer only)
  listUsers: () => req("/auth/users"),
  createUser: (body) => req("/auth/users", { method: "POST", body }),
  deleteUser: (id) => req(`/auth/users/${id}`, { method: "DELETE" }),
  // leads
  listLeads: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== "" && v != null));
    return req("/leads?" + qs.toString());
  },
  getLead: (id) => req(`/leads/${id}`),
  createLead: (body) => req("/leads", { method: "POST", body }),
  importLeads: (leads) => req("/leads/import", { method: "POST", body: { leads } }),
  exportUrl: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== "" && v != null));
    return API_BASE + "/api/leads/export?" + qs.toString();
  },
  testLead: (body) => req("/intake/test", { method: "POST", body }),
  updateLead: (id, body) => req(`/leads/${id}`, { method: "PATCH", body }),
  setStatus: (id, status) => req(`/leads/${id}/status`, { method: "PATCH", body: { status } }),
  assign: (id, assignedTo) => req(`/leads/${id}/assign`, { method: "PATCH", body: { assignedTo } }),
  addNote: (id, text) => req(`/leads/${id}/notes`, { method: "POST", body: { text } }),
  setFollowUp: (id, followUpAt, followUpNote) =>
    req(`/leads/${id}/follow-up`, { method: "PATCH", body: { followUpAt, followUpNote } }),
  reclassify: (id) => req(`/leads/${id}/reclassify`, { method: "POST" }),
  deleteLead: (id) => req(`/leads/${id}`, { method: "DELETE" }),
  // dashboard
  stats: () => req("/dashboard"),
  // copilot
  copilot: (messages) => req("/copilot", { method: "POST", body: { messages } }),
  // messaging
  channels: () => req("/messaging/status"),
  // daily report
  dailyReport: () => req("/report/daily"),
  telegramStatus: () => req("/report/telegram/status"),
  sendReportTelegram: () => req("/report/telegram", { method: "POST" }),
  // whatsapp
  waStatus: () => req("/whatsapp/status"),
  waTemplates: () => req("/whatsapp/templates"),
  waConversations: () => req("/whatsapp/conversations"),
  waThread: (leadId) => req(`/whatsapp/thread/${leadId}`),
  waSend: (body) => req("/whatsapp/send", { method: "POST", body }),
  // subscription (status is public; the rest require a developer session token)
  subscriptionStatus: () => req("/subscription/status"),
  subGet: () => req("/subscription"),
  subSet: (body) => req("/subscription", { method: "POST", body }),
  subRenew: (days) => req("/subscription/renew", { method: "POST", body: { days } }),
  subToggle: (enabled) => req("/subscription/toggle", { method: "POST", body: { enabled } }),
};
