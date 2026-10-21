import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const http = axios.create({
  baseURL: apiBaseUrl,
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use((config) => {
  const saved = localStorage.getItem('bibliotech.session');
  if (saved) {
    try {
      const { token } = JSON.parse(saved);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      localStorage.removeItem('bibliotech.session');
    }
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) window.dispatchEvent(new Event('bibliotech:unauthorized'));
    if (status === 403) error.userMessage = 'You do not have permission to perform this action.';
    else if (!error.response) {
      const origin = typeof window === 'undefined' ? 'this application' : window.location.origin;
      error.userMessage = `No response from the API gateway at ${apiBaseUrl}. Confirm it is running and allows requests from ${origin}.`;
    }
    else if (status >= 500) error.userMessage = `The library service returned HTTP ${status}. Check that the service is running and registered with Eureka.`;
    else error.userMessage = typeof error.response.data === 'string'
      ? error.response.data
      : error.response.data?.message || error.message;
    return Promise.reject(error);
  },
);

export function errorMessage(error) {
  return error?.userMessage || error?.message || 'Something went wrong. Please try again.';
}

export default http;