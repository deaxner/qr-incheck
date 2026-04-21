import React from 'react';
import { createRoot } from 'react-dom/client';
import { EmployeeApp } from './EmployeeApp';
import '../../../shared/ui/base.css';
import '../../../shared/ui/common.css';
import './employee.css';

const rootElement = document.getElementById('app');

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <EmployeeApp />
    </React.StrictMode>
  );
}
