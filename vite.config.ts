import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    // Where to forward /api requests when the mock is off (real backend).
    const apiTarget = env.VITE_API_URL || 'http://localhost:3000'

    return {
        base: '/',
        plugins: [
            react({
                babel: {
                    plugins: [['babel-plugin-react-compiler']],
                },
            }),
        ],
        server: {
            // Proxy API calls to the local Go backend. Only used when the mock
            // is disabled (VITE_MOCK_API=false). `changeOrigin` rewrites Host,
            // and we drop the browser Origin so the request reaches the backend
            // as same-origin — otherwise its CORS allowlist (production origin
            // only) rejects local POSTs with 403.
            proxy: {
                '/api': {
                    target: apiTarget,
                    changeOrigin: true,
                    configure: (proxy) => {
                        proxy.on('proxyReq', (proxyReq) => {
                            proxyReq.removeHeader('origin')
                        })
                    },
                },
            },
        },
    }
})
