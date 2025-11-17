import React, { useEffect, useState } from 'react';
import api, { getApiBase } from '../api/client';

// PUBLIC_INTERFACE
export default function Dashboard() {
  /**
   * Dashboard shows quick stats: total users, today's records, API health.
   * Attempts to use /api/summary if available; otherwise falls back to fetching users/attendance and counting.
   */
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState({ status: 'checking' });
  const [stats, setStats] = useState({ totalUsers: 0, todayRecords: 0 });
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [healthRes, summaryRes] = await Promise.all([api.health(), api.summary()]);
        if (isMounted) setHealth(healthRes);

        if (summaryRes) {
          if (isMounted) {
            setStats({
              totalUsers: summaryRes.total_users || 0,
              todayRecords: summaryRes.today_records || 0,
            });
          }
        } else {
          // Fallback: fetch lists and compute basics
          const [users, attendance] = await Promise.all([
            api.getUsers().catch(() => []),
            api.getAttendance({ date: new Date().toISOString().slice(0, 10) }).catch(() => []),
          ]);
          if (isMounted) {
            setStats({
              totalUsers: Array.isArray(users) ? users.length : (users?.length || 0),
              todayRecords: Array.isArray(attendance) ? attendance.length : (attendance?.length || 0),
            });
          }
        }
      } catch (e) {
        if (isMounted) setError(e.message || 'Failed to load dashboard');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, []);

  const healthy = health?.status === 'healthy';

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Welcome</div>
            <div className="card-subtitle">API: {getApiBase()}</div>
          </div>
          <span
            className="badge"
            aria-live="polite"
            style={{
              background: healthy ? 'rgba(16,185,129,0.08)' : '#fff',
              borderColor: healthy ? 'rgba(16,185,129,0.3)' : 'var(--border)',
              color: healthy ? '#065f46' : 'inherit'
            }}
          >
            {healthy ? 'Healthy' : (health?.status || 'Checking…')}
          </span>
        </div>
        {loading ? (
          <div className="helper">Loading dashboard…</div>
        ) : error ? (
          <div className="helper" style={{ color: 'var(--error)' }}>{error}</div>
        ) : (
          <div className="grid three">
            <div className="stat">
              <div className="label">Total Users</div>
              <div className="value">{stats.totalUsers}</div>
              <div className="hint">Registered</div>
            </div>
            <div className="stat">
              <div className="label">Today's Records</div>
              <div className="value">{stats.todayRecords}</div>
              <div className="hint">Entries today</div>
            </div>
            <div className="stat">
              <div className="label">API Health</div>
              <div className="value">{health?.status || 'unknown'}</div>
              <div className="hint">GET /</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
