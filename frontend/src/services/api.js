/**
 * API Service for Sri Lankan History Q&A Backend
 */

const API_BASE_URL = '/api';

/**
 * Ask a question about Sri Lankan history
 * @param {string} question - The question to ask
 * @returns {Promise<{question: string, answer: string, info: string, success: boolean}>}
 */
export async function askQuestion(question) {
  try {
    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error asking question:', error);
    throw error;
  }
}

/**
 * Get example questions from the backend
 * @returns {Promise<{examples: string[]}>}
 */
export async function getExampleQuestions() {
  try {
    const response = await fetch(`${API_BASE_URL}/example-questions`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching example questions:', error);
    throw error;
  }
}

/**
 * Check if the backend is healthy
 * @returns {Promise<{status: string, message: string}>}
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking health:', error);
    throw error;
  }
}

