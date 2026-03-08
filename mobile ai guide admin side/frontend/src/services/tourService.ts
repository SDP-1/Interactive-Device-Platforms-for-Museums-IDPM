import axios, { AxiosInstance } from "axios";
import { NewTour, Tour, TourPoint } from "../types/Tour";

const API_URL =
  (import.meta as any).env.VITE_API_URL || "http://localhost:5000/api";

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

type ToursResponse = {
  success: boolean;
  data: Tour[];
  total?: number;
};

type TourResponse = {
  success: boolean;
  data: Tour;
  message?: string;
};

export const tourService = {
  getAll: async (): Promise<ToursResponse> => {
    const response = await api.get<ToursResponse>("/tours");
    return response.data;
  },

  getById: async (id: string): Promise<TourResponse> => {
    const response = await api.get<TourResponse>(`/tours/${id}`);
    return response.data;
  },

  create: async (payload: NewTour): Promise<TourResponse> => {
    const response = await api.post<TourResponse>("/tours", payload);
    return response.data;
  },

  update: async (id: string, payload: Partial<NewTour>): Promise<TourResponse> => {
    const response = await api.put<TourResponse>(`/tours/${id}`, payload);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<TourResponse>(`/tours/${id}`);
    return response.data;
  },

  savePoints: async (tourId: string, points: TourPoint[]): Promise<TourResponse> => {
    const response = await api.put<TourResponse>(`/tours/${tourId}/points`, {
      points,
    });
    return response.data;
  },
};

export default tourService;
