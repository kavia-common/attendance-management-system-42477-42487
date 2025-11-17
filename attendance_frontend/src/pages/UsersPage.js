import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client';

function UserForm({ onCancel, onSubmit, submitting }) {
  const [form, setForm] = useState({ name: '', email: '' });
  const [touched, setTouched] = useState({ name: false, email: false });

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const onBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const nameInvalid = touched.name && !form.name?.trim();
  const emailInvalid = touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email || '');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setTouched({ name: true, email: true });
        if (!nameInvalid && !emailInvalid) onSubmit(form);
      }}
      className="card"
      aria-label="Create user form"
      noValidate
    >
      <div className="card-header">
        <div className="card-title">Create User</div>
      </div>
      <div className="grid two">
        <div>
          <label className="helper">Name</label>
          <input
            className={`input ${nameInvalid ? 'is-invalid' : touched.name ? 'is-valid' : ''}`}
            name="name"
            value={form.name || ''}
            onChange={onChange}
            onBlur={onBlur}
            required
            placeholder="Jane Doe"
          />
          {nameInvalid ? <div className="form-error">Name is required.</div> : <div className="form-help">Full name of the user.</div>}
        </div>
        <div>
          <label className="helper">Email</label>
          <input
            className={`input ${emailInvalid ? 'is-invalid' : touched.email ? 'is-valid' : ''}`}
            name="email"
            type="email"
            value={form.email || ''}
            onChange={onChange}
            onBlur={onBlur}
            required
            placeholder="jane@example.com"
          />
          {emailInvalid ? <div className="form-error">Enter a valid email address.</div> : <div className="form-help">Used for login and contact.</div>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="btn" type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</button>
        <button className="btn ghost" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

// PUBLIC_INTERFACE
export default function UsersPage() {
  /** Users page: list and create (backend supports GET/POST) */
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return users;
    const q = query.toLowerCase();
    return users.filter((u) => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
  }, [users, query]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const arr = await api.getUsers();
      setUsers(Array.isArray(arr) ? arr : (arr?.users || []));
    } catch (e) {
      setError(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(payload) {
    setSubmitting(true);
    try {
      await api.createUser(payload);
      await load();
      setShowForm(false);
    } catch (e) {
      alert(e?.data?.message || e.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Users</div>
            <div className="card-subtitle">Manage registered users</div>
          </div>
          <div className="toolbar">
            <input className="input" placeholder="Search users…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button className="btn" onClick={() => { setShowForm(true); }}>New User</button>
          </div>
        </div>
        {loading ? (
          <div className="helper">Loading users…</div>
        ) : error ? (
          <div className="helper" style={{ color: 'var(--error)' }}>{error}</div>
        ) : (
          <div className="table-wrap" role="region" aria-label="Users table">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={3} className="helper">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <UserForm
          submitting={submitting}
          onCancel={() => { setShowForm(false); }}
          onSubmit={(payload) => { handleCreate(payload); }}
        />
      )}
    </div>
  );
}
