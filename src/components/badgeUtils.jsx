// ─── Grade thresholds ─────────────────────────────────
export const GRADES = [
  { id: 'legend',   label: '레전드',   minStreak: 100, color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-300', emoji: '👑' },
  { id: 'platinum', label: '플래티넘', minStreak: 50,  color: 'text-sky-600',    bg: 'bg-sky-100',    border: 'border-sky-300',    emoji: '💎' },
  { id: 'gold',     label: '골드',     minStreak: 30,  color: 'text-amber-600',  bg: 'bg-amber-100',  border: 'border-amber-300',  emoji: '🥇' },
  { id: 'silver',   label: '실버',     minStreak: 14,  color: 'text-slate-500',  bg: 'bg-slate-100',  border: 'border-slate-300',  emoji: '🥈' },
  { id: 'bronze',   label: '브론즈',   minStreak: 7,   color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-300', emoji: '🥉' },
  { id: 'iron',     label: '아이언',   minStreak: 0,   color: 'text-gray-500',   bg: 'bg-gray-100',   border: 'border-gray-300',   emoji: '🏅' },
];

export function getGrade(streak) {
  return GRADES.find(g => streak >= g.minStreak) || GRADES[GRADES.length - 1];
}

export function getBadgeForGoal(goal) {
  if (!goal) return { title: '여정의 완주자', description: '여정을 완주했습니다.' };
  const t = (goal.title || '').toLowerCase();
  if (t.includes('kg') || t.includes('다이어트') || t.includes('체중')) return { title: '몸의 개척자',   description: `${goal.title} 완주` };
  if (t.includes('토익') || t.includes('토플') || t.includes('영어'))  return { title: '언어의 탐구자', description: `${goal.title} 달성` };
  if (t.includes('금연'))  return { title: '의지의 수호자', description: `${goal.title} 완주` };
  if (t.includes('러닝') || t.includes('마라톤')) return { title: '끈기의 발걸음', description: `${goal.title} 완주` };
  if (t.includes('명상') || t.includes('정신'))   return { title: '마음 수련자',   description: `${goal.title} 완주` };
  if (t.includes('공부') || t.includes('학습'))   return { title: '지식의 탐구자', description: `${goal.title} 달성` };
  return { title: '여정의 완주자', description: `${goal.title} 완주` };
}

export function getStreakTrigger(streak) {
  if (streak === 100) return 'streak_100';
  if (streak === 30)  return 'streak_30';
  if (streak === 7)   return 'streak_7';
  return null;
}

export function computeStreak(actionGoalId, allLogs) {
  const dates = allLogs
    .filter(l => l.action_goal_id === actionGoalId && l.completed)
    .map(l => l.date)
    .sort((a, b) => b.localeCompare(a));

  if (!dates.length) return 0;

  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (const d of dates) {
    const cursorStr = cursor.toISOString().split('T')[0];
    if (d === cursorStr) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (d < cursorStr) {
      break;
    }
  }
  return streak;
}