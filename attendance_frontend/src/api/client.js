const DEFAULT_BASE = 'http://localhost:3001';

// PUBLIC_INTERFACE
export const getApiBase = () => {
  /** Returns the HTTP API base URL using env vars with sensible defaults. */
  const envBase =
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_BACKEND_URL ||
    '';
  return (envBase || DEFAULT_BASE).replace(/\/*$/, '');
};

// Normalize query params to match backend expectations (userId/date/startDate/endDate)
function normalizeAttendanceParams(params) {
  if (!params) return undefined;
  const out = {};
  if (params.user_id !== undefined) out.userId = params.user_id;
  if (params.userId !== undefined) out.userId = params.userId;
  if (params.date !== undefined) out.date = params.date;
  if (params.startDate !== undefined) out.startDate = params.startDate;
  if (params.endDate !== undefined) out.endDate = params.endDate;
  return out;
}

// Basic fetch wrapper with JSON handling, errors, and query building
async function request(path, { method = 'GET', body, params, headers } = {}) {
  const base = getApiBase();
  // Ensure path has leading slash
  const safePath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${safePath}`);
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
    const err = new Error((data && (data.message || data.error)) || `Request failed: ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// PUBLIC_INTERFACE
export const api = {
  /** Health check: backend health is at GET "/" returning {message:"Healthy"} */
  health: async () => {
    try {
      const res = await request('/');
      // Normalize to { status: 'healthy' } for UI
      if (res && (res.message || res.status)) {
        const msg = (res.message || '').toString().toLowerCase();
        const ok = msg.includes('healthy') || (res.status && res.status === 'ok');
        return { status: ok ? 'healthy' : (res.status || 'unknown') };
      }
      return { status: 'unknown' };
    } catch {
      return { status: 'unreachable' };
    }
  },

  /** Users APIs (backend returns { users: [...] }) */
  getUsers: (params) => request('/api/users', { params }).then((d) => d?.users ?? d ?? []),
  getUser: (id) => request(`/api/users/${id}`),
  createUser: (payload) => request('/api/users', { method: 'POST', body: payload }),
  // The backend does not implement PUT/DELETE; calling these would 404 -> avoid by throwing clear error
  updateUser: async () => { throw new Error('Update user is not supported by the backend'); },
  deleteUser: async () => { throw new Error('Delete user is not supported by the backend'); },

  /** Attendance APIs (backend returns { attendance: [...] }) */
  getAttendance: (params) =>
    request('/api/attendance', { params: normalizeAttendanceParams(params) }).then((d) => d?.attendance ?? d ?? []),
  // Backend expects: { userId, date, status, notes }
  createAttendance: (payload) => {
    const body = {
      userId: payload.userId ?? payload.user_id,
      date: payload.date ?? (payload.timestamp ? payload.timestamp.slice(0, 10) : undefined),
      status: ['present', 'absent', 'late'].includes(payload.status) ? payload.status : 'present',
      notes: payload.notes ?? undefined,
    };
    return request('/api/attendance', { method: 'POST', body });
  },
  // Not implemented in backend
  getAttendanceById: async () => { throw new Error('Get attendance by id is not supported by the backend'); },
  updateAttendance: async () => { throw new Error('Update attendance is not supported by the backend'); },
  deleteAttendance: async () => { throw new Error('Delete attendance is not supported by the backend'); },

  /** Optional summary endpoint if backend supports it */
  summary: () => request('/api/summary').catch(() => null),
};

export default api;
