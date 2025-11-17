const DEFAULT_BASE = 'http://localhost:3001';

// PUBLIC_INTERFACE
export const getApiBase = () => {
  /** Returns the API base URL from env or default. */
  const envBase =
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_BACKEND_URL ||
    process.env.REACT_APP_WS_URL; // fallback if misconfigured
  return (envBase || DEFAULT_BASE).replace(/\/+$/, '');
};

// Basic fetch wrapper with JSON handling, errors, and query building
async function request(path, { method = 'GET', body, params, headers } = {}) {
  const url = new URL(`${getApiBase()}${path}`);
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.append(k, v);
    });
  }
  const init = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  const res = await fetch(url.toString(), init);
  const contentType = res.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text().catch(() => null);
  }
  if (!res.ok) {
    const err = new Error((data && data.message) || `Request failed: ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// PUBLIC_INTERFACE
export const api = {
  /** Health check */
  health: () => request('/api/health').catch(() => ({ status: 'unreachable' })),

  /** Users APIs */
  getUsers: (params) => request('/api/users', { params }),
  getUser: (id) => request(`/api/users/${id}`),
  createUser: (payload) => request('/api/users', { method: 'POST', body: payload }),
  updateUser: (id, payload) => request(`/api/users/${id}`, { method: 'PUT', body: payload }),
  deleteUser: (id) => request(`/api/users/${id}`, { method: 'DELETE' }),

  /** Attendance APIs */
  getAttendance: (params) => request('/api/attendance', { params }),
  createAttendance: (payload) => request('/api/attendance', { method: 'POST', body: payload }),
  getAttendanceById: (id) => request(`/api/attendance/${id}`),
  updateAttendance: (id, payload) => request(`/api/attendance/${id}`, { method: 'PUT', body: payload }),
  deleteAttendance: (id) => request(`/api/attendance/${id}`, { method: 'DELETE' }),

  /** Optional summary endpoint if backend supports it */
  summary: () => request('/api/summary').catch(() => null),
};

export default api;
