import React, { useMemo, useState } from 'react';
import { CalendarDays, Flag, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const GUEST_STORAGE_KEY = 'root_guest_data';

function formatDate(value) {
  if (!value) return '-';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function toInputDate(value) {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function getSafeStartDate(goal) {
  const raw = goal?.start_date ? new Date(goal.start_date) : new Date();
  if (Number.isNaN(raw.getTime())) return new Date();

  raw.setHours(0, 0, 0, 0);
  return raw;
}

function calcDurationDaysFromTargetDate(startDateValue, targetDateValue) {
  const start = new Date(startDateValue);
  const target = new Date(targetDateValue);

  if (Number.isNaN(start.getTime()) || Number.isNaN(target.getTime())) return 1;

  start.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - start.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(1, diffDays);
}

function getGoalDateInfo(goal) {
  if (!goal?.start_date || !goal?.duration_days) {
    return {
      startDate: null,
      endDate: null,
      totalDays: 0,
      elapsedDays: 0,
      remainingDays: null,
      percent: 0,
      isComplete: false,
    };
  }

  const startDate = new Date(goal.start_date);
  if (Number.isNaN(startDate.getTime())) {
    return {
      startDate: null,
      endDate: null,
      totalDays: 0,
      elapsedDays: 0,
      remainingDays: null,
      percent: 0,
      isComplete: false,
    };
  }

  const totalDays = Number(goal.duration_days || 0);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + totalDays);

  const now = new Date();
  const elapsedMs = now.getTime() - startDate.getTime();
  const elapsedDays = Math.max(0, Math.ceil(elapsedMs / (1000 * 60 * 60 * 24)));
  const remainingMs = endDate.getTime() - now.getTime();
  const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
  const isComplete = now >= endDate;

  const percent =
    totalDays > 0 ? Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100))) : 0;

  return {
    startDate,
    endDate,
    totalDays,
    elapsedDays,
    remainingDays,
    percent: isComplete ? 100 : percent,
    isComplete,
  };
}

function getLogProgress(logs = [], goal) {
  if (!goal) {
    return {
      doneCount: 0,
      logPercent: 0,
    };
  }

  const doneCount = logs.filter((log) => log?.completed).length;

  if (!goal?.duration_days || goal.duration_days <= 0) {
    return {
      doneCount,
      logPercent: 0,
    };
  }

  const roughPercent = Math.min(100, Math.round((doneCount / goal.duration_days) * 100));

  return {
    doneCount,
    logPercent: roughPercent,
  };
}

function loadGuestData() {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveGuestData(data) {
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(data));
}

function updateGuestGoal(goalId, updateData) {
  const current = loadGuestData();

  const nextGoals = (current.goals || []).map((goal) =>
    goal.id === goalId ? { ...goal, ...updateData } : goal
  );

  saveGuestData({
    ...current,
    goals: nextGoals,
  });

  window.dispatchEvent(new Event('root-home-data-updated'));
}

function deleteGuestGoal(goalId) {
  const current = loadGuestData();

  saveGuestData({
    ...current,
    goals: (current.goals || []).filter((goal) => goal.id !== goalId),
    actionGoals: (current.actionGoals || []).filter((actionGoal) => actionGoal.goal_id !== goalId),
    actionLogs: (current.actionLogs || []).filter((log) => log.goal_id !== goalId),
  });

  window.dispatchEvent(new Event('root-home-data-updated'));
}

export default function GoalProgress({ goal, logs = [] }) {
  const queryClient = useQueryClient();

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [editTitle, setEditTitle] = useState(goal?.title || goal?.goal_title || '');
  const [editDuration, setEditDuration] = useState(Number(goal?.duration_days || 28));

  const dateInfo = useMemo(() => getGoalDateInfo(goal), [goal]);
  const logInfo = useMemo(() => getLogProgress(logs, goal), [logs, goal]);

  const initialTargetDate = useMemo(() => {
    if (dateInfo.endDate) return toInputDate(dateInfo.endDate);
    const fallback = new Date(getSafeStartDate(goal));
    fallback.setDate(fallback.getDate() + Number(goal?.duration_days || 28));
    return toInputDate(fallback);
  }, [dateInfo.endDate, goal]);

  const [editTargetDate, setEditTargetDate] = useState(initialTargetDate);

  const isGuest = String(goal?.id || '').startsWith('local_');
  const isStudyGoal = goal?.category === 'study';

  const updateMutation = useMutation({
    mutationFn: (updateData) => base44.entities.Goal.update(goal.id, updateData),
    onSuccess: async () => {
      toast.success('결과목표가 수정되었습니다.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['goals'] }),
        queryClient.invalidateQueries({ queryKey: ['allLogs'] }),
      ]);
      setShowEdit(false);
    },
    onError: () => {
      toast.error('결과목표 수정에 실패했습니다.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Goal.delete(goal.id),
    onSuccess: async () => {
      toast.success('결과목표가 삭제되었습니다.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['goals'] }),
        queryClient.invalidateQueries({ queryKey: ['actionGoals'] }),
        queryClient.invalidateQueries({ queryKey: ['allLogs'] }),
      ]);
      setShowDelete(false);
    },
    onError: () => {
      toast.error('결과목표 삭제에 실패했습니다.');
    },
  });

  if (!goal) return null;

  const title = goal.title || goal.goal_title || '결과 목표';
  const displayPercent = Math.max(dateInfo.percent, logInfo.logPercent);

  const handleOpenEdit = () => {
    setEditTitle(goal.title || goal.goal_title || '');
    setEditDuration(Number(goal.duration_days || 28));

    const safeStart = getSafeStartDate(goal);
    const target = new Date(safeStart);
    target.setDate(safeStart.getDate() + Number(goal.duration_days || 28));
    setEditTargetDate(toInputDate(target));

    setShowEdit(true);
  };

  const handleSave = () => {
    const safeTitle = editTitle.trim();

    if (!safeTitle) {
      toast.error('결과목표 이름을 입력해 주세요.');
      return;
    }

    let safeDuration = Math.max(1, Number(editDuration) || 1);

    if (isStudyGoal) {
      if (!editTargetDate) {
        toast.error('공부 목표의 D-day를 선택해 주세요.');
        return;
      }

      safeDuration = calcDurationDaysFromTargetDate(getSafeStartDate(goal), editTargetDate);
    }

    const updateData = {
      title: safeTitle,
      duration_days: safeDuration,
    };

    if (isGuest) {
      updateGuestGoal(goal.id, updateData);
      toast.success('결과목표가 수정되었습니다.');
      setShowEdit(false);
      return;
    }

    updateMutation.mutate(updateData);
  };

  const handleDelete = () => {
    if (isGuest) {
      deleteGuestGoal(goal.id);
      toast.success('결과목표가 삭제되었습니다.');
      setShowDelete(false);
      return;
    }

    deleteMutation.mutate();
  };

  return (
    <>
      <div
        className="rounded-3xl px-4 py-2"
        style={{
          background: 'linear-gradient(135deg, #fff5de 0%, #f6e7bf 58%, #f0deb0 100%)',
          border: '1.5px solid #d8b978',
          boxShadow: '0 6px 16px rgba(84, 55, 14, 0.12)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-9 px-3 rounded-full text-[12px] font-bold flex items-center shrink-0"
            style={{
              background: 'rgba(139, 90, 32, 0.12)',
              color: '#7a5020',
              border: '1px solid rgba(139, 90, 32, 0.15)',
            }}
          >
            <Flag className="w-3.5 h-3.5 mr-1.5" />
            결과목표
          </div>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <div
              className="h-9 min-w-[84px] rounded-2xl px-3 flex flex-col items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.52)',
                border: '1px solid rgba(139, 90, 32, 0.14)',
              }}
            >
              <div className="text-[10px] font-semibold leading-none" style={{ color: '#9a7b47' }}>
                진행률
              </div>
              <div className="text-[15px] font-extrabold mt-1 leading-none" style={{ color: '#7a5020' }}>
                {displayPercent}%
              </div>
            </div>

            <button
              onClick={handleOpenEdit}
              className="h-9 w-9 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.52)',
                border: '1px solid rgba(139, 90, 32, 0.14)',
                color: '#7a5020',
              }}
              aria-label="결과목표 수정"
            >
              <Pencil className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowDelete(true)}
              className="h-9 w-9 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.52)',
                border: '1px solid rgba(139, 90, 32, 0.14)',
                color: '#b9483d',
              }}
              aria-label="결과목표 삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <h2
          className="mt-2 text-[17px] leading-snug font-extrabold break-words"
          style={{ color: '#3d2408' }}
        >
          {title}
        </h2>

        <div className="mt-4 flex items-center gap-3">
          <div
            className="h-3 w-1/2 min-w-[130px] max-w-[220px] rounded-full overflow-hidden"
            style={{ background: 'rgba(122, 80, 32, 0.14)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${displayPercent}%`,
                background: 'linear-gradient(90deg, #8b5a20 0%, #cb8d2a 55%, #e7bb55 100%)',
              }}
            />
          </div>

          <div
            className="text-[13px] font-bold whitespace-nowrap"
            style={{ color: '#7a5020' }}
          >
            총 {logInfo.doneCount}회 수행
          </div>
        </div>

        <div
          className="mt-4 rounded-2xl px-3 py-2 flex items-center gap-2 flex-wrap"
          style={{
            background: 'rgba(255,255,255,0.45)',
            border: '1px solid rgba(139, 90, 32, 0.12)',
          }}
        >
          <CalendarDays className="w-4 h-4 shrink-0" style={{ color: '#8b5a20' }} />
          <div className="text-[13px] font-semibold" style={{ color: '#7a5020' }}>
            언제까지 {formatDate(dateInfo.endDate)}
          </div>
          <div className="text-[13px] font-extrabold" style={{ color: '#4d2f0f' }}>
            · {dateInfo.isComplete ? '기간 종료' : `${dateInfo.remainingDays}일 남음`}
          </div>
        </div>
      </div>

      <Drawer open={showEdit} onOpenChange={setShowEdit}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle>결과목표 수정</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 space-y-4 pb-6">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#7a5020' }}>
                결과목표 이름
              </label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-11 rounded-xl"
                placeholder="예: 5kg 감량, 토익 900점, 금연 30일"
              />
            </div>

            {isStudyGoal ? (
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#7a5020' }}>
                  공부 목표 D-day
                </label>

                <input
                  type="date"
                  value={editTargetDate}
                  onChange={(e) => setEditTargetDate(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  data-vaul-no-drag
                  className="w-full h-11 rounded-xl border px-3 text-sm cursor-pointer"
                  style={{ borderColor: '#e1c98f', background: '#fff', color: '#4a2c08' }}
                />

                <p className="text-xs mt-1.5" style={{ color: '#9a7b47' }}>
                  시작일 기준으로 D-day까지의 기간이 자동 계산돼요.
                </p>
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#7a5020' }}>
                  도전 기간
                </label>

                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[7, 14, 21, 28].map((day) => (
                    <button
                      key={day}
                      onClick={() => setEditDuration(day)}
                      className="py-2 rounded-xl text-sm font-semibold"
                      style={
                        Number(editDuration) === day
                          ? { background: '#8b5a20', color: '#fff' }
                          : { background: '#f3ead7', color: '#7a5020' }
                      }
                    >
                      {day}일
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={editDuration}
                    onChange={(e) => setEditDuration(Number(e.target.value))}
                    className="flex-1 h-10 rounded-xl border px-3 text-sm"
                    style={{ borderColor: '#e1c98f' }}
                  />
                  <span className="text-sm font-semibold" style={{ color: '#7a5020' }}>
                    일
                  </span>
                </div>
              </div>
            )}
          </div>

          <DrawerFooter className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowEdit(false)}
              className="flex-1 rounded-xl"
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={!editTitle.trim() || updateMutation.isPending}
              className="flex-1 rounded-xl"
              style={{ background: '#8b5a20', color: '#fff' }}
            >
              {updateMutation.isPending ? '저장 중...' : '저장'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={showDelete} onOpenChange={setShowDelete}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle>결과목표를 삭제할까요?</DrawerTitle>
          </DrawerHeader>

          <p className="px-4 text-sm text-center text-muted-foreground">
            "{title}" 결과목표와 연결된 행동목표/기록도 함께 정리될 수 있어요.
          </p>

          <DrawerFooter className="flex gap-2 pt-6">
            <Button
              variant="outline"
              onClick={() => setShowDelete(false)}
              className="flex-1 rounded-xl"
            >
              취소
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}