/**
 * AdminLoginPage.jsx — 운영자 전용 로그인 포털
 *
 * 접근 경로: /admin/login
 * 테마:      완전 분리된 다크 포털 (사용자 앱과 별도 레이아웃)
 * 인증 후:   /admin/dashboard 로 리다이렉트
 *
 * 보안 UX:
 *   - 비밀번호 show/hide 토글
 *   - 로그인 실패 시 에러 메시지 + 잔여 시도 횟수 표시
 *   - 계정 잠금 시 잠금 해제 시각 표시
 *   - 5초 후 에러 자동 소멸
 *   - 로딩 중 버튼 비활성화
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAdminAuthStore from '../store/useAdminAuthStore';

// ── 어드민 테마 (사용자 앱과 의도적으로 다른 배색) ────────────────
const A = {
  bg:       '#09090b',
  surface:  '#18181b',
  surface2: '#27272a',
  border:   '#3f3f46',
  text:     '#fafafa',
  sub:      '#a1a1aa',
  accent:   '#dc2626',  // 레드 — 운영자 전용 색
  accentHov:'#b91c1c',
  accentBg: '#450a0a',
  success:  '#22c55e',
  warn:     '#f59e0b',
};

export default function AdminLoginPage() {
  const navigate  = useNavigate();
  const { adminLogin, isAdminAuth, authError, isLoading, clearError, verifyAdminToken } =
    useAdminAuthStore();

  const [email,   setEmail]   = useState('');
  const [pw,      setPw]      = useState('');
  const [showPw,  setShowPw]  = useState(false);
  const [touched, setTouched] = useState({ email: false, pw: false });

  const emailRef = useRef(null);
  const errTimer = useRef(null);

  // 이미 인증된 상태면 대시보드로
  useEffect(() => {
    verifyAdminToken().then((valid) => {
      if (valid) navigate('/admin/dashboard', { replace: true });
    });
    emailRef.current?.focus();
  }, []);

  // 인증 성공 시 리다이렉트
  useEffect(() => {
    if (isAdminAuth) navigate('/admin/dashboard', { replace: true });
  }, [isAdminAuth]);

  // 에러 자동 소멸 (5초)
  useEffect(() => {
    if (authError) {
      clearTimeout(errTimer.current);
      errTimer.current = setTimeout(() => clearError(), 5000);
    }
    return () => clearTimeout(errTimer.current);
  }, [authError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, pw: true });
    if (!email.trim() || !pw) return;
    await adminLogin(email.trim(), pw);
  };

  const emailErr = touched.email && !email.trim() ? '이메일을 입력하세요.' : null;
  const pwErr    = touched.pw    && !pw           ? '비밀번호를 입력하세요.' : null;

  return (
    <div style={S.page}>

      {/* 배경 그리드 패턴 (순수 CSS) */}
      <div style={S.bgGrid} aria-hidden />

      {/* ── 로그인 카드 ── */}
      <div style={S.card}>

        {/* 헤더 */}
        <div style={S.cardHeader}>
          <div style={S.logoRow}>
            <span style={S.logoIcon}>🔐</span>
            <span style={S.logoText}>Vibe Admin</span>
          </div>
          <p style={S.subtitle}>운영자 전용 포털</p>
          <p style={S.subtitleSub}>권한이 있는 계정으로만 접근 가능합니다.</p>
        </div>

        {/* 에러 배너 */}
        {authError && (
          <div style={S.errBanner} role="alert">
            <span style={S.errIcon}>⚠</span>
            <span>{authError}</span>
          </div>
        )}

        {/* 폼 */}
        <form onSubmit={handleSubmit} style={S.form} noValidate>

          {/* 이메일 */}
          <div style={S.fieldWrap}>
            <label style={S.label} htmlFor="admin-email">이메일</label>
            <input
              id="admin-email"
              ref={emailRef}
              type="email"
              style={{ ...S.input, ...(emailErr ? S.inputErr : {}) }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              placeholder="admin@vibe.com"
              autoComplete="username"
              disabled={isLoading}
            />
            {emailErr && <span style={S.fieldErr}>{emailErr}</span>}
          </div>

          {/* 비밀번호 */}
          <div style={S.fieldWrap}>
            <label style={S.label} htmlFor="admin-pw">비밀번호</label>
            <div style={S.pwWrap}>
              <input
                id="admin-pw"
                type={showPw ? 'text' : 'password'}
                style={{ ...S.input, ...S.pwInput, ...(pwErr ? S.inputErr : {}) }}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, pw: true }))}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isLoading}
              />
              <button
                type="button"
                style={S.eyeBtn}
                onClick={() => setShowPw((v) => !v)}
                tabIndex={-1}
                aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
            {pwErr && <span style={S.fieldErr}>{pwErr}</span>}
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            style={{ ...S.submitBtn, ...(isLoading ? S.submitDisabled : {}) }}
            disabled={isLoading}
          >
            {isLoading ? (
              <span style={S.spinnerRow}>
                <Spinner /> 인증 중...
              </span>
            ) : '운영자 로그인'}
          </button>

        </form>

        {/* 하단 안내 */}
        <div style={S.footer}>
          <span style={S.footerDot(A.accent)} />
          <span style={S.footerText}>운영자 계정이 없다면 시스템 관리자에게 문의하세요.</span>
        </div>
      </div>

      {/* 좌하단 버전 표시 */}
      <span style={S.version}>Vibe Admin Portal v1.0</span>
    </div>
  );
}

// ── 스피너 ────────────────────────────────────────────────────────────
function Spinner() {
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setAngle((a) => (a + 30) % 360), 80);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{
      display: 'inline-block',
      width: 14, height: 14,
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      transform: `rotate(${angle}deg)`,
    }} />
  );
}

// ── 스타일 ────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: A.bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden',
    fontFamily: "'Inter', 'Noto Sans KR', sans-serif",
  },
  bgGrid: {
    position: 'absolute', inset: 0, zIndex: 0,
    backgroundImage:
      'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),' +
      'linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative', zIndex: 1,
    width: 400, maxWidth: '92vw',
    background: A.surface,
    border: `1px solid ${A.border}`,
    borderRadius: 16,
    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
    overflow: 'hidden',
  },
  cardHeader: {
    background: A.accentBg,
    borderBottom: `1px solid ${A.border}`,
    padding: '28px 28px 20px',
  },
  logoRow: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
  },
  logoIcon: { fontSize: 28 },
  logoText: {
    fontSize: 22, fontWeight: 900, color: A.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    margin: 0, fontSize: 13, fontWeight: 700,
    color: A.accent, letterSpacing: 0.5, textTransform: 'uppercase',
  },
  subtitleSub: {
    margin: '4px 0 0', fontSize: 12, color: A.sub,
  },

  errBanner: {
    display: 'flex', alignItems: 'flex-start', gap: 8,
    margin: '16px 24px 0',
    padding: '10px 14px',
    background: '#450a0a',
    border: `1px solid ${A.accent}`,
    borderRadius: 8,
    fontSize: 13, color: '#fca5a5',
  },
  errIcon: { flexShrink: 0, marginTop: 1 },

  form: {
    padding: '24px 28px',
    display: 'flex', flexDirection: 'column', gap: 18,
  },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: A.sub, letterSpacing: 0.3 },
  input: {
    width: '100%', boxSizing: 'border-box',
    background: A.surface2,
    border: `1px solid ${A.border}`,
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 14, color: A.text,
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  inputErr: { borderColor: A.accent },
  fieldErr: { fontSize: 11, color: '#fca5a5' },

  pwWrap: { position: 'relative' },
  pwInput: { paddingRight: 40 },
  eyeBtn: {
    position: 'absolute', right: 10, top: '50%',
    transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 16, lineHeight: 1, padding: 2,
    color: A.sub,
  },

  submitBtn: {
    width: '100%',
    padding: '12px 0',
    background: A.accent,
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14, fontWeight: 700,
    cursor: 'pointer',
    transition: 'background 0.15s',
    marginTop: 4,
  },
  submitDisabled: {
    background: '#7f1d1d',
    cursor: 'not-allowed',
    opacity: 0.7,
  },
  spinnerRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },

  footer: {
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '14px 28px',
    borderTop: `1px solid ${A.border}`,
    background: A.surface2,
  },
  footerDot: (color) => ({
    width: 6, height: 6, borderRadius: '50%',
    background: color, flexShrink: 0,
  }),
  footerText: { fontSize: 11, color: A.sub, lineHeight: 1.4 },

  version: {
    position: 'fixed', bottom: 12, left: 16,
    fontSize: 10, color: '#3f3f46',
    letterSpacing: 0.5,
  },
};
