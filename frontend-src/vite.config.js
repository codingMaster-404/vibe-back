import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  root: '.',           // index.html 위치
  publicDir: 'public', // face-api.js 모델 파일 등 정적 자산

  server: {
    port: 5173,
    // 백엔드 Spring Boot 프록시 설정
    // — /api/* 요청을 localhost:8081로 투명하게 전달
    // — credentials 포함 CORS 문제를 개발 단계에서 우회
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    outDir: '../src/main/resources/static', // Spring Boot 정적 자산 폴더로 빌드
    emptyOutDir: true,
  },
});
