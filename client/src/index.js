import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Evita que errores de extensiones del navegador activen el overlay de desarrollo de CRA
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  const esErrorDeExtension = (filename = '', stack = '') =>
    filename.startsWith('chrome-extension://') ||
    filename.startsWith('moz-extension://') ||
    stack.includes('chrome-extension://') ||
    stack.includes('moz-extension://');

  window.addEventListener(
    'error',
    (event) => {
      if (esErrorDeExtension(event.filename, event.error?.stack)) {
        event.stopImmediatePropagation();
      }
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      if (esErrorDeExtension('', event.reason?.stack)) {
        event.stopImmediatePropagation();
      }
    },
    true
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
