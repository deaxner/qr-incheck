import React from 'react';
import { createRoot } from 'react-dom/client';
import { AdminApp } from './AdminApp';
import '../../../shared/ui/base.css';
import '../../../shared/ui/common.css';
import './admin.css';
import './team.css';
import './history.css';

const rootElement = document.getElementById('app');

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <AdminApp />
    </React.StrictMode>
  );
}
