import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const suppressError = (msg: string | undefined) => {
  if (!msg) return false;
  const lower = msg.toLowerCase();
  return lower.includes('websocket') || lower.includes('vite') || lower.includes('closed without opened');
};

window.addEventListener('error', (e) => {
  if (suppressError(e.message) || suppressError(e.error?.message) || suppressError(typeof e.error === 'string' ? e.error : '')) {
    e.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (e) => {
  if (suppressError(e.reason?.message) || suppressError(typeof e.reason === 'string' ? e.reason : '')) {
    e.preventDefault();
  }
});

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}