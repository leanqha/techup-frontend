import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Замените <repo-name> на имя репозитория
export default defineConfig({
    base: '/techup-frontend/',
    plugins: [
        react({
            babel: {
                plugins: [['babel-plugin-react-compiler']],
            },
        }),
    ],
})