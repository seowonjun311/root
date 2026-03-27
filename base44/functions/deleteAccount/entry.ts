import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 사용자의 모든 데이터 삭제
    const [goals, actionGoals, actionLogs, badges] = await Promise.all([
      base44.entities.Goal.filter({ created_by: user.email }),
      base44.entities.ActionGoal.filter({ created_by: user.email }),
      base44.entities.ActionLog.filter({ created_by: user.email }),
      base44.entities.Badge.filter({ created_by: user.email }),
    ]);

    await Promise.all([
      ...goals.map((g) => base44.entities.Goal.delete(g.id)),
      ...actionGoals.map((ag) => base44.entities.ActionGoal.delete(ag.id)),
      ...actionLogs.map((l) => base44.entities.ActionLog.delete(l.id)),
      ...badges.map((b) => base44.entities.Badge.delete(b.id)),
    ]);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});