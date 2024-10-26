import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';  // Added .js extension

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);