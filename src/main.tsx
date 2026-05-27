import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import SuperAdmin from './SuperAdmin.tsx';
import './index.css';
import { DataProvider } from './DataContext.tsx';

const path = window.location.pathname;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataProvider>
      {path === '/superadmin' ? <SuperAdmin /> : <App />}
    </DataProvider>
  </StrictMode>,
);
