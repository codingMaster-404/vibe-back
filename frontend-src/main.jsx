import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

/* 전역 기본 스타일 초기화 */
const style = document.createElement('style');
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #f8faff;
    color: #111827;
    -webkit-font-smoothing: antialiased;
  }
  a { color: inherit; }
  button { font-family: inherit; }
`;
document.head.appendChild(style);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
