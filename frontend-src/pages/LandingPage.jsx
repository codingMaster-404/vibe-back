/**
 * LandingPage.jsx — Vibe AI 학습 관리 플랫폼 · 랜딩 페이지
 *
 * 섹션 구성:
 *   GNB      → 스크롤 시 blur 전환, 비로그인 전용 메뉴
 *   Hero     → 그라디언트 헤드라인 + 이중 CTA
 *   Stats    → IntersectionObserver 트리거 카운트업
 *   Mockup   → CSS 맥북 프레임 안에 추상화된 대시보드
 *   Features → AI 기능 카드 3종
 *   Graph    → SVG stroke-dashoffset 스크롤 애니메이션
 *   CTA      → 최종 전환 섹션
 *   Footer   → 비즈니스 용어로 위장한 System Admin 링크
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// ═══════════════════════════════════════════════════════════════
// 커스텀 훅 모음
// ═══════════════════════════════════════════════════════════════

/** 요소가 뷰포트에 진입할 때 한 번만 true 반환 */
function useInView(threshold = 0.3) {
  const ref    = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/** 카운트업 애니메이션 — start 가 true 로 바뀔 때 0 → target 으로 올라감 */
function useCountUp(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setCount(Math.round(easeOut(progress) * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

/** GNB 스크롤 blur 전환 감지 */
function useScrolled(threshold = 40) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [threshold]);
  return scrolled;
}

// ═══════════════════════════════════════════════════════════════
// 색상 토큰
// ═══════════════════════════════════════════════════════════════
const C = {
  // 다크 히어로 배경
  heroBg:    '#020617',
  // 라이트 섹션 배경
  lightBg:   '#f8fafc',
  midBg:     '#f1f5f9',
  // 다크 섹션
  darkBg:    '#0d1117',
  // 텍스트
  textDark:  '#0f172a',
  textMid:   '#475569',
  textLight: '#94a3b8',
  textWhite: '#f1f5f9',
  // 브랜드
  indigo:    '#6366f1',
  indigoDark:'#4338ca',
  purple:    '#8b5cf6',
  cyan:      '#06b6d4',
  // 상태
  success:   '#10b981',
  warn:      '#f59e0b',
  danger:    '#ef4444',
  // 카드
  cardBg:    '#ffffff',
  border:    '#e2e8f0',
};

// ═══════════════════════════════════════════════════════════════
// 메인 컴포넌트
// ═══════════════════════════════════════════════════════════════
export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Inter', 'Pretendard', 'Noto Sans KR', sans-serif",
                  background: C.lightBg, overflowX: 'hidden' }}>
      <GNB />
      <HeroSection />
      <StatsSection />
      <MockupSection />
      <FeaturesSection />
      <GraphSection />
      <CtaSection />
      <Footer />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ① GNB
// ═══════════════════════════════════════════════════════════════
function GNB() {
  const scrolled   = useScrolled(40);
  const navigate   = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: '기능 소개', href: '#features' },
    { label: '도입 효과', href: '#stats'    },
    { label: '기술 분석', href: '#graph'    },
  ];

  const scrollTo = (id) => {
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 60,
      background:   scrolled ? 'rgba(2,6,23,0.88)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none',
      transition: 'all 0.25s ease',
      display: 'flex', alignItems: 'center', padding: '0 40px',
    }}>
      {/* 로고 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        <span style={{ fontSize: 22, fontWeight: 900, color: '#a5b4fc',
                       letterSpacing: -0.8, cursor: 'pointer' }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          Vibe
        </span>
        <span style={{ fontSize: 10, color: C.indigo, background: 'rgba(99,102,241,0.15)',
                       padding: '2px 7px', borderRadius: 99, fontWeight: 700,
                       border: '1px solid rgba(99,102,241,0.3)' }}>
          AI
        </span>
      </div>

      {/* 데스크탑 내비 */}
      <nav style={{ display: 'flex', gap: 32, marginRight: 32 }}>
        {navLinks.map(({ label, href }) => (
          <button key={label}
            onClick={() => scrollTo(href)}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
                     fontSize: 14, fontWeight: 500,
                     color: scrolled ? '#cbd5e1' : 'rgba(255,255,255,0.75)',
                     transition: 'color 0.15s' }}>
            {label}
          </button>
        ))}
      </nav>

      {/* CTA 버튼 */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={() => navigate('/login')}
          style={{ padding: '7px 16px', background: 'none',
                   border: '1px solid rgba(165,180,252,0.4)',
                   borderRadius: 8, color: '#a5b4fc',
                   fontSize: 13, fontWeight: 600, cursor: 'pointer',
                   transition: 'all 0.15s' }}>
          로그인
        </button>
        <button
          onClick={() => navigate('/login')}
          style={{ padding: '7px 20px',
                   background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                   border: 'none', borderRadius: 8,
                   color: '#fff', fontSize: 13, fontWeight: 700,
                   cursor: 'pointer', boxShadow: '0 0 20px rgba(99,102,241,0.4)',
                   transition: 'all 0.15s' }}>
          무료로 시작하기
        </button>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════
// ② Hero 섹션
// ═══════════════════════════════════════════════════════════════
function HeroSection() {
  const navigate = useNavigate();

  return (
    <section style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.3) 0%, transparent 70%),
                   radial-gradient(ellipse 50% 40% at 80% 60%, rgba(139,92,246,0.15) 0%, transparent 60%),
                   ${C.heroBg}`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '120px 24px 80px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* 배경 그리드 */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      {/* 플로팅 배지 */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '6px 16px',
        background: 'rgba(99,102,241,0.1)',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: 99, marginBottom: 28,
        fontSize: 12, fontWeight: 600, color: '#a5b4fc',
        letterSpacing: 0.5,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.success,
                       boxShadow: `0 0 8px ${C.success}` }} />
        AI 집중도 분석 · 실시간 학습 모니터링
      </div>

      {/* 헤드라인 */}
      <h1 style={{
        position: 'relative', zIndex: 1,
        fontSize: 'clamp(40px, 6vw, 72px)',
        fontWeight: 900, lineHeight: 1.1,
        textAlign: 'center', maxWidth: 860,
        letterSpacing: -2, marginBottom: 24,
      }}>
        <span style={{ color: '#f1f5f9' }}>AI가 수강생의</span>
        <br />
        <span style={{
          background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #38bdf8 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          집중도를 실시간으로
        </span>
        <br />
        <span style={{ color: '#f1f5f9' }}>분석합니다.</span>
      </h1>

      {/* 서브텍스트 */}
      <p style={{
        position: 'relative', zIndex: 1,
        fontSize: 18, color: '#94a3b8', maxWidth: 560,
        textAlign: 'center', lineHeight: 1.75, marginBottom: 44,
        fontWeight: 400,
      }}>
        강사는 강의에만 집중하세요. 졸음 감지부터 집중도 리포트까지
        — Vibe가 학습 데이터를 자동으로 분석합니다.
      </p>

      {/* CTA 버튼 그룹 */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '14px 36px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', borderRadius: 12,
            color: '#fff', fontSize: 16, fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 0 40px rgba(99,102,241,0.5)',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          지금 무료로 Vibe 시작하기 →
        </button>
        <button
          onClick={() => document.querySelector('#mockup')?.scrollIntoView({ behavior: 'smooth' })}
          style={{
            padding: '14px 28px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 12,
            color: '#cbd5e1', fontSize: 15, fontWeight: 600,
            cursor: 'pointer', backdropFilter: 'blur(8px)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
        >
          🎬 데모 살펴보기
        </button>
      </div>

      {/* 보증 문구 */}
      <p style={{
        position: 'relative', zIndex: 1,
        fontSize: 12, color: '#475569', marginTop: 16,
        letterSpacing: 0.3,
      }}>
        신용카드 없이 · 즉시 시작 · 언제든 취소 가능
      </p>

      {/* 스크롤 인디케이터 */}
      <div style={{
        position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        animation: 'bounce 2s infinite',
      }}>
        <span style={{ fontSize: 11, color: '#475569', letterSpacing: 1, textTransform: 'uppercase' }}>Scroll</span>
        <div style={{ width: 1, height: 36, background: 'linear-gradient(to bottom, #6366f1, transparent)' }} />
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }
        @keyframes drawLine {
          from { stroke-dashoffset: var(--line-length, 1000); }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// ③ Stats 섹션 — 카운트업
// ═══════════════════════════════════════════════════════════════
function StatsSection() {
  const [ref, inView] = useInView(0.4);

  const stats = [
    { target: 38,   suffix: '%',   label: '학습 몰입도 평균 향상',    sub: '2,400명 수강생 데이터 기준' },
    { target: 99,   suffix: '.7%', label: '졸음 감지 정확도',          sub: 'OpenCV · Face-API 복합 모델' },
    { target: 4200, suffix: '시간', label: '누적 분석 학습 시간',       sub: '지난 6개월 기준' },
    { target: 94,   suffix: '%',   label: '강사 만족도',               sub: '베타 참여 강사 96인 응답' },
  ];

  return (
    <section id="stats" ref={ref} style={{
      background: C.lightBg,
      padding: '80px 24px',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.indigo,
                      letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
            검증된 데이터
          </p>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: C.textDark,
                       letterSpacing: -1, marginBottom: 12 }}>
            숫자로 증명하는 Vibe의 효과
          </h2>
          <p style={{ fontSize: 15, color: C.textMid, maxWidth: 480, margin: '0 auto' }}>
            실제 수업에 적용된 데이터를 기반으로 합니다.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          {stats.map((s, i) => (
            <StatCard key={i} {...s} inView={inView} delay={i * 150} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({ target, suffix, label, sub, inView, delay }) {
  const count = useCountUp(target, 1800, inView);

  return (
    <div style={{
      background: C.cardBg,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: '32px 28px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.5s ${delay}ms, transform 0.5s ${delay}ms`,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* 배경 글로우 */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(99,102,241,0.06)',
      }} />
      <div style={{
        fontSize: 'clamp(36px, 4vw, 52px)',
        fontWeight: 900,
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        lineHeight: 1, marginBottom: 8,
        letterSpacing: -1,
      }}>
        {count}{suffix}
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color: C.textDark, marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ fontSize: 11, color: C.textLight, lineHeight: 1.5 }}>
        {sub}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ④ 프리미엄 맥북 목업 섹션
// ═══════════════════════════════════════════════════════════════
function MockupSection() {
  const [ref, inView] = useInView(0.2);

  return (
    <section id="mockup" ref={ref} style={{
      background: `radial-gradient(ellipse 70% 50% at 50% 50%, rgba(99,102,241,0.12) 0%, transparent 70%), #0d1117`,
      padding: '100px 24px',
      overflow: 'hidden',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#818cf8',
                      letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
            제품 미리보기
          </p>
          <h2 style={{
            fontSize: 36, fontWeight: 900, color: '#f1f5f9',
            letterSpacing: -1, marginBottom: 12,
          }}>
            클래스 전체를 한 화면에서
          </h2>
          <p style={{ fontSize: 15, color: '#64748b', maxWidth: 440, margin: '0 auto' }}>
            강사 대시보드에서 수강생 집중도, 제출 현황, 출석률을 실시간으로 확인하세요.
          </p>
        </div>

        {/* 맥북 프레임 */}
        <div style={{
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.97)',
          transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1)',
          maxWidth: 900, margin: '0 auto',
        }}>
          <MacbookFrame />
        </div>
      </div>
    </section>
  );
}

function MacbookFrame() {
  return (
    <div style={{ position: 'relative' }}>
      {/* 스크린 상단 프레임 (lid) */}
      <div style={{
        background: 'linear-gradient(180deg, #2a2a2a 0%, #1c1c1e 100%)',
        borderRadius: '16px 16px 0 0',
        padding: '14px 20px 0',
        boxShadow: '0 -4px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
        position: 'relative',
      }}>
        {/* 카메라 */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{
            display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
            background: '#1a1a1a',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
          }} />
        </div>

        {/* 스크린 베젤 */}
        <div style={{
          background: '#050505',
          borderRadius: '8px 8px 0 0',
          overflow: 'hidden',
          aspectRatio: '16/10',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
        }}>
          <DashboardMockup />
        </div>
      </div>

      {/* 힌지 */}
      <div style={{
        height: 6,
        background: 'linear-gradient(180deg, #1c1c1e, #2a2a2a)',
        position: 'relative', zIndex: 2,
      }} />

      {/* 베이스 (키보드 면) */}
      <div style={{
        background: 'linear-gradient(180deg, #2a2a2a 0%, #222222 100%)',
        borderRadius: '0 0 12px 12px',
        height: 22,
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        position: 'relative',
      }}>
        {/* 트랙패드 힌트 */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 80, height: 10,
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.06)',
        }} />
      </div>

      {/* 하단 그림자 */}
      <div style={{
        height: 20, margin: '0 40px',
        background: 'rgba(0,0,0,0.5)',
        filter: 'blur(16px)',
        borderRadius: '0 0 50% 50%',
      }} />
    </div>
  );
}

/** 대시보드 내부 콘텐츠 (CSS 추상화) */
function DashboardMockup() {
  const students = [
    { name: '김민준', focus: 92, status: 'high' },
    { name: '이서연', focus: 78, status: 'mid'  },
    { name: '박지호', focus: 45, status: 'low'  },
    { name: '최유나', focus: 88, status: 'high' },
    { name: '정현우', focus: 61, status: 'mid'  },
  ];

  const barColor = (s) => s === 'high' ? '#10b981' : s === 'mid' ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ display: 'flex', height: '100%', background: '#0f172a', fontSize: 9 }}>

      {/* 사이드바 */}
      <div style={{
        width: '14%', background: '#080f1e',
        borderRight: '1px solid #1e293b',
        padding: '12px 8px',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <div style={{ color: '#818cf8', fontWeight: 900, fontSize: 10, marginBottom: 8 }}>🎓 Vibe</div>
        {['대시보드','강의 관리','수강생','분석','설정'].map((t, i) => (
          <div key={t} style={{
            padding: '5px 8px', borderRadius: 5, fontSize: 8,
            background: i === 0 ? '#312e81' : 'transparent',
            color: i === 0 ? '#a5b4fc' : '#475569',
          }}>{t}</div>
        ))}
      </div>

      {/* 메인 영역 */}
      <div style={{ flex: 1, padding: '12px 14px', overflow: 'hidden' }}>
        {/* 상단 바 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 10, marginBottom: 2 }}>
              실시간 강의 현황
            </div>
            <div style={{ color: '#475569', fontSize: 7 }}>Spring Boot 심화 · 진행 중 🔴</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['#334155','#334155'].map((bg, i) => (
              <div key={i} style={{ width: 20, height: 10, borderRadius: 3, background: bg }} />
            ))}
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#312e81' }} />
          </div>
        </div>

        {/* KPI 카드 3개 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
          {[
            { label: '평균 집중도', value: '81%',   color: '#10b981' },
            { label: '수강 인원',   value: '24명',  color: '#6366f1' },
            { label: '미제출 과제', value: '3건',   color: '#f59e0b' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: '#1e293b', borderRadius: 6,
              padding: '6px 8px', border: '1px solid #334155',
            }}>
              <div style={{ color: '#64748b', fontSize: 7, marginBottom: 3 }}>{label}</div>
              <div style={{ color, fontWeight: 900, fontSize: 13 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* 수강생 집중도 테이블 */}
        <div style={{
          background: '#1e293b', borderRadius: 6, border: '1px solid #334155',
          padding: '8px 10px',
        }}>
          <div style={{ color: '#94a3b8', fontSize: 8, fontWeight: 700, marginBottom: 6 }}>
            수강생 실시간 집중도
          </div>
          {students.map(({ name, focus, status }) => (
            <div key={name} style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%',
                background: '#312e81', color: '#a5b4fc',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 6, fontWeight: 700, flexShrink: 0,
              }}>
                {name[0]}
              </div>
              <div style={{ width: 30, color: '#94a3b8', fontSize: 7, flexShrink: 0 }}>{name}</div>
              <div style={{
                flex: 1, height: 4, background: '#334155', borderRadius: 99, overflow: 'hidden',
              }}>
                <div style={{
                  width: `${focus}%`, height: '100%',
                  background: barColor(status),
                  borderRadius: 99,
                }} />
              </div>
              <div style={{ color: barColor(status), fontSize: 7, fontWeight: 700, width: 22, textAlign: 'right' }}>
                {focus}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ⑤ 기능 카드 섹션
// ═══════════════════════════════════════════════════════════════
function FeaturesSection() {
  const features = [
    {
      icon: '👁',
      title: 'AI 졸음·이탈 감지',
      desc: '웹캠 기반 Face API가 눈 깜빡임, 시선 방향, 고개 숙임을 실시간 분석해 수강생의 이탈 징후를 99.7% 정확도로 감지합니다.',
      tag: 'Computer Vision',
      color: '#6366f1',
    },
    {
      icon: '📊',
      title: '집중도 타임라인',
      desc: '강의 전체 구간의 집중도 흐름을 시간축 그래프로 시각화합니다. 어느 순간에 수강생 집중이 떨어졌는지 초 단위로 파악할 수 있습니다.',
      tag: 'Data Visualization',
      color: '#8b5cf6',
    },
    {
      icon: '🔔',
      title: '스마트 알림 & 리포트',
      desc: '집중도 임계값 이하 시 강사에게 실시간 알림을 전송하고, 강의 종료 후 자동으로 분석 리포트를 생성해 이메일 또는 대시보드로 제공합니다.',
      tag: 'Automation',
      color: '#06b6d4',
    },
  ];

  return (
    <section id="features" style={{ background: C.midBg, padding: '100px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.indigo,
                      letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
            핵심 기술
          </p>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: C.textDark,
                       letterSpacing: -1, marginBottom: 12 }}>
            강의실을 데이터로 만드는 세 가지 기술
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {features.map((f, i) => <FeatureCard key={i} {...f} delay={i * 100} />)}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, desc, tag, color, delay }) {
  const [ref, inView] = useInView(0.3);
  const [hovered, setHovered] = useState(false);

  return (
    <div ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.cardBg,
        border: `1px solid ${hovered ? color + '60' : C.border}`,
        borderRadius: 20,
        padding: '32px 28px',
        cursor: 'default',
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.55s ${delay}ms, transform 0.55s ${delay}ms, border-color 0.2s, box-shadow 0.2s`,
        boxShadow: hovered ? `0 16px 48px ${color}18` : '0 1px 3px rgba(0,0,0,0.06)',
        position: 'relative', overflow: 'hidden',
      }}>
      {/* 배경 글로우 */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 120, height: 120,
        background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`,
        transition: 'opacity 0.2s',
        opacity: hovered ? 1 : 0,
      }} />

      {/* 아이콘 */}
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: `linear-gradient(135deg, ${color}20, ${color}10)`,
        border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, marginBottom: 20,
      }}>
        {icon}
      </div>

      {/* 태그 */}
      <span style={{
        fontSize: 10, fontWeight: 700, color, letterSpacing: 0.5,
        background: `${color}15`, padding: '3px 10px',
        borderRadius: 99, display: 'inline-block', marginBottom: 12,
      }}>
        {tag}
      </span>

      <h3 style={{ fontSize: 18, fontWeight: 800, color: C.textDark,
                   marginBottom: 10, letterSpacing: -0.3 }}>
        {title}
      </h3>
      <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.75 }}>
        {desc}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ⑥ 인터랙티브 SVG 그래프 섹션
// ═══════════════════════════════════════════════════════════════
function GraphSection() {
  const [ref, inView] = useInView(0.3);
  const pathRef    = useRef(null);
  const fillRef    = useRef(null);
  const [animated, setAnimated] = useState(false);

  // 그래프 데이터 포인트
  const W = 800, H = 220;
  const points = [
    [0, 160], [80, 140], [160, 110], [240, 125],
    [320, 80], [400, 60], [480, 75], [560, 45],
    [640, 30], [720, 20], [800, 10],
  ];

  const toPath = (pts) =>
    pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');

  const linePath = toPath(points);
  const fillPath = linePath + ` L ${W} ${H} L 0 ${H} Z`;

  useEffect(() => {
    if (inView && !animated) {
      setAnimated(true);
      // 선 길이 계산 후 animation 적용
      setTimeout(() => {
        if (pathRef.current) {
          const len = pathRef.current.getTotalLength?.() ?? 1200;
          pathRef.current.style.strokeDasharray  = len;
          pathRef.current.style.strokeDashoffset = len;
          pathRef.current.style.transition = 'stroke-dashoffset 2s cubic-bezier(0.4,0,0.2,1)';
          requestAnimationFrame(() => {
            pathRef.current.style.strokeDashoffset = '0';
          });
        }
        if (fillRef.current) {
          fillRef.current.style.transition = 'opacity 2.2s ease';
          fillRef.current.style.opacity = '0.12';
        }
      }, 100);
    }
  }, [inView]);

  const countVal = useCountUp(38, 1800, inView);

  return (
    <section id="graph" ref={ref} style={{
      background: C.darkBg, padding: '100px 24px', overflow: 'hidden',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 64, alignItems: 'center' }}>

          {/* 좌측 텍스트 */}
          <div style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateX(0)' : 'translateX(-24px)',
            transition: 'all 0.7s ease',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.indigo,
                        letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
              집중도 분석
            </p>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: '#f1f5f9',
                         lineHeight: 1.2, letterSpacing: -1, marginBottom: 16 }}>
              강의 시간이 지날수록<br />
              <span style={{
                background: 'linear-gradient(135deg, #818cf8, #c084fc)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                집중도가 회복됩니다
              </span>
            </h2>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.75, marginBottom: 28 }}>
              Vibe의 실시간 알림을 받은 강사가 강의 방식을 조정했을 때,
              수강생 집중도는 평균 38% 이상 회복됩니다.
            </p>
            <div style={{
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 12, padding: '16px 20px',
              display: 'inline-block',
            }}>
              <div style={{
                fontSize: 48, fontWeight: 900,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                lineHeight: 1,
              }}>
                +{countVal}%
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                집중도 회복률 (알림 후 15분)
              </div>
            </div>
          </div>

          {/* 우측 SVG 그래프 */}
          <div style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateX(0)' : 'translateX(24px)',
            transition: 'all 0.7s 0.2s ease',
          }}>
            <div style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: 16, padding: '24px',
              position: 'relative',
            }}>
              {/* 그래프 레이블 */}
              <div style={{ display: 'flex', justifyContent: 'space-between',
                            marginBottom: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                  수강생 평균 집중도
                </span>
                <span style={{
                  fontSize: 10, color: '#10b981', background: 'rgba(16,185,129,0.1)',
                  padding: '3px 10px', borderRadius: 99, fontWeight: 700,
                }}>
                  ● 실시간
                </span>
              </div>

              {/* Y축 가이드 라인 */}
              <div style={{ position: 'relative' }}>
                {[100, 75, 50, 25].map((v) => (
                  <div key={v} style={{
                    position: 'absolute', left: 0, right: 0,
                    top: `${(100 - v) / 100 * H}px`,
                    borderTop: '1px dashed #1e293b',
                    display: 'flex', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 9, color: '#334155', width: 24, flexShrink: 0 }}>
                      {v}
                    </span>
                  </div>
                ))}

                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                    <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="1" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* 채움 영역 */}
                  <path ref={fillRef} d={fillPath}
                    fill="url(#fillGrad)" opacity="0"
                    style={{ transition: 'opacity 0s' }}
                  />

                  {/* 메인 라인 */}
                  <path ref={pathRef} d={linePath}
                    fill="none" stroke="url(#lineGrad)"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ strokeDasharray: 9999, strokeDashoffset: 9999 }}
                  />

                  {/* 데이터 포인트 원 */}
                  {points.filter((_, i) => i % 2 === 0).map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="4"
                      fill="#0f172a" stroke="#6366f1" strokeWidth="2"
                      style={{
                        opacity: animated ? 1 : 0,
                        transition: `opacity 0.3s ${0.8 + i * 0.1}s`,
                      }}
                    />
                  ))}
                </svg>
              </div>

              {/* X축 레이블 */}
              <div style={{ display: 'flex', justifyContent: 'space-between',
                            marginTop: 8, paddingLeft: 24 }}>
                {['강의 시작', '15분', '30분', '45분', '60분', '75분', '종료'].map((t) => (
                  <span key={t} style={{ fontSize: 9, color: '#334155' }}>{t}</span>
                ))}
              </div>

              {/* 이벤트 마커 */}
              <div style={{
                position: 'absolute',
                left: `calc(24px + ${320 / W * 100}%)`,
                top: 60,
                background: '#fef08a',
                color: '#713f12',
                fontSize: 9, fontWeight: 700,
                padding: '3px 8px', borderRadius: 6,
                whiteSpace: 'nowrap',
                transform: 'translateX(-50%)',
              }}>
                🔔 Vibe 알림 발송
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// ⑦ 최종 CTA 섹션
// ═══════════════════════════════════════════════════════════════
function CtaSection() {
  const [ref, inView] = useInView(0.4);
  const navigate = useNavigate();

  return (
    <section ref={ref} style={{
      background: `linear-gradient(135deg, #4338ca 0%, #7c3aed 50%, #2563eb 100%)`,
      padding: '100px 24px', textAlign: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* 배경 패턴 */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%)',
      }} />

      <div style={{
        position: 'relative', maxWidth: 600, margin: '0 auto',
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: 'all 0.6s ease',
      }}>
        <h2 style={{
          fontSize: 40, fontWeight: 900, color: '#fff',
          letterSpacing: -1.5, marginBottom: 16, lineHeight: 1.15,
        }}>
          지금 바로 Vibe를<br />경험해보세요
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 40, lineHeight: 1.7 }}>
          AI 기반 집중도 분석으로 강의의 질을 한 단계 끌어올리세요.
          무료로 시작하고, 준비됐을 때 업그레이드하면 됩니다.
        </p>
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '16px 48px',
            background: '#fff', border: 'none',
            borderRadius: 14, color: '#4338ca',
            fontSize: 16, fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          무료로 시작하기
        </button>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 14 }}>
          별도 설치 없음 · 웹 브라우저만으로 시작
        </p>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// ⑧ Footer — System Admin 링크 포함
// ═══════════════════════════════════════════════════════════════
function Footer() {
  return (
    <footer style={{
      background: '#020617',
      borderTop: '1px solid #0f172a',
      padding: '48px 40px 32px',
      color: '#334155',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* 상단 푸터 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>

          {/* 브랜드 */}
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#818cf8',
                          letterSpacing: -0.5, marginBottom: 12 }}>
              Vibe
            </div>
            <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.7, maxWidth: 240 }}>
              AI 기반 학습 몰입도 분석 플랫폼.
              강의실을 데이터로 연결합니다.
            </p>
          </div>

          {/* 제품 */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#475569',
                        letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>
              제품
            </p>
            {['기능 소개', '집중도 분석', 'AI 리포트', '요금제'].map((t) => (
              <div key={t} style={{ fontSize: 13, color: '#334155',
                                    marginBottom: 8, cursor: 'pointer' }}>
                {t}
              </div>
            ))}
          </div>

          {/* 지원 */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#475569',
                        letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>
              지원
            </p>
            {['문서', 'FAQ', '릴리즈 노트', '문의하기'].map((t) => (
              <div key={t} style={{ fontSize: 13, color: '#334155',
                                    marginBottom: 8, cursor: 'pointer' }}>
                {t}
              </div>
            ))}
          </div>

          {/* 법적 */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#475569',
                        letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>
              정책
            </p>
            {['개인정보 처리방침', '이용약관', '쿠키 정책'].map((t) => (
              <div key={t} style={{ fontSize: 13, color: '#334155',
                                    marginBottom: 8, cursor: 'pointer' }}>
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* 하단 바 */}
        <div style={{
          borderTop: '1px solid #0f172a',
          paddingTop: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12,
        }}>
          <span style={{ fontSize: 12, color: '#1e293b' }}>
            © 2025 Vibe Inc. All rights reserved.
          </span>

          {/* 우측: 비즈니스 유틸리티 링크 */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#1e293b', cursor: 'pointer' }}>
              Status
            </span>
            <span style={{ fontSize: 11, color: '#1e293b', cursor: 'pointer' }}>
              API Reference
            </span>
            {/*
              ┌─────────────────────────────────────────────────────────┐
              │  비즈니스 용어로 위장한 System Admin 링크               │
              │  - 색상: 배경과 거의 동일한 초저채도                    │
              │  - 크기: 10px (시각적으로 묻힘)                         │
              │  - hover 시만 약간 밝아짐                               │
              └─────────────────────────────────────────────────────────┘
            */}
            <Link
              to="/admin/login"
              style={{
                fontSize: 10,
                color: '#111827',
                textDecoration: 'none',
                letterSpacing: 0.3,
                opacity: 0.4,
                transition: 'opacity 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity  = '0.9';
                e.currentTarget.style.color    = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity  = '0.4';
                e.currentTarget.style.color    = '#111827';
              }}
            >
              Enterprise Access
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
