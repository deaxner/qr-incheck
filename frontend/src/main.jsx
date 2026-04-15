import React from 'react';
import { createRoot } from 'react-dom/client';
import { QrIncheckApp } from './components/QrIncheckApp';
import './styles/app.css';

const rootElement = document.getElementById('app');

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <QrIncheckApp initialEmployees={[]} />
    </React.StrictMode>
  );
}
