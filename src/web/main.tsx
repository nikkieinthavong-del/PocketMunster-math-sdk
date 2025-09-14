import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initDefaultNetworkGuard } from './utils/networkGuard';
import './styles/index.css';

// Initialize runtime guard against external network calls
initDefaultNetworkGuard();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);