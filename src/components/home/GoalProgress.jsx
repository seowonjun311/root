import React, { useState, useRef, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Pencil, Trash2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
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
      className="absolute top-full left-0 right-0 mt-2 z-50 bg-card border border-border/70 rounded-2xl shadow-xl p-4"
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
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Goal.update(goal.id, { title: editTitle, duration_days: editDuration });
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    toast.success('목표가 수정되었습니다.');
    setShowEdit(false);
    setSaving(false);
  };

  const handleDelete = async () => {
    await base44.entities.Goal.delete(goal.id);
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    toast.success('목표가 삭제되었습니다.');
    setShowDelete(false);
  };

  return (
    <>
      <div className="mx-4 p-4 rounded-2xl bg-card border border-border/60 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚔️</span>
            <span className="text-sm font-semibold text-foreground">{goal.title}</span>
          </div>
          <button
            onClick={() => setShowMenu(true)}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Progress value={progressPercent} className="flex-1 h-2.5 bg-secondary" />
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            {elapsedDays}/{totalDays}일
          </span>
        </div>

        {goal.target_value && (
          <p className="text-xs text-muted-foreground mt-2">
            {totalDays}일 동안 {goal.target_value}{goal.target_unit || ''} 목표
          </p>
        )}
      </div>

      {/* 액션 메뉴 */}
      <Dialog open={showMenu} onOpenChange={setShowMenu}>
        <DialogContent className="max-w-xs rounded-2xl p-4">
          <DialogHeader>
            <DialogTitle className="text-center text-base">목표 관리</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-1">
            <button
              onClick={handleEditOpen}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
            >
              <Pencil className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold">목표 수정</span>
            </button>
            <button
              onClick={handleDeleteOpen}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors text-left"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold text-red-500">목표 삭제</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 수정 다이얼로그 */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">✏️ 목표 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
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
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEdit(false)} className="flex-1 rounded-xl">취소</Button>
            <Button
              onClick={handleSave}
              disabled={!editTitle.trim() || saving}
              className="flex-1 rounded-xl bg-amber-700 hover:bg-amber-800 text-amber-50"
            >
              {saving ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">목표를 삭제할까요?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-center">
            "{goal.title}" 목표와 관련 기록이 모두 삭제됩니다.
          </p>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDelete(false)} className="flex-1 rounded-xl">취소</Button>
            <Button onClick={handleDelete} className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white">삭제</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}