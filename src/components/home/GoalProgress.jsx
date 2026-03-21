import React from 'react';

export default function GoalProgress({
  completed = 0,
  total = 0,
  percent = 0,
}) {
  return (
    <div style={styles.card}>
      <div style={styles.topRow}>
        <div>
          <div style={styles.label}>오늘의 진행도</div>
          <div style={styles.countText}>
            {completed} / {total} 완료
          </div>
        </div>

        <div style={styles.percentBadge}>{percent}%</div>
      </div>

      <div style={styles.barBackground}>
        <div
          style={{
            ...styles.barFill,
            width: `${Math.max(0, Math.min(percent, 100))}%`,
          }}
        />
      </div>

      <div style={styles.bottomText}>
        {percent === 100
          ? '오늘의 행동목표를 모두 완료했어요!'
          : percent >= 70
          ? '조금만 더 하면 오늘 목표 달성이에요'
          : percent >= 30
          ? '좋아요, 꾸준히 진행 중이에요'
          : '첫 행동 하나만 완료해도 흐름이 시작돼요'}
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: 'linear-gradient(180deg, #261b3a 0%, #1f1730 100%)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '22px',
    padding: '18px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '14px',
  },
  label: {
    color: '#cbd5e1',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '6px',
  },
  countText: {
    color: '#ffffff',
    fontSize: '22px',
    fontWeight: 800,
    lineHeight: 1.2,
  },
  percentBadge: {
    minWidth: '64px',
    height: '40px',
    padding: '0 12px',
    borderRadius: '999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 800,
    flexShrink: 0,
  },
  barBackground: {
    width: '100%',
    height: '14px',
    borderRadius: '999px',
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%)',
    transition: 'width 0.3s ease',
  },
  bottomText: {
    marginTop: '12px',
    color: '#d1d5db',
    fontSize: '13px',
    lineHeight: 1.5,
  },
};
