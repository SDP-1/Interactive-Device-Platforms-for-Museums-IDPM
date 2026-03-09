import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token if present
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('museum_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 globally
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('museum_token');
            localStorage.removeItem('museum_user');
            // Redirect only if on tablet pages
            if (window.location.pathname.startsWith('/tablet')) {
                window.location.href = '/tablet/login';
            }
        }
        return Promise.reject(err);
    }
);

// ---------- Auth ----------
export const authService = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (data) => api.post('/auth/register', data),
    getMe: () => api.get('/auth/me'),
};

// ---------- Cities ----------
export const cityService = {
    getAll: () => api.get('/cities'),
    getById: (id) => api.get(`/cities/${id}`),
    create: (data) => api.post('/cities', data),
    update: (id, data) => api.put(`/cities/${id}`, data),
    delete: (id) => api.delete(`/cities/${id}`),
};

// ---------- Events ----------
export const eventService = {
    getAll: (params) => api.get('/events', { params }),
    getById: (id) => api.get(`/events/${id}`),
    create: (data) => api.post('/events', data),
    update: (id, data) => api.put(`/events/${id}`, data),
    delete: (id) => api.delete(`/events/${id}`),
    checkDuplicate: (name) => api.get('/events/check-duplicate', { params: { name } }),
};

// ---------- Influences ----------
export const influenceService = {
    analyze: (eventId) => api.post(`/influences/analyze/${eventId}`),
    getAll: (params) => api.get('/influences', { params }),
    accept: (id, data) => (id ? api.put(`/influences/${id}/accept`) : api.post('/influences/accept', data)),
    reject: (id, data) => (id ? api.put(`/influences/${id}/reject`, data) : api.post('/influences/reject', data)),
};

export default api;
