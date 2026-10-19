import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthProvider';
import { registerServiceWorker } from './registerSW';

// Run the app against an in-memory mock API when there is no backend.
// On by default in local dev; force on/off anywhere with VITE_MOCK_API=true|false.
const useMockApi =
    import.meta.env.VITE_MOCK_API === 'true' ||
    (import.meta.env.DEV && import.meta.env.VITE_MOCK_API !== 'false');

async function bootstrap() {
    if (useMockApi) {
        const { installMockApi } = await import('./mocks/installMockApi');
        installMockApi();
    }

    ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <BrowserRouter>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </BrowserRouter>
        </React.StrictMode>
    );

    registerServiceWorker();
}

void bootstrap();
