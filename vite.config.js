import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages 주소(/g-one-prototype/) 아래에서 서빙된다.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/g-one-prototype/' : '/',
}));
