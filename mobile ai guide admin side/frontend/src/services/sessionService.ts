import { UserSession } from "../types/UserSession";

const API_URL =
  (import.meta as any).env.VITE_API_URL || "http://localhost:5000/api";

export type SessionListQuery = {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  status?: "all" | "live" | "ended";
  language?: "all" | "en" | "si";
  minPrice?: number | "";
  maxPrice?: number | "";
  startFrom?: string;
  startTo?: string;
};

export type SessionListResponse = {
  items: UserSession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function listSessions(
  query: SessionListQuery = {},
): Promise<SessionListResponse> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (typeof value === "undefined" || value === null || value === "") return;
    if ((key === "status" || key === "language") && value === "all") return;
    params.set(key, String(value));
  });

  const url = params.toString()
    ? `${API_URL}/sessions?${params.toString()}`
    : `${API_URL}/sessions`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch sessions");
  const json = await res.json();
  return {
    items: json.data || [],
    pagination: json.pagination || {
      page: 1,
      limit: (query.limit as number) || 10,
      total: Array.isArray(json.data) ? json.data.length : 0,
      totalPages: 1,
    },
  };
}

export async function createSession(payload: {
  duration_hours: number;
  language?: string;
  price?: number;
}): Promise<UserSession> {
  const res = await fetch(`${API_URL}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create session");
  const json = await res.json();
  return json.data;
}

export async function extendSession(
  session_id: string,
  add_hours: number,
): Promise<UserSession> {
  const res = await fetch(
    `${API_URL}/sessions/${encodeURIComponent(session_id)}/extend`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ add_hours }),
    },
  );
  if (!res.ok) throw new Error("Failed to extend session");
  const json = await res.json();
  return json.data;
}

export async function addFeedback(
  session_id: string,
  feedback: string,
  star_rating?: number,
): Promise<UserSession> {
  const res = await fetch(
    `${API_URL}/sessions/${encodeURIComponent(session_id)}/feedback`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback, star_rating }),
    },
  );
  if (!res.ok) throw new Error("Failed to add feedback");
  const json = await res.json();
  return json.data;
}
