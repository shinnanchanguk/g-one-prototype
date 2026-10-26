import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 기본은 GitHub Pages 주소(/g-one-prototype/). Vercel 같은 루트 배포는 BASE=/ 로 빌드한다.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? (process.env.BASE ?? '/g-one-prototype/') : '/',
}));
