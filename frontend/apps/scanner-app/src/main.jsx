import React from 'react';
import { createRoot } from 'react-dom/client';
import { ScannerApp } from './ScannerApp';
import '../../../shared/ui/base.css';
import '../../../shared/ui/common.css';
import './scanner.css';

const rootElement = document.getElementById('app');

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <ScannerApp />
    </React.StrictMode>
  );
}
