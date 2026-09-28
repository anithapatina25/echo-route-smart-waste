/**
 * ECHO ROUTE SMART WASTE - Frontend API Client
 */
const API_BASE = '/api';

export async function apiClient(endpoint, { method = 'GET', body = null, headers = {} } = {}) {
  const token = localStorage.getItem('echo_route_token');

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data?.error?.message || data?.message || `HTTP ${response.status}: Request failed`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.details = data?.error?.details || null;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const networkError = new Error('Cannot reach Echo Route server. Please check your internet or server status.');
      networkError.status = 0;
      throw networkError;
    }
    throw err;
  }
}
