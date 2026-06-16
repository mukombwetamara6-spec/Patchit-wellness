import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register Service Worker for Offline Caching Support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Patch It ServiceWorker registered with scope: ', registration.scope);
      })
      .catch((error) => {
        console.error('Patch It ServiceWorker registration failed: ', error);
      });
  });
}

