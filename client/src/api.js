import axios from 'axios';

// Базовый адрес API берётся из переменной окружения Vite (.env)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
});

export const TOKEN_KEY = 'medconnect.token';
export const USER_KEY = 'medconnect.user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Перехватчик запроса: подставляет JWT в заголовок Authorization
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Перехватчик ответа: приводит ошибки к единому виду и обрабатывает 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && getToken()) {
      // Токен истёк или недействителен - сессия завершается
      clearSession();
      window.dispatchEvent(new Event('medconnect:unauthorized'));
    }

    const message = error.response?.data?.error
      || (error.code === 'ECONNABORTED' ? 'Превышено время ожидания ответа сервера' : null)
      || (error.response ? `Ошибка сервера: ${error.response.status}` : null)
      || 'Сервер недоступен. Проверьте, запущен ли backend на порту 3000';

    return Promise.reject(Object.assign(new Error(message), {
      status: error.response?.status ?? 0,
      original: error,
    }));
  }
);

// --- аутентификация --------------------------------------------------------
export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data);

export const register = (payload) =>
  api.post('/auth/register', payload).then((r) => r.data);

export const fetchProfile = (signal) =>
  api.get('/profile', { signal }).then((r) => r.data);

// --- консультации ----------------------------------------------------------
export const fetchConsultations = (params, signal) =>
  api.get('/consultations', { params, signal }).then((r) => r.data);

export const addConsultation = (payload) =>
  api.post('/consultations', payload).then((r) => r.data);

export const updateConsultation = (id, payload) =>
  api.put(`/consultations/${id}`, payload).then((r) => r.data);

export const deleteConsultation = (id) =>
  api.delete(`/consultations/${id}`).then((r) => r.data);

// --- врачи -----------------------------------------------------------------
export const fetchDoctors = (signal) =>
  api.get('/doctors', { params: { limit: 50 }, signal }).then((r) => r.data);

export default api;
