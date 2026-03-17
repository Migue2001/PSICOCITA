import { createRoot } from 'react-dom/client';
console.log('[boot] main start');
const rootEl = document.getElementById('root');
if (rootEl) {
  rootEl.textContent = 'Iniciando PsicoCita...';
}

import App from './App.jsx';
import './index.css';

// Log global errors to help diagnose blank screens in production
const injectGlobalErrorLogger = () => {
  const showOverlay = (message) => {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.top = '10px';
    el.style.right = '10px';
    el.style.zIndex = '9999';
    el.style.background = '#ffecec';
    el.style.color = '#a00';
    el.style.padding = '10px';
    el.style.border = '1px solid #f99';
    el.style.borderRadius = '6px';
    el.style.maxWidth = '320px';
    el.style.fontFamily = 'sans-serif';
    el.innerText = `Error de app: ${message}`;
    document.body.appendChild(el);
  };
  window.addEventListener('error', (e) => {
    console.error('Global error:', e.error || e.message);
    showOverlay(e.error?.message || e.message || 'Error desconocido');
  });
  window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled rejection:', e.reason);
    showOverlay(e.reason?.message || JSON.stringify(e.reason));
  });
};

injectGlobalErrorLogger();

// Quitamos StrictMode para evitar dobles montajes que podrían generar locks en producción.
createRoot(rootEl).render(<App />);
