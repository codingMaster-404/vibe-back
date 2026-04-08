/**
 * FocusGauge.jsx — 몰입도 시각화 컴포넌트
 *
 * 얼굴 영상 대신 아이콘 + 게이지로만 집중 상태를 표시.
 * score: 0~100
 */

const LEVELS = [
  { min: 80, icon: '🔥', label: '완전 집중!', color: '#6366f1', bg: '#eef2ff' },
  { min: 60, icon: '⚡', label: '집중 중',    color: '#22c55e', bg: '#f0fdf4' },
  { min: 40, icon: '😐', label: '보통',       color: '#f59e0b', bg: '#fffbeb' },
  { min: 20, icon: '😴', label: '졸음 감지',  color: '#ef4444', bg: '#fef2f2' },
  { min: 0,  icon: '👀', label: '자리 이탈',  color: '#9ca3af', bg: '#f9fafb' },
];

const getLevel = (score) => {
  if (score == null) return { icon: '📷', label: '대기 중', color: '#9ca3af', bg: '#f9fafb' };
  return LEVELS.find((l) => score >= l.min) ?? LEVELS[LEVELS.length - 1];
};

export default function FocusGauge({ score, minuteScores = [], compact = false }) {
  const level = getLevel(score);
  const pct   = score ?? 0;

  if (compact) {
    // ── 미니 배지 모드 (학습 페이지 구석 표시용) ──
    return (
      <div style={{ ...styles.badge, background: level.bg, borderColor: level.color }}>
        <span style={styles.badgeIcon}>{level.icon}</span>
        <span style={{ ...styles.badgeScore, color: level.color }}>
          {score != null ? `${score}점` : '준비 중'}
        </span>
      </div>
    );
  }

  // ── 풀 모드 (사이드바 또는 오버레이) ──────────────
  return (
    <div style={{ ...styles.card, background: level.bg }}>

      {/* 아이콘 + 상태 텍스트 */}
      <div style={styles.iconRow}>
        <span style={styles.icon}>{level.icon}</span>
        <div>
          <p style={{ ...styles.labelText, color: level.color }}>{level.label}</p>
          <p style={styles.sublabel}>현재 집중도</p>
        </div>
      </div>

      {/* 원형 게이지 */}
      <div style={styles.gaugeWrap}>
        <svg width="110" height="110" viewBox="0 0 110 110">
          {/* 배경 트랙 */}
          <circle
            cx="55" cy="55" r="46"
            fill="none" stroke="#e5e7eb" strokeWidth="10"
          />
          {/* 진행 원호 */}
          <circle
            cx="55" cy="55" r="46"
            fill="none"
            stroke={level.color}
            strokeWidth="10"
            strokeDasharray={`${(pct / 100) * 289} 289`}
            strokeLinecap="round"
            transform="rotate(-90 55 55)"
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
          <text
            x="55" y="50"
            textAnchor="middle"
            style={{ fontSize: 26, fontWeight: 700, fill: level.color }}
          >
            {score != null ? pct : '-'}
          </text>
          <text
            x="55" y="70"
            textAnchor="middle"
            style={{ fontSize: 11, fill: '#9ca3af' }}
          >
            / 100점
          </text>
        </svg>
      </div>

      {/* 분당 미니 바 차트 */}
      {minuteScores.length > 0 && (
        <div>
          <p style={styles.miniTitle}>분당 집중도 추이</p>
          <div style={styles.barRow}>
            {minuteScores.slice(-10).map((s, i) => (
              <div key={i} style={styles.barWrap}>
                <div
                  style={{
                    ...styles.bar,
                    height: `${s}%`,
                    background: getLevel(s).color,
                  }}
                />
                <span style={styles.barLabel}>{i + 1}분</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 안내 문구 */}
      <p style={styles.privacyNote}>🔒 얼굴 데이터는 서버로 전송되지 않습니다.</p>
    </div>
  );
}

const styles = {
  // 풀 카드
  card: {
    borderRadius: 16,
    padding: '20px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    minWidth: 200,
    fontFamily: "'Pretendard', sans-serif",
  },
  iconRow:  { display: 'flex', alignItems: 'center', gap: 12 },
  icon:     { fontSize: 36 },
  labelText:{ margin: 0, fontWeight: 700, fontSize: 17 },
  sublabel: { margin: '2px 0 0', fontSize: 12, color: '#9ca3af' },

  // 게이지
  gaugeWrap: { display: 'flex', justifyContent: 'center' },

  // 분당 바
  miniTitle: { margin: '0 0 8px', fontSize: 12, color: '#6b7280', fontWeight: 600 },
  barRow:    { display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 },
  barWrap:   { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 },
  bar: {
    width: '100%',
    borderRadius: '3px 3px 0 0',
    minHeight: 2,
    transition: 'height 0.3s ease',
  },
  barLabel: { fontSize: 9, color: '#9ca3af', marginTop: 2 },

  // 프라이버시 안내
  privacyNote: { margin: 0, fontSize: 11, color: '#9ca3af', textAlign: 'center' },

  // 미니 배지 모드
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 999,
    border: '1.5px solid',
    fontSize: 13,
    fontWeight: 600,
  },
  badgeIcon:  { fontSize: 16 },
  badgeScore: { fontWeight: 700 },
};
