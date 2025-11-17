import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client';

function AttendanceForm({ users, onCancel, onSubmit, submitting }) {
  const [form, setForm] = useState({
    userId: '',
    status: 'present',
    timestamp: new Date().toISOString().slice(0, 16), // input type=datetime-local format (YYYY-MM-DDTHH:mm)
    notes: ''
  });
  const [touched, setTouched] = useState({ userId: false, timestamp: false });

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const onBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const userInvalid = touched.userId && !form.userId;
  const tsInvalid = touched.timestamp && !form.timestamp;

  return (
    <form
      className="card"
      onSubmit={(e) => {
        e.preventDefault();
        setTouched({ userId: true, timestamp: true });
        if (form.userId && form.timestamp) {
          const payload = { ...form, timestamp: new Date(form.timestamp).toISOString() };
          onSubmit(payload);
        }
      }}
      aria-label="Create attendance record form"
      noValidate
    >
      <div className="card-header">
        <div className="card-title">Log Attendance</div>
      </div>
      <div className="grid two">
        <div>
          <label className="helper">User</label>
          <select
            className={`select ${userInvalid ? 'is-invalid' : touched.userId ? 'is-valid' : ''}`}
            name="userId"
            value={form.userId}
            onChange={onChange}
            onBlur={onBlur}
            required
          >
            <option value="" disabled>Select user</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
          {userInvalid ? <div className="form-error">Please select a user.</div> : <div className="form-help">Choose the user for this entry.</div>}
        </div>
        <div>
          <label className="helper">Status</label>
          <select className="select" name="status" value={form.status} onChange={onChange}>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
          </select>
        </div>
        <div>
          <label className="helper">Timestamp</label>
          <input
            className={`input ${tsInvalid ? 'is-invalid' : touched.timestamp ? 'is-valid' : ''}`}
            type="datetime-local"
            name="timestamp"
            value={form.timestamp}
            onChange={onChange}
            onBlur={onBlur}
            required
          />
          {tsInvalid ? <div className="form-error">Timestamp is required.</div> : <div className="form-help">Local date and time for the record.</div>}
        </div>
        <div>
          <label className="helper">Notes</label>
          <input
            className="input"
            name="notes"
            value={form.notes}
            onChange={onChange}
            placeholder="Optional notes"
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

  const [filters, setFilters] = useState({ userId: '', date: '' });
  const onFilter = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));

  const filtered = useMemo(() => records, [records]); // server-side filtering

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [userList, attendanceList] = await Promise.all([
        api.getUsers().catch(() => []),
        api.getAttendance({ userId: filters.userId || undefined, date: filters.date || undefined }),
      ]);
      const usersArr = Array.isArray(userList) ? userList : (userList?.users || []);
      setUsers(usersArr);
      const attArr = Array.isArray(attendanceList) ? attendanceList : (attendanceList?.attendance || []);
      setRecords(attArr);
    } catch (e) {
      setError(e.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filters.userId, filters.date]);

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
            <select className="select" name="userId" value={filters.userId} onChange={onFilter}>
              <option value="">All users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
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
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.userId}</td>
                    <td><span className="badge">{r.status}</span></td>
                    <td>{r.date}</td>
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
