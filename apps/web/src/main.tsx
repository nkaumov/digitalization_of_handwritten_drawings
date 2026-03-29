import React from 'react';
import { createRoot } from 'react-dom/client';

import '@/i18n';
import { App } from '@/app/App';
import { ConfigProvider } from '@/config/ConfigProvider';
import '@/styles/app.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('ROOT_ELEMENT_NOT_FOUND');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <ConfigProvider>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);