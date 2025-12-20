import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import './config/chart'; // Register Chart.js components
import { initGTMConsentMode } from './lib/gtmConsent';

// Initialize GTM Consent Mode v2 BEFORE React renders
// This ensures no cookies are set until user explicitly consents
initGTMConsentMode();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
