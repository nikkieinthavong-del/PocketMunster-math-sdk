import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initNetworkGuard } from "./utils/networkGuard";
import './styles/index.css';
import "./utils/globalErrorLog";

// Initialize guard early
initNetworkGuard({
  allowlist: [],                 // keep empty for Stake compliance  allowlist: [],                 // keep empty for Stake compliance
  mode: import.meta.env.PROD ? "block" : "warn"
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);