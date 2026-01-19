import axios from 'axios';

const API_BASE_URL = '/api';

export const apiService = {
  // Get list of available analysis scenarios
  async getScenarios() {
    try {
      const response = await axios.get(`${API_BASE_URL}/scenarios`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch scenarios');
    }
  },

  // Generate scenario-based analysis for an artifact
  async generateScenarioAnalysis(artid, scenarioId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/generate`, {
        artid,
        scenario_id: scenarioId
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to generate analysis');
    }
  },

  // Check API health
  async healthCheck() {
    try {
      const response = await axios.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('API is not available');
    }
  },

  // Get model status
  async getModelStatus() {
    try {
      const response = await axios.get('/model-status');
      return response.data;
    } catch (error) {
      throw new Error('Failed to get model status');
    }
  }
};
