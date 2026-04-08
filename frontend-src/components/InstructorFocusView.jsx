/**
 * InstructorFocusView.jsx — 강사용 클래스 몰입도 통계 뷰
 *
 * GET /api/focus-logs/course/{courseId}/stats 응답:
 *   { courseId, avgOverallScore, avgFocusRatio, sessionCount }
 *
 * GET /api/focus-logs/course/{courseId} 응답:
 *   FocusLogResponseDto[] — 전체 학생 로그 목록
 *
 * Props:
 *   courseId : number — 현재 강의 ID
 */

import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import useCourseStore from '../store/useCourseStore';

export default function InstructorFocusView({ courseId }) {
  const { courseStats, fetchCourseStats } = useCourseStore();

  // 개별 로그 목록은 별도 로컬 상태로 관리 (store 오염 방지)
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);

    const BASE = 'http://localhost:8081/api';

    Promise.all([
      fetchCourseStats(courseId),
      fetch(`${BASE}/focus-logs/course/${courseId}`, { credentials: 'include' })
        .then((r) => r.json()),
    ])
      .then(([, rawLogs]) => {
        setLogs(Array.isArray(rawLogs) ? rawLogs : []);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [courseId, fetchCourseStats]);

  // ── 차트용 데이터 변환 ────────────────────────────────────────
  // 날짜별 평균 overallScore 집계
  const chartData = (() => {
    const byDate = {};
    logs.forEach((l) => {
      const day = new Date(l.sessionDate).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
      if (!byDate[day]) byDate[day] = { total: 0, count: 0 };
      byDate[day].total += l.overallScore;
      byDate[day].count += 1;
    });
    return Object.entries(byDate)
      .map(([date, { total, count }]) => ({
        date,
        avg: Math.round(total / count),
      }))
      .slice(-14); // 최근 14일
  })();

  // ── 세션 타입 분포 ────────────────────────────────────────────
  const typeDist = logs.reduce(
    (acc, l) => {
      if (l.sessionType === 'LIVE') acc.live += 1;
      else acc.vod += 1;
      return acc;
    },
    { live: 0, vod: 0 }
  );

  // ── 몰입도 구간별 분포 ────────────────────────────────────────
  const scoreDist = logs.reduce(
    (acc, l) => {
      if      (l.overallScore >= 80) acc.high   += 1;
      else if (l.overallScore >= 60) acc.mid    += 1;
      else if (l.overallScore >= 40) acc.low    += 1;
      else                           acc.veryLow += 1;
      return acc;
    },
    { high: 0, mid: 0, low: 0, veryLow: 0 }
  );

  const scoreColor = (score) => {
    if (!score && score !== 0) return '#9ca3af';
    if (score >= 80) return '#6366f1';
    if (score >= 60) return '#22c55e';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  // ── 렌더 ──────────────────────────────────────────────────────
  if (loading) return <div style={S.center}>📊 통계 불러오는 중…</div>;
  if (error)   return <div style={S.center}>⚠️ {error}</div>;
  if (!courseStats && !logs.length) {
    return (
      <div style={S.empty}>
        <p style={{ fontSize: 36 }}>📭</p>
        <p>아직 수집된 몰입도 데이터가 없습니다.</p>
        <p style={{ fontSize: 12, color: '#9ca3af' }}>수강생들이 VOD 또는 실시간 강의를 수강하면 데이터가 쌓입니다.</p>
      </div>
    );
  }

  return (
    <div style={S.wrap}>
      <h2 style={S.heading}>📊 클래스 몰입도 현황</h2>

      {/* ── 요약 카드 4종 ── */}
      <div style={S.statRow}>
        <StatCard
          icon="🎯"
          label="클래스 평균 몰입도"
          value={courseStats?.avgOverallScore != null
            ? `${courseStats.avgOverallScore.toFixed(1)}점`
            : '—'}
          color={scoreColor(courseStats?.avgOverallScore)}
        />
        <StatCard
          icon="⏱"
          label="평균 집중 비율"
          value={courseStats?.avgFocusRatio != null
            ? `${(courseStats.avgFocusRatio * 100).toFixed(0)}%`
            : '—'}
          color="#6366f1"
        />
        <StatCard
          icon="📡"
          label="실시간 세션"
          value={`${typeDist.live}회`}
          color="#ef4444"
        />
        <StatCard
          icon="🎬"
          label="VOD 세션"
          value={`${typeDist.vod}회`}
          color="#22c55e"
        />
      </div>

      {/* ── 날짜별 평균 몰입도 추이 ── */}
      {chartData.length > 1 && (
        <div style={S.chartBox}>
          <h3 style={S.chartTitle}>📈 날짜별 평균 몰입도 추이</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`${v}점`, '평균 몰입도']}
              />
              <ReferenceLine y={80} stroke="#6366f1" strokeDasharray="4 2" label={{ value: '우수(80)', position: 'insideTopRight', fontSize: 10, fill: '#6366f1' }} />
              <ReferenceLine y={60} stroke="#22c55e" strokeDasharray="4 2" label={{ value: '양호(60)', position: 'insideTopRight', fontSize: 10, fill: '#22c55e' }} />
              <Line type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── 몰입도 구간 분포 ── */}
      {logs.length > 0 && (
        <div style={S.distBox}>
          <h3 style={S.chartTitle}>📊 몰입도 구간 분포</h3>
          <div style={S.distRow}>
            {[
              { label: '🔥 우수 (80+)',  count: scoreDist.high,    color: '#6366f1' },
              { label: '⚡ 양호 (60–79)', count: scoreDist.mid,     color: '#22c55e' },
              { label: '😐 보통 (40–59)', count: scoreDist.low,     color: '#f59e0b' },
              { label: '😴 저조 (0–39)',  count: scoreDist.veryLow, color: '#ef4444' },
            ].map(({ label, count, color }) => {
              const pct = logs.length ? Math.round((count / logs.length) * 100) : 0;
              return (
                <div key={label} style={S.distCard}>
                  <p style={S.distLabel}>{label}</p>
                  <p style={{ ...S.distCount, color }}>{count}회</p>
                  <div style={S.barTrack}>
                    <div style={{ ...S.barFill, width: `${pct}%`, background: color }} />
                  </div>
                  <p style={S.distPct}>{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 최근 세션 테이블 ── */}
      {logs.length > 0 && (
        <div style={S.tableBox}>
          <h3 style={S.chartTitle}>📋 최근 세션 로그</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={S.tbl}>
              <thead>
                <tr>
                  {['날짜', '세션 유형', '몰입도', '집중 비율', '집중', '졸음', '자리비움'].map((h) => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 20).map((l) => (
                  <tr key={l.id} style={S.tr}>
                    <td style={S.td}>{new Date(l.sessionDate).toLocaleDateString('ko-KR')}</td>
                    <td style={S.td}>
                      <span style={{ ...S.typeBadge, background: l.sessionType === 'LIVE' ? '#fef2f2' : '#f0fdf4', color: l.sessionType === 'LIVE' ? '#ef4444' : '#22c55e' }}>
                        {l.sessionType === 'LIVE' ? '📡 실시간' : '🎬 VOD'}
                      </span>
                    </td>
                    <td style={{ ...S.td, fontWeight: 700, color: scoreColor(l.overallScore) }}>
                      {l.overallScore?.toFixed(0)}점
                    </td>
                    <td style={S.td}>{l.focusRatio != null ? `${(l.focusRatio * 100).toFixed(0)}%` : '—'}</td>
                    <td style={S.td}>{l.focusedMinutes ?? '—'}분</td>
                    <td style={S.td}>{l.drowsyMinutes ?? '—'}분</td>
                    <td style={S.td}>{l.awayMinutes ?? '—'}분</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length > 20 && (
              <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: '8px 0' }}>
                최근 20개 표시 중 (총 {logs.length}개)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── StatCard 서브컴포넌트 ────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <div style={S.statCard}>
      <p style={S.statIcon}>{icon}</p>
      <p style={S.statLabel}>{label}</p>
      <p style={{ ...S.statValue, color }}>{value}</p>
    </div>
  );
}

// ── 스타일 ──────────────────────────────────────────────────────
const S = {
  wrap:    { padding: '8px 0' },
  heading: { margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#111827' },
  center:  { textAlign: 'center', padding: '60px 0', color: '#6b7280', fontSize: 14 },
  empty:   { textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: 14 },

  // 요약 카드 행
  statRow:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 },
  statCard: { background: '#fff', borderRadius: 12, padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', textAlign: 'center' },
  statIcon:  { margin: '0 0 4px', fontSize: 24 },
  statLabel: { margin: '0 0 6px', fontSize: 11, color: '#9ca3af', fontWeight: 600 },
  statValue: { margin: 0, fontSize: 22, fontWeight: 800 },

  // 차트 박스
  chartBox:   { background: '#fff', borderRadius: 12, padding: '20px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,.07)' },
  chartTitle: { margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#111827' },

  // 분포
  distBox:  { background: '#fff', borderRadius: 12, padding: '20px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,.07)' },
  distRow:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 },
  distCard: { textAlign: 'center' },
  distLabel: { margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: '#374151' },
  distCount: { margin: '0 0 8px', fontSize: 22, fontWeight: 800 },
  barTrack: { height: 6, background: '#f3f4f6', borderRadius: 999, overflow: 'hidden', margin: '0 0 4px' },
  barFill:  { height: '100%', borderRadius: 999, transition: 'width .4s' },
  distPct:  { margin: 0, fontSize: 11, color: '#9ca3af' },

  // 테이블
  tableBox: { background: '#fff', borderRadius: 12, padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,.07)' },
  tbl:  { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:   { padding: '8px 12px', background: '#f9fafb', fontWeight: 700, color: '#374151', textAlign: 'left', whiteSpace: 'nowrap', borderBottom: '1px solid #e5e7eb' },
  tr:   { borderBottom: '1px solid #f3f4f6' },
  td:   { padding: '8px 12px', color: '#374151', whiteSpace: 'nowrap' },
  typeBadge: { display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 },
};
