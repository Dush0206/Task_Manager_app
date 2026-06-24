// ===== API Configuration =====
const API_BASE = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

async function request(endpoint, options = {}) {
  const token = getToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }
  const res = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// Auth
export const authAPI = {
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login:    (body) => request('/auth/login', { method: 'POST', body }),
  me:       ()     => request('/auth/me'),
};

// Tasks
export const tasksAPI = {
  getAll:  (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/tasks${qs ? '?' + qs : ''}`);
  },
  create:  (body)       => request('/tasks', { method: 'POST', body }),
  update:  (id, body)   => request(`/tasks/${id}`, { method: 'PUT', body }),
  remove:  (id)         => request(`/tasks/${id}`, { method: 'DELETE' }),
  stats:   ()           => request('/tasks/stats/summary'),
};
