import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/techup-frontend/',  // <- добавь эту строку
  plugins: [react()]
})