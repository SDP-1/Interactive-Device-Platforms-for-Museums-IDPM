// API service for connecting to Flask backend
// Falls back to mock data if API is unavailable

const API_BASE = '/api';

// Check if API is available
export const checkApiAvailability = async () => {
  try {
    const response = await fetch(`${API_BASE}/artifacts`, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(2000)
    });
    return response.ok;
  } catch {
    return false;
  }
};

// Fetch all artifacts
export const fetchArtifacts = async () => {
  try {
    const response = await fetch(`${API_BASE}/artifacts`);
    if (!response.ok) throw new Error('Failed to fetch artifacts');
    return await response.json();
  } catch (error) {
    console.warn('API unavailable, using mock data:', error.message);
    return null;
  }
};

// Fetch single artifact
export const fetchArtifact = async (artifactId) => {
  try {
    const response = await fetch(`${API_BASE}/artifacts/${artifactId}`);
    if (!response.ok) throw new Error('Failed to fetch artifact');
    return await response.json();
  } catch (error) {
    console.warn('API unavailable:', error.message);
    return null;
  }
};

// Fetch similar artifacts
export const fetchSimilarArtifacts = async (artifactId, limit = 5) => {
  try {
    const response = await fetch(`${API_BASE}/artifacts/${artifactId}/similar?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch similar artifacts');
    return await response.json();
  } catch (error) {
    console.warn('API unavailable:', error.message);
    return null;
  }
};

// Fetch AI explanation
export const fetchAiExplanation = async (artifactId) => {
  try {
    const response = await fetch(`${API_BASE}/artifacts/${artifactId}/explain`);
    if (!response.ok) throw new Error('Failed to fetch explanation');
    const data = await response.json();
    return data.explanation;
  } catch (error) {
    console.warn('API unavailable:', error.message);
    return null;
  }
};

// Compare two artifacts
export const compareArtifacts = async (artifact1Id, artifact2Id) => {
  try {
    const response = await fetch(`${API_BASE}/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        artifact1_id: artifact1Id,
        artifact2_id: artifact2Id
      })
    });
    if (!response.ok) throw new Error('Failed to compare artifacts');
    return await response.json();
  } catch (error) {
    console.warn('API unavailable:', error.message);
    return null;
  }
};
