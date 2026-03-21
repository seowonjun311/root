import React from 'react';

export default function Header({
  title = '루트',
  subtitle = '오늘의 행동목표를 하나씩 완료해보세요',
}) {
  const today = new Date();
  const dateText = `${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <div style={styles.wrapper}>
      <div style={styles.topRow}>
        <div>
          <div style={styles.dateText}>{dateText}</div>
          <h1 style={styles.title}>{title}</h1>
          <p style={styles.subtitle}>{subtitle}</p>
        </div>

        <div style={styles.badgeBox}>
          <div style={styles.badgeEmoji}>🦊</div>
        </div>
      </div>

      <div style={styles.infoCard}>
        <div style={styles.infoLeft}>
          <div style={styles.infoLabel}>오늘의 한 걸음</div>
          <div style={styles.infoTitle}>작은 완료가 길을 만듭니다</div>
        </div>

        <div style={styles.infoRight}>✨</div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    paddingTop: '8px',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  },
  dateText: {
    color: '#cbd5e1',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '8px',
  },
  title: {
    margin: 0,
    color: '#ffffff',
    fontSize: '32px',
    fontWeight: 800,
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    marginTop: '10px',
    marginBottom: 0,
    color: '#d1d5db',
    fontSize: '14px',
    lineHeight: 1.5,
    wordBreak: 'keep-all',
  },
  badgeBox: {
    width: '68px',
    height: '68px',
    borderRadius: '22px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 12px 24px rgba(139, 92, 246, 0.28)',
    flexShrink: 0,
  },
  badgeEmoji: {
    fontSize: '30px',
    lineHeight: 1,
  },
  infoCard: {
    marginTop: '18px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    padding: '16px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '14px',
  },
  infoLeft: {
    minWidth: 0,
  },
  infoLabel: {
    color: '#c4b5fd',
    fontSize: '12px',
    fontWeight: 700,
    marginBottom: '6px',
  },
  infoTitle: {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 700,
    lineHeight: 1.4,
    wordBreak: 'keep-all',
  },
  infoRight: {
    width: '42px',
    height: '42px',
    borderRadius: '14px',
    backgroundColor: 'rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    flexShrink: 0,
  },
};
