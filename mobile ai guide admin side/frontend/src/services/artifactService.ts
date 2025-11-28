import axios, { AxiosInstance } from 'axios';
import { Artifact } from '../types/Artifact';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const artifactService = {
  // Get all artifacts
  getAll: async () => {
    const response = await api.get<{ success: boolean; data: Artifact[]; total: number }>('/artifacts');
    return response.data;
  },

  // Get single artifact
  getById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: Artifact }>(`/artifacts/${id}`);
    return response.data;
  },

  // Create artifact
  create: async (artifact: Omit<Artifact, '_id' | 'created_at' | 'updated_at'>) => {
    const response = await api.post<{ success: boolean; message: string; data: Artifact }>('/artifacts', artifact);
    return response.data;
  },

  // Update artifact
  update: async (id: string, artifact: Partial<Omit<Artifact, '_id' | 'created_at' | 'updated_at'>>) => {
    const response = await api.put<{ success: boolean; message: string; data: Artifact }>(`/artifacts/${id}`, artifact);
    return response.data;
  },

  // Delete artifact
  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean; message: string; data: Artifact }>(`/artifacts/${id}`);
    return response.data;
  }
};
