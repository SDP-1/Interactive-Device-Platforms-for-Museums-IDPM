import axios, { AxiosInstance } from 'axios';
import { King } from '../types/King';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const kingService = {
  getAll: async () => {
    const response = await api.get<{ success: boolean; data: King[]; total: number }>('/kings');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: King }>(`/kings/${id}`);
    return response.data;
  },

  create: async (king: Omit<King, '_id' | 'created_at' | 'updated_at'>) => {
    const response = await api.post<{ success: boolean; message: string; data: King }>('/kings', king);
    return response.data;
  },

  update: async (id: string, king: Partial<Omit<King, '_id' | 'created_at' | 'updated_at'>>) => {
    const response = await api.put<{ success: boolean; message: string; data: King }>(`/kings/${id}`, king);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean; message: string; data: King }>(`/kings/${id}`);
    return response.data;
  }
};
