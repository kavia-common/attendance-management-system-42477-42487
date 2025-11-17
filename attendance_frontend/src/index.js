import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // Keep StrictMode; App sets up router internally
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
