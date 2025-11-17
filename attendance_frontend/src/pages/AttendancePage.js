import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client';

function AttendanceForm({ users, onCancel, onSubmit, submitting }) {
  const [form, setForm] = useState({
    user_id: '',
    status: 'present',
    timestamp: new Date().toISOString().slice(0, 16), // input type=datetime-local format (YYYY-MM-DDTHH:mm)
  });
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <form
      className="card"
      onSubmit={(e) => { e.preventDefault(); const payload = { ...form, timestamp: new Date(form.timestamp).toISOString() }; onSubmit(payload); }}
      aria-label="Create attendance record form"
    >
      <div className="card-header">
        <div className="card-title">Log Attendance</div>
      </div>
      <div className="grid two">
        <div>
          <label className="helper">User</label>
          <select className="select" name="user_id" value={form.user_id} onChange={onChange} required>
            <option value="" disabled>Select user</option>
            {users.map((u) => (
              <option key={u.id || u._id} value={u.id || u._id}>{u.name} ({u.email})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="helper">Status</label>
          <select className="select" name="status" value={form.status} onChange={onChange}>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="check-in">Check-in</option>
            <option value="check-out">Check-out</option>
          </select>
        </div>
        <div>
          <label className="helper">Timestamp</label>
          <input
            className="input"
            type="datetime-local"
            name="timestamp"
            value={form.timestamp}
            onChange={onChange}
            required
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="btn" type="submit" disabled={submitting}>{submitting ? 'Logging…' : 'Log Entry'}</button>
        <button className="btn ghost" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

// PUBLIC_INTERFACE
export default function AttendancePage() {
  /** Attendance page: filter and create records */
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [filters, setFilters] = useState({ user_id: '', date: '' });
  const onFilter = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));

  const filtered = useMemo(() => records, [records]); // server-side filtering

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [userList, attendanceList] = await Promise.all([
        api.getUsers().catch(() => []),
        api.getAttendance({ user_id: filters.user_id || undefined, date: filters.date || undefined }),
      ]);
      setUsers(Array.isArray(userList) ? userList : (userList?.data || []));
      const arr = Array.isArray(attendanceList) ? attendanceList : (attendanceList?.data || []);
      setRecords(arr);
    } catch (e) {
      setError(e.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filters.user_id, filters.date]);

  async function handleCreate(payload) {
    setSubmitting(true);
    try {
      await api.createAttendance(payload);
      await load();
      setShowForm(false);
    } catch (e) {
      alert(e?.data?.message || e.message || 'Failed to log attendance');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Attendance</div>
            <div className="card-subtitle">Browse, filter, and log entries</div>
          </div>
          <div className="toolbar">
            <select className="select" name="user_id" value={filters.user_id} onChange={onFilter}>
              <option value="">All users</option>
              {users.map((u) => (
                <option key={u.id || u._id} value={u.id || u._id}>{u.name}</option>
              ))}
            </select>
            <input className="input" type="date" name="date" value={filters.date} onChange={onFilter} />
            <button className="btn secondary" onClick={() => setShowForm(true)}>Log New</button>
          </div>
        </div>
        {loading ? (
          <div className="helper">Loading attendance…</div>
        ) : error ? (
          <div className="helper" style={{ color: 'var(--error)' }}>{error}</div>
        ) : (
          <div className="table-wrap" role="region" aria-label="Attendance table">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>ID</th>
                  <th>User</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id || r._id}>
                    <td>{r.id || r._id}</td>
                    <td>{r.user_name || r.user?.name || r.user_id}</td>
                    <td><span className="badge">{r.status}</span></td>
                    <td>{r.timestamp ? new Date(r.timestamp).toLocaleString() : '-'}</td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={4} className="helper">No records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <AttendanceForm
          users={users}
          submitting={submitting}
          onCancel={() => setShowForm(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}
