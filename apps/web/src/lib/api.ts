const API_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * Lagrar token i localStorage för demo.
 * (I prod kan du använda httpOnly cookies istället.)
 */
export function setToken(token: string | null) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

export function getToken() {
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = data?.fel || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T = any>(path: string) => request<T>(path),
  health: () => request<{ ok: boolean }>("/health"),
  login: (epost: string, losen: string) =>
    request<{ token: string; user: any }>("/auth/login", { method: "POST", body: JSON.stringify({ epost, losen }) }),
  me: () => request<{ user: any }>("/auth/me"),

  // CRM
  leads: (q?: string) => request<{ items: any[] }>(`/crm/leads${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  accounts: (q?: string) => request<{ items: any[] }>(`/crm/accounts${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  contacts: (accountId?: string) => request<{ items: any[] }>(`/crm/contacts${accountId ? `?accountId=${encodeURIComponent(accountId)}` : ""}`),
  deals: () => request<{ items: any[] }>(`/crm/deals`),

  // HR
  employees: (q?: string) => request<{ items: any[] }>(`/hr/employees${q ? `?q=${encodeURIComponent(q)}` : ""}`),

  // ERP
  invoices: () => request<{ items: any[] }>(`/erp/invoices`),

  // Resurs
  projects: () => request<{ items: any[] }>(`/res/projects`),
  assignments: () => request<{ items: any[] }>(`/res/assignments`),

  // Data
  events: (page = 1, pageSize = 20) =>
    request<{ items: any[]; total: number; page: number; pageSize: number }>(`/data/events?page=${page}&pageSize=${pageSize}`),
  kpis: (from: string, to: string) =>
    request<{ intakterSEK: number; winRatePct: number; belaggningAvgPct: number }>(`/data/kpis?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
};
