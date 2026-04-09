/**
 * FocusReviewReport.jsx — 세션 종료 후 "집중력 저하 구간" 리포트 (다크 테마)
 *
 * Props:
 *   reviewTimestamps : number[]  — 저집중 시점(초) 배열 ex: [142, 380, 712]
 *   minuteScores     : number[]  — 분당 몰입도 배열
 *   averageFocusScore: number    — 전체 평균 몰입도
 *   videoElement     : HTMLVideoElement | null — VOD 요소 (seek 기능용)
 *   onClose          : () => void
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
         ReferenceLine, ResponsiveContainer } from 'recharts';

const D = {
  bg: '#0f172a', surface: '#1e293b', border: '#334155',
  text: '#f1f5f9', muted: '#94a3b8', accent: '#6366f1',
  danger: '#ef4444', warning: '#f59e0b', success: '#22c55e',
};

// 초 → "분:초" 포맷
const fmtSec = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

// 몰입도 점수 → 색상
const scoreColor = (s) =>
  s >= 80 ? D.success : s >= 60 ? '#a3e635' : s >= 40 ? D.warning : D.danger;

export default function FocusReviewReport({
  reviewTimestamps = [],
  minuteScores = [],
  averageFocusScore = 0,
  videoElement = null,
  onClose,
}) {
  const chartData = minuteScores.map((score, i) => ({ min: `${i + 1}분`, score }));

  const handleSeek = (sec) => {
    if (videoElement) {
      videoElement.currentTime = sec;
      videoElement.play();
    }
    onClose?.();
  };

  const focusedCount = minuteScores.filter((s) => s >= 60).length;
  const lowCount     = minuteScores.filter((s) => s < 40).length;

  return (
    <div style={S.overlay}>
      <div style={S.panel}>

        {/* 헤더 */}
        <div style={S.header}>
          <span style={S.titleIcon}>📊</span>
          <div style={{ flex: 1 }}>
            <h2 style={S.title}>집중도 세션 리포트</h2>
            <p style={S.subtitle}>AI 캠이 분석한 이번 학습 세션 결과입니다</p>
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={S.body}>

          {/* 요약 카드 3종 */}
          <div style={S.statsRow}>
            <StatCard
              label="전체 평균 몰입도"
              value={`${averageFocusScore}점`}
              color={scoreColor(averageFocusScore)}
              icon="🎯"
            />
            <StatCard
              label="집중 구간"
              value={`${focusedCount}분`}
              color={D.success}
              icon="⚡"
            />
            <StatCard
              label="저집중 구간"
              value={`${lowCount}분`}
              color={D.danger}
              icon="😴"
            />
          </div>

          {/* 분당 몰입도 차트 */}
          {chartData.length > 0 && (
            <div style={S.chartBox}>
              <p style={S.sectionTitle}>📈 분당 몰입도 추이</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="min" tick={{ fill: D.muted, fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: D.muted, fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 8 }}
                    labelStyle={{ color: D.text }}
                    itemStyle={{ color: D.accent }}
                    formatter={(v) => [`${v}점`, '몰입도']}
                  />
                  <ReferenceLine y={30} stroke={D.danger}   strokeDasharray="4 2"
                    label={{ value: '집중 저하(30)', fill: D.danger, fontSize: 9, position: 'insideTopRight' }} />
                  <ReferenceLine y={60} stroke={D.success}  strokeDasharray="4 2"
                    label={{ value: '집중(60)', fill: D.success, fontSize: 9, position: 'insideTopRight' }} />
                  <Line type="monotone" dataKey="score" stroke={D.accent}
                    strokeWidth={2} dot={{ r: 3, fill: D.accent }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 복습 타임스탬프 목록 */}
          <div style={S.tsBox}>
            <p style={S.sectionTitle}>
              🔁 자동 복습 타임스탬프
              <span style={S.tsBadge}>{reviewTimestamps.length}개 구간</span>
            </p>

            {reviewTimestamps.length === 0 ? (
              <div style={S.emptyTs}>
                <span style={{ fontSize: 32 }}>🎉</span>
                <p style={{ margin: '8px 0 0', fontSize: 14, color: D.success }}>
                  집중력 저하 구간이 없습니다! 훌륭해요!
                </p>
              </div>
            ) : (
              <div style={S.tsList}>
                {reviewTimestamps.map((sec, i) => (
                  <div key={i} style={S.tsItem}>
                    <span style={S.tsIndex}>{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <p style={S.tsTime}>{fmtSec(sec)}</p>
                      <p style={S.tsDesc}>집중력 30점 미만으로 저하된 구간</p>
                    </div>
                    {videoElement && (
                      <button style={S.seekBtn} onClick={() => handleSeek(sec)}>
                        ▶ 복습
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 학습 팁 */}
          {reviewTimestamps.length > 0 && (
            <div style={S.tipBox}>
              <p style={S.tipTitle}>💡 학습 팁</p>
              <p style={S.tipText}>
                위 구간을 다시 시청하면 학습 효율을 높일 수 있어요.
                짧은 휴식 후 복습하는 것이 장기 기억 형성에 도움이 됩니다.
              </p>
            </div>
          )}

          <button style={S.doneBtn} onClick={onClose}>확인</button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={S.statCard}>
      <p style={S.statIcon}>{icon}</p>
      <p style={S.statLabel}>{label}</p>
      <p style={{ ...S.statValue, color }}>{value}</p>
    </div>
  );
}

const S = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 300, backdropFilter: 'blur(6px)', padding: 16,
  },
  panel: {
    background: D.bg, border: `1px solid ${D.border}`,
    borderRadius: 20, width: '100%', maxWidth: 600,
    maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 32px 64px rgba(0,0,0,.8)',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '20px 24px 16px',
    borderBottom: `1px solid ${D.border}`,
    position: 'sticky', top: 0, background: D.bg, zIndex: 1,
  },
  titleIcon: { fontSize: 28 },
  title:     { margin: 0, fontSize: 18, fontWeight: 800, color: D.text },
  subtitle:  { margin: '2px 0 0', fontSize: 12, color: D.muted },
  closeBtn:  { background: 'none', border: 'none', color: D.muted, fontSize: 20, cursor: 'pointer' },

  body: { padding: 24 },

  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 },
  statCard: {
    background: D.surface, borderRadius: 12, padding: '14px 10px',
    textAlign: 'center', border: `1px solid ${D.border}`,
  },
  statIcon:  { margin: '0 0 4px', fontSize: 20 },
  statLabel: { margin: '0 0 6px', fontSize: 10, color: D.muted, fontWeight: 700 },
  statValue: { margin: 0, fontSize: 22, fontWeight: 900 },

  chartBox:    { background: D.surface, borderRadius: 12, padding: 16, marginBottom: 20, border: `1px solid ${D.border}` },
  sectionTitle: { margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: D.text, display: 'flex', alignItems: 'center', gap: 8 },

  tsBox:   { background: D.surface, borderRadius: 12, padding: 16, marginBottom: 20, border: `1px solid ${D.border}` },
  tsBadge: {
    marginLeft: 'auto', padding: '2px 10px', borderRadius: 999,
    background: D.danger + '22', color: D.danger, fontSize: 11, fontWeight: 800,
  },
  tsList:  { display: 'flex', flexDirection: 'column', gap: 8 },
  tsItem:  {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 12px', borderRadius: 8, background: D.bg, border: `1px solid ${D.border}`,
  },
  tsIndex: {
    width: 24, height: 24, borderRadius: '50%', background: D.danger + '33',
    color: D.danger, fontSize: 12, fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  tsTime:  { margin: 0, fontSize: 15, fontWeight: 800, color: D.text },
  tsDesc:  { margin: '2px 0 0', fontSize: 11, color: D.muted },
  seekBtn: {
    padding: '6px 14px', borderRadius: 8, background: D.accent, border: 'none',
    color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
  },
  emptyTs: { textAlign: 'center', padding: '20px 0' },

  tipBox:   {
    background: '#1e3a2f', border: `1px solid #22c55e44`,
    borderRadius: 12, padding: 16, marginBottom: 20,
  },
  tipTitle: { margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: D.success },
  tipText:  { margin: 0, fontSize: 13, color: '#86efac', lineHeight: 1.6 },

  doneBtn: {
    width: '100%', padding: '12px 0', borderRadius: 10,
    background: D.accent, border: 'none', color: '#fff',
    fontSize: 15, fontWeight: 800, cursor: 'pointer',
  },
};
