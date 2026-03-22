import React, { useMemo, useState } from 'react';
import { CalendarDays, Flag, Target, Pencil } from 'lucide-react';
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

const CATEGORY_LABELS = {
  exercise: '운동',
  study: '공부',
  mental: '정신',
  daily: '일상',
};

const GUEST_STORAGE_KEY = 'root_guest_data';

function formatDate(dateString) {
  if (!dateString) return '-';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate()
  ).padStart(2, '0')}`;
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

export default function GoalProgress({ goal, logs = [] }) {
  const queryClient = useQueryClient();

  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState(goal?.title || goal?.goal_title || '');
  const [editDuration, setEditDuration] = useState(Number(goal?.duration_days || 28));

  const dateInfo = useMemo(() => getGoalDateInfo(goal), [goal]);
  const logInfo = useMemo(() => getLogProgress(logs, goal), [logs, goal]);

  if (!goal) return null;

  const isGuest = String(goal?.id || '').startsWith('local_');

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

  const categoryLabel = CATEGORY_LABELS[goal.category] || '목표';
  const title = goal.title || goal.goal_title || '결과 목표';
  const displayPercent = Math.max(dateInfo.percent, logInfo.logPercent);

  const handleOpenEdit = () => {
    setEditTitle(goal.title || goal.goal_title || '');
    setEditDuration(Number(goal.duration_days || 28));
    setShowEdit(true);
  };

  const handleSave = () => {
    const safeTitle = editTitle.trim();
    const safeDuration = Math.max(1, Number(editDuration) || 1);

    if (!safeTitle) {
      toast.error('결과목표 이름을 입력해 주세요.');
      return;
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

  return (
    <>
      <div
        className="rounded-3xl px-4 py-4"
        style={{
          background: 'linear-gradient(135deg, #fff5de 0%, #f6e7bf 58%, #f0deb0 100%)',
          border: '1.5px solid #d8b978',
          boxShadow: '0 6px 16px rgba(84, 55, 14, 0.12)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div
                className="h-7 px-2.5 rounded-full text-[11px] font-bold flex items-center"
                style={{
                  background: 'rgba(139, 90, 32, 0.12)',
                  color: '#7a5020',
                  border: '1px solid rgba(139, 90, 32, 0.15)',
                }}
              >
                <Flag className="w-3.5 h-3.5 mr-1" />
                결과목표
              </div>

              <div
                className="h-7 px-2.5 rounded-full text-[11px] font-bold flex items-center"
                style={{
                  background: 'rgba(210, 155, 56, 0.16)',
                  color: '#8a5a17',
                  border: '1px solid rgba(210, 155, 56, 0.18)',
                }}
              >
                {categoryLabel}
              </div>
            </div>

            <h2
              className="text-[17px] leading-snug font-bold break-words"
              style={{ color: '#3d2408' }}
            >
              {title}
            </h2>
          </div>

          <div className="shrink-0 flex items-start gap-2">
            <div
              className="rounded-2xl px-3 py-2 text-center min-w-[72px]"
              style={{
                background: 'rgba(255,255,255,0.52)',
                border: '1px solid rgba(139, 90, 32, 0.14)',
              }}
            >
              <div className="text-[10px] font-semibold mb-0.5" style={{ color: '#9a7b47' }}>
                진행률
              </div>
              <div className="text-base font-extrabold" style={{ color: '#7a5020' }}>
                {displayPercent}%
              </div>
            </div>

            <button
              onClick={handleOpenEdit}
              className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: 'rgba(255,255,255,0.52)',
                border: '1px solid rgba(139, 90, 32, 0.14)',
                color: '#7a5020',
              }}
              aria-label="결과목표 수정"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div
            className="h-3 rounded-full overflow-hidden"
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
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2">
          <div
            className="rounded-2xl px-3 py-3 flex items-center gap-3"
            style={{
              background: 'rgba(255,255,255,0.45)',
              border: '1px solid rgba(139, 90, 32, 0.12)',
            }}
          >
            <CalendarDays className="w-4 h-4 shrink-0" style={{ color: '#8b5a20' }} />
            <div className="min-w-0">
              <div className="text-[11px] font-semibold" style={{ color: '#9a7b47' }}>
                도전 기간
              </div>
              <div className="text-sm font-bold" style={{ color: '#4d2f0f' }}>
                {formatDate(goal.start_date)} ~ {formatDate(dateInfo.endDate)}
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl px-3 py-3 flex items-center gap-3"
            style={{
              background: 'rgba(255,255,255,0.45)',
              border: '1px solid rgba(139, 90, 32, 0.12)',
            }}
          >
            <Target className="w-4 h-4 shrink-0" style={{ color: '#8b5a20' }} />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold" style={{ color: '#9a7b47' }}>
                현재 상태
              </div>

              {dateInfo.isComplete ? (
                <div className="text-sm font-bold" style={{ color: '#4d2f0f' }}>
                  도전 기간이 종료되었어요
                </div>
              ) : (
                <div className="text-sm font-bold" style={{ color: '#4d2f0f' }}>
                  {dateInfo.remainingDays}일 남음 · {logInfo.doneCount}회 기록
                </div>
              )}
            </div>
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
    </>
  );
}
