import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { MetaChannelsProvider } from './context/MetaChannelsContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MetaChannelsProvider>
      <App />
    </MetaChannelsProvider>
  </StrictMode>,
);
