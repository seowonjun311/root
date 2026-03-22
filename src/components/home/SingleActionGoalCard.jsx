import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Pencil, Trash2, CalendarDays, Flag, Clock3 } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const GUEST_STORAGE_KEY = 'root_guest_data';

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function getDDay(dateString) {
  if (!dateString) return null;

  const today = new Date();
  const target = new Date(dateString);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return 'D-Day';
  return `D+${Math.abs(diff)}`;
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

function updateGuestActionGoal(actionGoalId, updateData) {
  const current = loadGuestData();
  const nextActionGoals = (current.actionGoals || []).map((goal) =>
    goal.id === actionGoalId ? { ...goal, ...updateData } : goal
  );

  saveGuestData({
    ...current,
    actionGoals: nextActionGoals,
  });

  window.dispatchEvent(new Event('root-home-data-updated'));
}

function deleteGuestActionGoal(actionGoalId) {
  const current = loadGuestData();

  saveGuestData({
    ...current,
    actionGoals: (current.actionGoals || []).filter((goal) => goal.id !== actionGoalId),
    actionLogs: (current.actionLogs || []).filter((log) => log.action_goal_id !== actionGoalId),
  });

  window.dispatchEvent(new Event('root-home-data-updated'));
}

export default function SingleActionGoalCard({
  actionGoal,
  allLogs = [],
  onComplete,
}) {
  const queryClient = useQueryClient();

  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [editTitle, setEditTitle] = useState(actionGoal.title || '');
  const [editDate, setEditDate] = useState(actionGoal.scheduled_date || '');
  const [editActionType, setEditActionType] = useState(actionGoal.action_type || 'confirm');
  const [editMinutes, setEditMinutes] = useState(actionGoal.duration_minutes || 30);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const isGuest = !user;

  const done = useMemo(() => {
    return allLogs.some((log) => log?.action_goal_id === actionGoal.id && log?.completed);
  }, [allLogs, actionGoal.id]);

  const dDay = getDDay(actionGoal.scheduled_date);

  const typeLabel =
    actionGoal.action_type === 'timer'
      ? `${actionGoal.duration_minutes || 0}분`
      : actionGoal.action_type === 'abstain'
        ? '안하기형'
        : '확인형';

  const updateMutation = useMutation({
    mutationFn: (updateData) => base44.entities.ActionGoal.update(actionGoal.id, updateData),
    onSuccess: () => {
      toast.success('단발형 목표가 수정되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['actionGoals'] });
      setShowEdit(false);
    },
    onError: () => {
      toast.error('수정에 실패했습니다.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.ActionGoal.delete(actionGoal.id),
    onSuccess: () => {
      toast.success('단발형 목표가 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['actionGoals'] });
      setShowDelete(false);
    },
    onError: () => {
      toast.error('삭제에 실패했습니다.');
    },
  });

  const handleConfirm = () => {
    if (done) {
      toast.error('이미 완료한 단발형 목표예요.');
      return;
    }

    onComplete(actionGoal, actionGoal.duration_minutes || 0, { gpsEnabled: false });
  };

  const handleSave = () => {
    const updateData = {
      title: editTitle.trim(),
      scheduled_date: editDate,
      action_type: editActionType,
      duration_minutes: editActionType === 'timer' ? Math.max(1, Number(editMinutes) || 30) : 0,
    };

    if (!updateData.title) {
      toast.error('행동목표 이름을 입력해 주세요.');
      return;
    }

    if (!updateData.scheduled_date) {
      toast.error('예정일을 선택해 주세요.');
      return;
    }

    if (isGuest) {
      updateGuestActionGoal(actionGoal.id, updateData);
      toast.success('단발형 목표가 수정되었습니다.');
      setShowEdit(false);
      return;
    }

    updateMutation.mutate(updateData);
  };

  const handleDelete = () => {
    if (isGuest) {
      deleteGuestActionGoal(actionGoal.id);
      toast.success('단발형 목표가 삭제되었습니다.');
      setShowDelete(false);
      return;
    }

    deleteMutation.mutate();
  };

  return (
    <>
      <div
        className="rounded-2xl px-4 py-4"
        style={{
          background: 'linear-gradient(135deg, #f5e6c8 0%, #eedcb0 60%, #f0e0bc 100%)',
          border: '1.5px solid #d7b97b',
          boxShadow: '0 3px 8px rgba(80,50,10,0.12)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div
                className="h-7 px-2.5 rounded-full text-[11px] font-bold flex items-center"
                style={{
                  background: 'rgba(139,90,32,0.12)',
                  color: '#7a5020',
                  border: '1px solid rgba(139,90,32,0.15)',
                }}
              >
                <Flag className="w-3.5 h-3.5 mr-1" />
                단발형 퀘스트
              </div>

              <div
                className="h-7 px-2.5 rounded-full text-[11px] font-bold flex items-center"
                style={{
                  background: 'rgba(210,155,56,0.14)',
                  color: '#8a5a17',
                  border: '1px solid rgba(210,155,56,0.18)',
                }}
              >
                {typeLabel}
              </div>
            </div>

            <div className="text-base font-bold break-words" style={{ color: '#3d2408' }}>
              {actionGoal.title}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div
                className="rounded-xl px-3 py-2"
                style={{
                  background: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(139,90,32,0.12)',
                }}
              >
                <div className="text-[10px] font-semibold mb-1" style={{ color: '#9a7b47' }}>
                  예정일
                </div>
                <div className="text-sm font-bold flex items-center gap-1" style={{ color: '#4d2f0f' }}>
                  <CalendarDays className="w-3.5 h-3.5" />
                  {formatDate(actionGoal.scheduled_date)}
                </div>
              </div>

              <div
                className="rounded-xl px-3 py-2"
                style={{
                  background: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(139,90,32,0.12)',
                }}
              >
                <div className="text-[10px] font-semibold mb-1" style={{ color: '#9a7b47' }}>
                  상태
                </div>
                <div className="text-sm font-extrabold" style={{ color: done ? '#4ca86a' : '#7a5020' }}>
                  {done ? '완료됨' : dDay || '-'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            {done ? (
              <div
                className="h-9 px-3 rounded-xl text-[11px] font-bold flex items-center justify-center"
                style={{
                  background: 'rgba(76,168,106,0.12)',
                  color: '#3c8f58',
                  border: '1px solid rgba(76,168,106,0.18)',
                }}
              >
                완료
              </div>
            ) : (
              <button
                onClick={handleConfirm}
                className="h-9 px-3 rounded-xl text-[11px] font-bold flex items-center gap-1 justify-center"
                style={{
                  background: '#8b5a20',
                  color: '#fff',
                }}
              >
                <Check className="w-3.5 h-3.5" />
                완료하기
              </button>
            )}

            <button
              onClick={() => setShowMenu(true)}
              className="h-9 w-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(122,80,32,0.08)',
                color: '#7a5020',
              }}
              aria-label="단발형 목표 관리"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <Drawer open={showMenu} onOpenChange={setShowMenu}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle>단발형 목표 관리</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-6">
            <div className="space-y-2">
              <button
                onClick={() => {
                  setEditTitle(actionGoal.title || '');
                  setEditDate(actionGoal.scheduled_date || '');
                  setEditActionType(actionGoal.action_type || 'confirm');
                  setEditMinutes(actionGoal.duration_minutes || 30);
                  setShowMenu(false);
                  setShowEdit(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left"
              >
                <Pencil className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold">목표 수정</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowDelete(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span className="text-sm font-semibold text-red-500">목표 삭제</span>
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={showEdit} onOpenChange={setShowEdit}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle>단발형 목표 수정</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 space-y-4 pb-6">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#7a5020' }}>
                행동목표 이름
              </label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#7a5020' }}>
                예정일
              </label>
              <input
                type="date"
                value={editDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full h-11 rounded-xl border px-3 text-sm"
                style={{ borderColor: '#e1c98f' }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#7a5020' }}>
                목표 유형
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'confirm', label: '확인형' },
                  { value: 'timer', label: '시간형' },
                  { value: 'abstain', label: '안하기형' },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setEditActionType(item.value)}
                    className="py-2 rounded-xl text-sm font-semibold"
                    style={
                      editActionType === item.value
                        ? { background: '#8b5a20', color: '#fff' }
                        : { background: '#f3ead7', color: '#7a5020' }
                    }
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {editActionType === 'timer' && (
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#7a5020' }}>
                  1회 시간
                </label>

                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[20, 30, 60].map((m) => (
                    <button
                      key={m}
                      onClick={() => setEditMinutes(m)}
                      className="py-2 rounded-xl text-sm font-semibold"
                      style={
                        editMinutes === m
                          ? { background: '#8b5a20', color: '#fff' }
                          : { background: '#f3ead7', color: '#7a5020' }
                      }
                    >
                      {m}분
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={editMinutes}
                    onChange={(e) => setEditMinutes(Number(e.target.value))}
                    className="flex-1 h-10 rounded-xl border px-3 text-sm"
                    style={{ borderColor: '#e1c98f' }}
                  />
                  <span className="text-sm font-semibold" style={{ color: '#7a5020' }}>
                    분
                  </span>
                </div>
              </div>
            )}
          </div>

          <DrawerFooter className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowEdit(false)} className="flex-1 rounded-xl">
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
            <DrawerTitle>단발형 목표를 삭제할까요?</DrawerTitle>
          </DrawerHeader>

          <p className="px-4 text-sm text-center text-muted-foreground">
            "{actionGoal.title}" 목표와 관련 기록이 함께 삭제됩니다.
          </p>

          <DrawerFooter className="flex gap-2 pt-6">
            <Button variant="outline" onClick={() => setShowDelete(false)} className="flex-1 rounded-xl">
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
