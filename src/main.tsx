import React from 'react';
import ReactDOM from 'react-dom/client';
import './lib/fetchInterceptor';
import { initializeWebMcp } from './utils/webMcp';
import App from './App.tsx';
import './index.css';

initializeWebMcp();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
export {};
