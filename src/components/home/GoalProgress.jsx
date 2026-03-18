import React, { useState, useRef, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Pencil, Trash2, X } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

function getMonthDates(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const days = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
  return days;
}

function MonthCalendar({ logs, onClose }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const todayStr = today.toISOString().split('T')[0];
  const doneDates = new Set(logs.map(l => l.date));
  const days = getMonthDates(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className="absolute top-full left-0 right-0 mt-2 z-50 rounded-lg shadow-xl p-4"
      style={{
        background: 'linear-gradient(135deg, #f5e6c8 0%, #eedcb0 60%, #e8d4a0 100%)',
        border: '2px solid #a07840',
        boxShadow: '0 4px 16px rgba(80,50,10,0.3)',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground text-sm">‹</button>
        <p className="text-xs font-bold text-amber-800">{viewYear}년 {viewMonth + 1}월</p>
        <div className="flex items-center gap-1">
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground text-sm">›</button>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors ml-1">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-0.5">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isDone = doneDates.has(dateStr);
          const isToday = dateStr === todayStr;
          const isFuture = dateStr > todayStr;

          return (
            <div key={dateStr} className={`aspect-square rounded-lg flex items-center justify-center text-[11px] font-semibold transition-all ${
              isDone
                ? 'bg-amber-500 text-white shadow-sm'
                : isToday
                ? 'bg-amber-100 border-2 border-amber-400 text-amber-800'
                : isFuture
                ? 'text-muted-foreground/30'
                : 'bg-secondary/60 text-muted-foreground/50'
            }`}>
              {isDone ? '✓' : day}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/40">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span className="text-[10px] text-muted-foreground">완료</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-secondary/60" />
          <span className="text-[10px] text-muted-foreground">미완료</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function GoalProgress({ goal, logs = [] }) {
  const queryClient = useQueryClient();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!showCalendar) return;
    const handler = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) setShowCalendar(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCalendar]);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editTitle, setEditTitle] = useState(goal?.title || '');
  const [editDuration, setEditDuration] = useState(goal?.duration_days || 56);
  const [editCustomWeeks, setEditCustomWeeks] = useState('');
  const [isEditCustom, setIsEditCustom] = useState(false);

  if (!goal) return null;

  const startDate = new Date(goal.start_date || goal.created_date);
  const totalDays = goal.duration_days || 90;
  const elapsedDays = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const progressPercent = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

  const handleEditOpen = () => {
    setEditTitle(goal.title);
    setEditDuration(goal.duration_days || 90);
    setShowMenu(false);
    setShowEdit(true);
  };

  const handleDeleteOpen = () => {
    setShowMenu(false);
    setShowDelete(true);
  };

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Goal.update(goal.id, data),
    onMutate: async (updateData) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      const previous = queryClient.getQueryData(['goals']);
      queryClient.setQueryData(['goals'], (old = []) =>
        old.map(g => g.id === goal.id ? { ...g, ...updateData } : g)
      );
      return { previous };
    },
    onError: (err, vars, context) => {
      if (context?.previous) queryClient.setQueryData(['goals'], context.previous);
      toast.error('수정에 실패했습니다.');
    },
    onSuccess: () => {
      toast.success('목표가 수정되었습니다.');
      setShowEdit(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Goal.delete(goal.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      const previous = queryClient.getQueryData(['goals']);
      queryClient.setQueryData(['goals'], (old = []) =>
        old.filter(g => g.id !== goal.id)
      );
      return { previous };
    },
    onError: (err, vars, context) => {
      if (context?.previous) queryClient.setQueryData(['goals'], context.previous);
      toast.error('삭제에 실패했습니다.');
    },
    onSuccess: () => {
      toast.success('목표가 삭제되었습니다.');
      setShowDelete(false);
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ title: editTitle, duration_days: editDuration });
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <>
      <div ref={cardRef} className="mx-4 relative">
        <div
          className="cursor-pointer rounded-lg overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #f5e6c8 0%, #eedcb0 40%, #e8d4a0 70%, #f0e0bc 100%)',
            border: '2px solid #a07840',
            boxShadow: 'inset 0 1px 3px rgba(255,240,180,0.6), 0 3px 8px rgba(80,50,10,0.25)',
          }}
          onClick={() => setShowCalendar(v => !v)}
          aria-label={`${goal.title} 진행 현황 (${elapsedDays}/${totalDays}일)`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowCalendar(v => !v);
            }
          }}
        >
          {/* 상단 배너 */}
          <div className="py-2 px-4 flex items-center justify-between" style={{
            background: 'linear-gradient(90deg, #b08030 0%, #d4a850 50%, #b08030 100%)',
            borderBottom: '1px solid #8a6020',
          }}>
            <div className="flex items-center gap-2">
              <span className="text-sm">⚔️</span>
              <span className="text-sm font-bold" style={{ color: '#fff8e8', textShadow: '0 1px 2px rgba(60,30,5,0.5)' }}>{goal.title}</span>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setShowMenu(true); }}
              className="p-1.5 rounded transition-colors"
              style={{ color: '#fff8e8' }}
              aria-label={`${goal.title} 목표 수정`}
            >
              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* 진행도 */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              {/* 커스텀 프로그레스 바 */}
              <div className="flex-1 h-3 rounded-full overflow-hidden" style={{
                background: 'rgba(120,80,20,0.2)',
                border: '1px solid rgba(120,80,20,0.3)',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
              }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPercent}%`,
                    background: 'linear-gradient(90deg, #8a6020 0%, #c49a4a 50%, #e8c060 100%)',
                    boxShadow: 'inset 0 1px 2px rgba(255,220,120,0.5)',
                  }}
                />
              </div>
              <span className="text-xs font-bold whitespace-nowrap" style={{ color: '#6a3c10' }}>
                {elapsedDays}/{totalDays}일
              </span>
            </div>
            {goal.target_value && (
              <p className="text-xs mt-1.5" style={{ color: '#7a5030' }}>
                {totalDays}일 동안 {goal.target_value}{goal.target_unit || ''} 목표
              </p>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showCalendar && (
            <MonthCalendar
              logs={logs}
              onClose={() => setShowCalendar(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* 액션 메뉴 */}
      <Drawer open={showMenu} onOpenChange={setShowMenu}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle>목표 관리</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 space-y-2 pb-6">
            <button
              onClick={handleEditOpen}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
              aria-label="목표 정보 수정"
            >
              <Pencil className="w-4 h-4 text-amber-600" aria-hidden="true" />
              <span className="text-sm font-semibold">목표 수정</span>
            </button>
            <button
              onClick={handleDeleteOpen}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors text-left"
              aria-label="목표 영구 삭제"
            >
              <Trash2 className="w-4 h-4 text-red-500" aria-hidden="true" />
              <span className="text-sm font-semibold text-red-500">목표 삭제</span>
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* 수정 드로워 */}
      <Drawer open={showEdit} onOpenChange={setShowEdit}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle>✏️ 목표 수정</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 space-y-4 pb-6">
            <div>
              <label className="text-xs font-semibold text-amber-800 mb-1.5 block">결과 목표</label>
              <Input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-amber-800 mb-1.5 block">기간</label>
              <div className="flex gap-2 mb-2">
                {[{ label: '4주', weeks: 4 }, { label: '8주', weeks: 8 }, { label: '12주', weeks: 12 }].map(({ label, weeks }) => (
                  <button key={weeks} onClick={() => { setEditDuration(weeks * 7); setIsEditCustom(false); setEditCustomWeeks(''); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      !isEditCustom && editDuration === weeks * 7 ? 'bg-amber-700 text-amber-50' : 'bg-secondary text-secondary-foreground'}`}>
                    {label}
                  </button>
                ))}
                <button onClick={() => setIsEditCustom(true)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isEditCustom ? 'bg-amber-700 text-amber-50' : 'bg-secondary text-secondary-foreground'}`}>
                  직접
                </button>
              </div>
              {isEditCustom && (
                <div className="flex items-center gap-2">
                  <input type="number" min="1" max="52" value={editCustomWeeks}
                    onChange={e => { setEditCustomWeeks(e.target.value); setEditDuration(Number(e.target.value) * 7); }}
                    placeholder="주 수 입력"
                    className="flex-1 h-10 rounded-xl border border-input bg-white/80 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  />
                  <span className="text-sm font-semibold text-muted-foreground">주</span>
                </div>
              )}
            </div>
          </div>
          <DrawerFooter className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowEdit(false)} className="flex-1 rounded-xl">취소</Button>
            <Button
              onClick={handleSave}
              disabled={!editTitle.trim() || updateMutation.isPending}
              className="flex-1 rounded-xl bg-amber-700 hover:bg-amber-800 text-amber-50"
            >
              {updateMutation.isPending ? '저장 중...' : '저장'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* 삭제 확인 드로워 */}
      <Drawer open={showDelete} onOpenChange={setShowDelete}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle>목표를 삭제할까요?</DrawerTitle>
          </DrawerHeader>
          <p className="px-4 text-sm text-muted-foreground text-center">
            "{goal.title}" 목표와 관련 기록이 모두 삭제됩니다.
          </p>
          <DrawerFooter className="flex gap-2 pt-6">
            <Button variant="outline" onClick={() => setShowDelete(false)} className="flex-1 rounded-xl">취소</Button>
            <Button onClick={handleDelete} disabled={deleteMutation.isPending} className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white">{deleteMutation.isPending ? '삭제 중...' : '삭제'}</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}