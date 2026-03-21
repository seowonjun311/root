import React, { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'root_home_goals_v13';

const XP_BY_CATEGORY = {
  운동: 12,
  공부: 10,
  정신: 8,
  일상: 6,
};

function getLevelFromXp(xp) {
  const level = Math.floor(xp / 100) + 1;
  const currentLevelStartXp = (level - 1) * 100;
  const nextLevelXp = level * 100;
  const progressXp = xp - currentLevelStartXp;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((progressXp / 100) * 100))
  );

  return {
    level,
    progressPercent,
    remainXp: nextLevelXp - xp,
  };
}

function getSavedXpSummary() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return {
        운동: 0,
        공부: 0,
        정신: 0,
        일상: 0,
        total: 0,
      };
    }

    const parsed = JSON.parse(raw);
    const goals = Array.isArray(parsed?.goals) ? parsed.goals : [];
    const records = parsed?.records || {};

    const result = {
      운동: 0,
      공부: 0,
      정신: 0,
      일상: 0,
      total: 0,
    };

    Object.entries(records).forEach(([recordKey, record]) => {
      if (!record?.done) return;

      const goalId = Number(String(recordKey).split('_')[0]);
      const goal = goals.find((item) => item.id === goalId);
      if (!goal) return;

      const earnedXp = XP_BY_CATEGORY[goal.category] || 0;
      result[goal.category] += earnedXp;
      result.total += earnedXp;
    });

    return result;
  } catch (error) {
    console.error('Header localStorage 읽기 실패:', error);
    return {
      운동: 0,
      공부: 0,
      정신: 0,
      일상: 0,
      total: 0,
    };
  }
}

export default function Header({
  title = '루트',
  subtitle = '오늘의 행동목표를 하나씩 완료해보세요',
}) {
  const today = new Date();
  const dateText = `${today.getMonth() + 1}월 ${today.getDate()}일`;

  const [xpSummary, setXpSummary] = useState(getSavedXpSummary());

  useEffect(() => {
    const refresh = () => {
      setXpSummary(getSavedXpSummary());
    };

    refresh();

    window.addEventListener('storage', refresh);
    window.addEventListener('root-home-data-updated', refresh);

    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('root-home-data-updated', refresh);
    };
  }, []);

  const totalLevel = useMemo(() => {
    return getLevelFromXp(xpSummary.total);
  }, [xpSummary.total]);

  return (
    <div style={styles.wrapper}>
      {/* 상단 텍스트 영역 */}
      <div style={styles.topRow}>
        <div style={styles.leftWrap}>
          <div style={styles.dateText}>{dateText}</div>
          <h1 style={styles.title}>{title}</h1>
          <p style={styles.subtitle}>{subtitle}</p>
        </div>

        <div style={styles.badgeBox}>
          <div style={styles.badgeEmoji}>🦊</div>
        </div>
      </div>

      {/* 레벨 영역 */}
      <div style={styles.levelRow}>
        <div style={styles.levelMainText}>
          전체 Lv.{totalLevel.level} · 총 {xpSummary.total} XP
        </div>
        <div style={styles.levelSubText}>
          다음 레벨까지 {totalLevel.remainXp} XP
        </div>
      </div>

      {/* 진행바 */}
      <div style={styles.levelBarBackground}>
        <div
          style={{
            ...styles.levelBarFill,
            width: `${totalLevel.progressPercent}%`,
          }}
        />
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    padding: '10px 16px 6px', // 👈 아래 여백 줄여서 카테고리랑 붙게
    background:
      'linear-gradient(180deg, rgba(20,15,29,0.985) 0%, rgba(27,20,48,0.985) 100%)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },

  topRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '14px',
  },

  leftWrap: {
    flex: 1,
    minWidth: 0,
  },

  dateText: {
    color: '#cbd5e1',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '4px',
  },

  title: {
    margin: 0,
    color: '#ffffff',
    fontSize: '28px', // 👈 살짝 줄임 (더 슬림)
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  },

  subtitle: {
    marginTop: '6px',
    marginBottom: 0,
    color: '#d1d5db',
    fontSize: '13px',
    lineHeight: 1.4,
  },

  badgeBox: {
    width: '60px',
    height: '60px',
    borderRadius: '18px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 18px rgba(139, 92, 246, 0.22)',
    flexShrink: 0,
  },

  badgeEmoji: {
    fontSize: '26px',
  },

  levelRow: {
    marginTop: '10px',
  },

  levelMainText: {
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 800,
  },

  levelSubText: {
    marginTop: '3px',
    color: '#d1d5db',
    fontSize: '12px',
  },

  levelBarBackground: {
    width: '100%',
    height: '7px',
    borderRadius: '999px',
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginTop: '6px',
  },

  levelBarFill: {
    height: '100%',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%)',
  },
};
