import { base44 } from '@/api/base44Client';
import guestDataPersistence from '@/lib/GuestDataPersistence';

/**
 * 게스트 데이터를 로그인한 계정 서버로 마이그레이션합니다.
 * 로그인 직후 호출하면 기존 게스트 기록이 그대로 옮겨집니다.
 */
export async function migrateGuestDataToAccount() {
  const guestData = guestDataPersistence.getData();

  // 온보딩 완료된 게스트 데이터가 없으면 스킵
  if (!guestData?.onboardingComplete) return false;

  const goals = guestData.goals || [];
  const actionGoals = guestData.actionGoals || [];
  const actionLogs = guestData.actionLogs || [];

  if (goals.length === 0 && actionGoals.length === 0) return false;

  const today = new Date().toISOString().split('T')[0];

  // 기존 서버 데이터 확인 - 이미 데이터가 있으면 마이그레이션 스킵
  const existingGoals = await base44.entities.Goal.filter({ status: 'active' });
  if (existingGoals && existingGoals.length > 0) return false;

  // 닉네임 업데이트
  if (guestData.nickname) {
    await base44.auth.updateMe({
      nickname: guestData.nickname,
      onboarding_complete: true,
      active_category: guestData.category || guestData.activeCategory || 'exercise',
    });
  }

  // goal id 매핑 (local id → server id)
  const goalIdMap = {};

  for (const goal of goals) {
    const createdGoal = await base44.entities.Goal.create({
      category: goal.category,
      goal_type: goal.goal_type || 'result',
      title: goal.title,
      duration_days: goal.duration_days,
      start_date: goal.start_date || today,
      status: goal.status || 'active',
      ...(goal.d_day ? { d_day: goal.d_day, has_d_day: true } : {}),
    });
    goalIdMap[goal.id] = createdGoal.id;
  }

  // actionGoal id 매핑 (local id → server id)
  const actionGoalIdMap = {};

  for (const ag of actionGoals) {
    const serverGoalId = goalIdMap[ag.goal_id] || null;
    if (!serverGoalId) continue;

    const createdAg = await base44.entities.ActionGoal.create({
      goal_id: serverGoalId,
      category: ag.category,
      title: ag.title,
      action_type: ag.action_type || 'confirm',
      weekly_frequency: ag.weekly_frequency || 3,
      duration_minutes: ag.duration_minutes || 0,
      duration_days: ag.duration_days || null,
      frequency_mode: ag.frequency_mode || 'weekly',
      scheduled_date: ag.scheduled_date || null,
      status: ag.status || 'active',
    });
    actionGoalIdMap[ag.id] = createdAg.id;
  }

  // 액션 로그 마이그레이션
  for (const log of actionLogs) {
    const serverActionGoalId = actionGoalIdMap[log.action_goal_id] || null;
    if (!serverActionGoalId) continue;

    const serverGoalId = log.goal_id ? goalIdMap[log.goal_id] : null;

    await base44.entities.ActionLog.create({
      action_goal_id: serverActionGoalId,
      goal_id: serverGoalId || undefined,
      category: log.category,
      date: log.date || today,
      duration_minutes: log.duration_minutes || 0,
      completed: log.completed !== false,
      memo: log.memo || '',
    });
  }

  // 마이그레이션 완료 후 게스트 데이터 삭제
  guestDataPersistence.clearAll();

  return true;
}