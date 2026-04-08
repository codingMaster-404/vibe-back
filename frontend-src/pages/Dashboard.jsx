/**
 * Dashboard.jsx — 학습 대시보드 (몰입도 차트 고도화 버전)
 *
 * 추가된 섹션:
 * - 오늘의 평균 몰입도 요약 카드
 * - 최근 세션별 몰입도 추이 LineChart (Recharts)
 * - 기존 주간 학습 시간 BarChart / 달성률 RadialBarChart 유지
 */

import { useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis,
  LineChart, Line, ReferenceLine,
} from 'recharts';
import useUserStore,  { formatMinutes } from '../store/useUserStore';
import useStudyStore from '../store/useStudyStore';

const CURRENT_USER_ID = 1;

// ─── Tooltip 컴포넌트 ─────────────────────────────────────────────
const MinutesTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={styles.tooltip}>
      <p style={styles.tooltipLabel}>{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.stroke ?? entry.fill, margin: '2px 0', fontSize: 13 }}>
          {entry.name}: {entry.name === '학습시간' ? formatMinutes(entry.value) : `${entry.value}점`}
        </p>
      ))}
    </div>
  );
};

const GaugeLabel = ({ cx, cy, achievementRate }) => (
  <>
    <text x={cx} y={cy - 8} textAnchor="middle" style={styles.gaugePrimary}>
      {achievementRate?.toFixed(1)}%
    </text>
    <text x={cx} y={cy + 16} textAnchor="middle" style={styles.gaugeSecondary}>
      달성률
    </text>
  </>
);

// ─── 몰입도 수준 레이블 ───────────────────────────────────────────
const focusLabel = (score) => {
  if (score == null)  return { text: '-',     color: '#9ca3af' };
  if (score >= 80)    return { text: '🔥 최고', color: '#6366f1' };
  if (score >= 60)    return { text: '⚡ 양호', color: '#22c55e' };
  if (score >= 40)    return { text: '😐 보통', color: '#f59e0b' };
  return              { text: '😴 낮음',        color: '#ef4444' };
};

// ─── 메인 컴포넌트 ────────────────────────────────────────────────
export default function Dashboard() {
  const {
    user, weeklyProgress, compareChartData, gaugeChartData,
    isLoading: userLoading, error: userError, fetchAll,
  } = useUserStore();

  const {
    studyLogs, isLoading: logsLoading, fetchStudyLogs,
    getFocusTrendData, getTodayAverageFocus,
  } = useStudyStore();

  useEffect(() => {
    fetchAll(CURRENT_USER_ID);
    fetchStudyLogs(CURRENT_USER_ID);
  }, [fetchAll, fetchStudyLogs]);

  const focusTrendData   = getFocusTrendData();
  const todayFocus       = getTodayAverageFocus();
  const todayFocusLabel  = focusLabel(todayFocus);

  if (userLoading || logsLoading) return <div style={styles.center}>불러오는 중…</div>;
  if (userError) return <div style={styles.center}>⚠️ {userError}</div>;
  if (!user) return null;

  return (
    <div style={styles.page}>

      {/* ── 헤더 ────────────────────────────────────────────── */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.greeting}>
            안녕하세요, <span style={styles.nickname}>{user.nickname}</span> 님 👋
          </h1>
          <p style={styles.subGreeting}>이번 주 학습 현황과 AI 몰입도를 확인하세요.</p>
        </div>
        <a href="/study/vod" style={styles.studyBtn}>📚 VOD 학습 시작</a>
      </header>

      {/* ── 요약 카드 ────────────────────────────────────────── */}
      <section style={styles.cardRow}>
        <StatCard label="주간 목표"   value={formatMinutes(weeklyProgress?.weeklyGoalMinutes)} color="#6366f1" />
        <StatCard label="실제 학습"   value={formatMinutes(weeklyProgress?.actualMinutes)}     color="#22c55e" />
        <StatCard
          label="주간 달성률"
          value={`${weeklyProgress?.achievementRate?.toFixed(1) ?? 0}%`}
          color={weeklyProgress?.achievementRate >= 100 ? '#f59e0b' : '#6366f1'}
        />
        {/* 오늘의 평균 몰입도 카드 */}
        <StatCard
          label="오늘의 평균 몰입도"
          value={todayFocus != null ? `${todayFocus}점` : 'AI 데이터 없음'}
          color={todayFocusLabel.color}
          badge={todayFocus != null ? todayFocusLabel.text : null}
        />
      </section>

      {/* ── 차트 행 1: 주간 학습 통계 ───────────────────────── */}
      <section style={styles.chartRow}>

        {/* 달성률 RadialBarChart */}
        <div style={styles.chartBox}>
          <h2 style={styles.chartTitle}>이번 주 달성률</h2>
          <ResponsiveContainer width="100%" height={260}>
            <RadialBarChart innerRadius="60%" outerRadius="90%" data={gaugeChartData} startAngle={90} endAngle={-270}>
              <RadialBar background={{ fill: '#e5e7eb' }} dataKey="value" cornerRadius={8} max={100} />
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              {weeklyProgress && <GaugeLabel cx="50%" cy="50%" achievementRate={weeklyProgress.achievementRate} />}
            </RadialBarChart>
          </ResponsiveContainer>
          <p style={styles.chartSub}>{weeklyProgress?.weekStart} ~ {weeklyProgress?.weekEnd}</p>
        </div>

        {/* 목표 vs 실제 BarChart */}
        <div style={styles.chartBox}>
          <h2 style={styles.chartTitle}>목표 vs 실제 학습 시간</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={compareChartData} margin={{ top: 10, right: 20, left: 0 }} barCategoryGap="40%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 13 }} />
              <YAxis tickFormatter={(v) => `${Math.floor(v / 60)}h`} tick={{ fontSize: 12 }} />
              <Tooltip content={<MinutesTooltip />} />
              <Legend />
              <Bar dataKey="목표" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
              <Bar dataKey="실제" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── 차트 행 2: AI 몰입도 추이 LineChart ─────────────── */}
      <section style={styles.focusSection}>
        <div style={styles.focusSectionHeader}>
          <h2 style={styles.sectionTitle}>🔥 AI 몰입도 분석</h2>
          <p style={styles.sectionSub}>최근 세션별 평균 집중도 추이 (AI 캠 사용 세션만 표시)</p>
        </div>

        {focusTrendData.length === 0 ? (
          <div style={styles.emptyFocus}>
            <p style={{ fontSize: 32 }}>📷</p>
            <p style={{ fontWeight: 600, color: '#374151' }}>아직 AI 몰입도 데이터가 없습니다.</p>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>
              VOD 학습 또는 가상 강의실에서 AI 캠 모드를 켜면<br />
              집중도 데이터가 여기에 나타납니다.
            </p>
            <a href="/study/vod" style={styles.startBtn}>지금 학습 시작하기 →</a>
          </div>
        ) : (
          <div style={styles.chartBox}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={focusTrendData} margin={{ top: 10, right: 24, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}점`} tick={{ fontSize: 12 }} />
                <Tooltip content={<MinutesTooltip />} />
                <Legend verticalAlign="top" />

                {/* 기준선: 60점 (양호 기준) */}
                <ReferenceLine y={60} stroke="#22c55e" strokeDasharray="4 4" label={{ value: '양호 기준', position: 'right', fontSize: 11, fill: '#22c55e' }} />
                <ReferenceLine y={80} stroke="#6366f1" strokeDasharray="4 4" label={{ value: '집중 기준', position: 'right', fontSize: 11, fill: '#6366f1' }} />

                <Line
                  type="monotone"
                  dataKey="몰입도"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* 세션 요약 테이블 */}
            <div style={styles.logTable}>
              <div style={styles.logTableHeader}>
                <span>세션</span><span>몰입도</span><span>학습 시간</span>
              </div>
              {studyLogs.filter((l) => l.averageFocusScore != null).slice(0, 5).map((log) => {
                const fl = focusLabel(log.averageFocusScore);
                return (
                  <div key={log.id} style={styles.logRow}>
                    <span style={styles.logTitle}>{log.meetingTitle}</span>
                    <span style={{ color: fl.color, fontWeight: 700 }}>
                      {fl.text} {log.averageFocusScore}점
                    </span>
                    <span style={styles.logDuration}>{formatMinutes(log.durationMinutes)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ─── 서브 컴포넌트 ────────────────────────────────────────────────
function StatCard({ label, value, color, badge }) {
  return (
    <div style={styles.card}>
      <p style={styles.cardLabel}>{label}</p>
      <p style={{ ...styles.cardValue, color }}>{value}</p>
      {badge && <span style={{ ...styles.cardBadge, background: color + '22', color }}>{badge}</span>}
    </div>
  );
}

// ─── 스타일 ──────────────────────────────────────────────────────
const styles = {
  page: { maxWidth: 980, margin: '0 auto', padding: '32px 24px', fontFamily: "'Pretendard', sans-serif" },
  center: { textAlign: 'center', marginTop: 80, fontSize: 16, color: '#6b7280' },

  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  greeting:    { fontSize: 26, fontWeight: 700, margin: 0, color: '#111827' },
  nickname:    { color: '#6366f1' },
  subGreeting: { marginTop: 6, color: '#6b7280', fontSize: 15 },
  studyBtn:    { padding: '10px 20px', background: '#6366f1', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' },

  cardRow:   { display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' },
  card:      { flex: 1, minWidth: 160, background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' },
  cardLabel: { margin: 0, fontSize: 12, color: '#9ca3af', fontWeight: 600 },
  cardValue: { margin: '8px 0 4px', fontSize: 24, fontWeight: 800 },
  cardBadge: { display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700 },

  chartRow: { display: 'flex', gap: 18, marginBottom: 28 },
  chartBox: { flex: 1, background: '#fff', borderRadius: 14, padding: '22px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' },
  chartTitle: { margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#374151' },
  chartSub:   { margin: '6px 0 0', fontSize: 12, color: '#9ca3af', textAlign: 'center' },

  focusSection:       { marginBottom: 28 },
  focusSectionHeader: { marginBottom: 14 },
  sectionTitle:       { margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' },
  sectionSub:         { margin: '4px 0 0', fontSize: 13, color: '#9ca3af' },

  emptyFocus: { background: '#fff', borderRadius: 14, padding: '48px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.08)' },
  startBtn:   { display: 'inline-block', marginTop: 16, padding: '10px 22px', background: '#6366f1', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' },

  logTable:       { marginTop: 20, borderTop: '1px solid #f3f4f6' },
  logTableHeader: { display: 'flex', justifyContent: 'space-between', padding: '8px 4px', fontSize: 11, color: '#9ca3af', fontWeight: 600 },
  logRow:         { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 4px', borderBottom: '1px solid #f9fafb', fontSize: 13 },
  logTitle:       { flex: 1, color: '#374151', marginRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  logDuration:    { color: '#9ca3af', flexShrink: 0 },

  tooltip:      { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px' },
  tooltipLabel: { margin: '0 0 4px', fontWeight: 600, color: '#111827', fontSize: 13 },

  gaugePrimary:   { fontSize: 30, fontWeight: 700, fill: '#111827' },
  gaugeSecondary: { fontSize: 12, fill: '#9ca3af' },
};
