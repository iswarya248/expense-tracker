import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  signup: (data) => API.post('/auth/signup', data),
  login: (data) => API.post('/auth/login', data),
  me: () => API.get('/auth/me'),
};

// ── Expenses ──────────────────────────────────────────────────────────────────
export const expensesAPI = {
  getAll: (params) => API.get('/expenses', { params }),
  getOne: (id) => API.get(`/expenses/${id}`),
  getLast: () => API.get('/expenses/last/one'),
  create: (data) => API.post('/expenses', data),
  update: (id, data) => API.put(`/expenses/${id}`, data),
  delete: (id) => API.delete(`/expenses/${id}`),
  bulkDelete: (ids) => API.delete('/expenses', { data: { ids } }),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  summary: () => API.get('/analytics/summary'),
  trend: (months) => API.get('/analytics/trend', { params: { months } }),
  topExpenses: (params) => API.get('/analytics/top-expenses', { params }),
  categoryDetail: () => API.get('/analytics/category-detail'),
};

// ── Chat ──────────────────────────────────────────────────────────────────────
export const chatAPI = {
  send: (message) => API.post('/chat', { message }),
  clearHistory: () => API.delete('/chat/history'),
};

export default API;
