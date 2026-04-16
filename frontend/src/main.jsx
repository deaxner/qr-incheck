import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles/base.css';

const rootElement = document.getElementById('app');

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App initialEmployees={[]} />
    </React.StrictMode>
  );
}
