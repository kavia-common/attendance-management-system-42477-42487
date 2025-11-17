import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import './theme.css';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/UsersPage';
import AttendancePage from './pages/AttendancePage';

function Navbar() {
  return (
    <div className="navbar">
      <div className="navbar-inner">
        <div className="brand">
          <div className="brand-badge" aria-hidden />
          Attendance
        </div>
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
          <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Users</NavLink>
          <NavLink to="/attendance" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Attendance</NavLink>
        </div>
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Sidebar navigation">
      <div className="section-title">Quick Links</div>
      <div className="menu">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Overview</NavLink>
        <NavLink to="/users" className={({ isActive }) => isActive ? 'active' : ''}>Manage Users</NavLink>
        <NavLink to="/attendance" className={({ isActive }) => isActive ? 'active' : ''}>Log Attendance</NavLink>
      </div>
    </aside>
  );
}

// PUBLIC_INTERFACE
export default function AppRouter() {
  /** Routing entrypoint for the application with primary layout */
  return (
    <BrowserRouter>
      <Navbar />
      <div className="layout">
        <Sidebar />
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
