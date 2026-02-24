import { UserSession } from "../types/UserSession";

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';

export async function listSessions(): Promise<UserSession[]> {
  const res = await fetch(`${API_URL}/sessions`);
  if (!res.ok) throw new Error("Failed to fetch sessions");
  const json = await res.json();
  return json.data;
}

export async function createSession(payload: { duration_hours: number; language?: string; price?: number }): Promise<UserSession> {
  const res = await fetch(`${API_URL}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create session");
  const json = await res.json();
  return json.data;
}

export async function extendSession(session_id: string, add_hours: number): Promise<UserSession> {
  const res = await fetch(`${API_URL}/sessions/${encodeURIComponent(session_id)}/extend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ add_hours }),
  });
  if (!res.ok) throw new Error("Failed to extend session");
  const json = await res.json();
  return json.data;
}

export async function addFeedback(session_id: string, feedback: string, star_rating?: number): Promise<UserSession> {
  const res = await fetch(`${API_URL}/sessions/${encodeURIComponent(session_id)}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ feedback, star_rating }),
  });
  if (!res.ok) throw new Error("Failed to add feedback");
  const json = await res.json();
  return json.data;
}
