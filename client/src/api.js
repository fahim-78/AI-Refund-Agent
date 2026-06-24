export const API_BASE = import.meta.env.VITE_API_BASE || "https://ai-refund-agent.onrender.com";

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.detail || `Request to ${path} failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  listCustomers: () => request("/api/customers"),
  createSession: () => request("/api/session", { method: "POST" }),
  getSession: (id) => request(`/api/session/${id}`),
  sendMessage: (sessionId, message) =>
    request("/api/chat", {
      method: "POST",
      body: JSON.stringify({ sessionId, message }),
    }),
  adminListSessions: () => request("/api/admin/sessions"),
  adminGetSession: (id) => request(`/api/admin/sessions/${id}`),
  adminGetCrm: () => request("/api/admin/crm"),
};
