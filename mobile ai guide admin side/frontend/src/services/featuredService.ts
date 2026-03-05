import axios, { AxiosInstance } from "axios";
import { FeaturedExhibit } from "../types/FeaturedExhibit";

const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:5000/api";

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export const featuredService = {
  getAll: async () => {
    const response = await api.get<{ success: boolean; data: FeaturedExhibit[]; total: number }>("/featured-exhibits");
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: FeaturedExhibit }>(`/featured-exhibits/${id}`);
    return response.data;
  },
  create: async (payload: Partial<FeaturedExhibit>) => {
    const response = await api.post<{ success: boolean; message: string; data: FeaturedExhibit }>("/featured-exhibits", payload);
    return response.data;
  },
  update: async (id: string, payload: Partial<FeaturedExhibit>) => {
    const response = await api.put<{ success: boolean; message: string; data: FeaturedExhibit }>(`/featured-exhibits/${id}`, payload);
    return response.data;
  },
  updateOrder: async (id: string, order: string[]) => {
    const response = await api.put<{ success: boolean; message: string; data: FeaturedExhibit }>(`/featured-exhibits/${id}/order`, { order });
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean; message: string; data: FeaturedExhibit }>(`/featured-exhibits/${id}`);
    return response.data;
  },
};
