import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Ensure the root element exists; provide a clear error to aid debugging in dev
const container = document.getElementById('root');
if (!container) {
  // PUBLIC_INTERFACE
  // Throwing early prevents cryptic runtime errors if the root div is missing.
  throw new Error("Root element with id 'root' not found. Ensure public/index.html includes <div id=\"root\"></div>.");
}

const root = ReactDOM.createRoot(container);
root.render(
  // Keep StrictMode; App sets up router internally
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
