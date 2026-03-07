import { DashboardFeedbackResponse, DashboardOverview } from "../types/Dashboard";

const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:5000/api";

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const res = await fetch(`${API_URL}/dashboard/overview`);
  if (!res.ok) throw new Error("Failed to load dashboard overview");
  const json = await res.json();
  return json.data;
}

export async function getDashboardFeedbacks(): Promise<DashboardFeedbackResponse> {
  const res = await fetch(`${API_URL}/dashboard/feedbacks`);
  if (!res.ok) throw new Error("Failed to load feedback details");
  const json = await res.json();
  return json.data;
}
