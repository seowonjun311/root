import React, { useState, useEffect, useRef } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Square, Check, X, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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

function MonthCalendar({ weeklyLogs, onClose }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const todayStr = today.toISOString().split('T')[0];
  const doneDates = new Set(weeklyLogs.map(l => l.date));
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

const TIMER_KEY = (id) => `timer_start_${id}`;

export default function ActionGoalCard({ actionGoal, weeklyLogs = [], onComplete }) {
  const queryClient = useQueryClient();
  const [elapsed, setElapsed] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editTitle, setEditTitle] = useState(actionGoal.title || '');
  const [editFrequency, setEditFrequency] = useState(actionGoal.weekly_frequency || 5);
  const [editMinutes, setEditMinutes] = useState(actionGoal.duration_minutes || 30);
  const [saving, setSaving] = useState(false);

  const intervalRef = useRef(null);
  const cardRef = useRef(null);

  const weeklyCount = weeklyLogs.length;
  const targetFreq = actionGoal.weekly_frequency || 7;
  const progressPercent = Math.min(100, Math.round((weeklyCount / targetFreq) * 100));

  const todayStr = new Date().toISOString().split('T')[0];
  const doneToday = weeklyLogs.some(l => l.date === todayStr);

  // localStorage 기반으로 시작 시각을 저장 → 화면 이탈/복귀 후에도 경과 시간 유지
  const [isRunning, setIsRunning] = useState(() => !!localStorage.getItem(TIMER_KEY(actionGoal.id)));

  useEffect(() => {
    if (!isRunning) {
      setElapsed(0);
      clearInterval(intervalRef.current);
      return;
    }
    const tick = () => {
      const start = parseInt(localStorage.getItem(TIMER_KEY(actionGoal.id)) || '0', 10);
      setElapsed(Math.floor((Date.now() - start) / 1000));
    };
    tick(); // 즉시 한 번 계산
    intervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning, actionGoal.id]);

  useEffect(() => {
    if (!showCalendar) return;
    const handler = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) setShowCalendar(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCalendar]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleTimerToggle = () => {
    if (isRunning) {
      const start = parseInt(localStorage.getItem(TIMER_KEY(actionGoal.id)) || '0', 10);
      const totalElapsed = Math.floor((Date.now() - start) / 1000);
      localStorage.removeItem(TIMER_KEY(actionGoal.id));
      clearInterval(intervalRef.current);
      setElapsed(0);
      const minutes = Math.round(totalElapsed / 60);
      if (minutes > 0 || totalElapsed > 30) onComplete(actionGoal, Math.max(1, minutes));
    } else {
      localStorage.setItem(TIMER_KEY(actionGoal.id), String(Date.now()));
    }
  };

  const handleConfirm = () => onComplete(actionGoal, actionGoal.duration_minutes || 0);

  const handleEditOpen = () => {
    setEditTitle(actionGoal.title);
    setEditFrequency(actionGoal.weekly_frequency || 5);
    setEditMinutes(actionGoal.duration_minutes || 30);
    setShowMenu(false);
    setShowEdit(true);
  };

  const handleDeleteOpen = () => {
    setShowMenu(false);
    setShowDelete(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const updateData = { title: editTitle, weekly_frequency: editFrequency };
    if (actionGoal.action_type === 'timer') updateData.duration_minutes = editMinutes;
    await base44.entities.ActionGoal.update(actionGoal.id, updateData);
    queryClient.invalidateQueries({ queryKey: ['actionGoals'] });
    toast.success('행동 목표가 수정되었습니다.');
    setShowEdit(false);
    setSaving(false);
  };

  const handleDelete = async () => {
    await base44.entities.ActionGoal.delete(actionGoal.id);
    queryClient.invalidateQueries({ queryKey: ['actionGoals'] });
    toast.success('행동 목표가 삭제되었습니다.');
    setShowDelete(false);
  };

  const typeEmoji = actionGoal.action_type === 'timer' ? '⏱️' : actionGoal.action_type === 'abstain' ? '🚫' : '✅';
  const typeLabel = actionGoal.action_type === 'timer'
    ? (actionGoal.duration_minutes ? `${actionGoal.duration_minutes}분` : '')
    : '';

  return (
    <>
      <div ref={cardRef} className="mx-4 relative">
        <div className="rounded-lg overflow-hidden" style={{
          background: 'linear-gradient(135deg, #f5e6c8 0%, #eedcb0 50%, #f0e0bc 100%)',
          border: '2px solid #a07840',
          boxShadow: 'inset 0 1px 3px rgba(255,240,180,0.6), 0 3px 8px rgba(80,50,10,0.2)',
        }}>
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center justify-between mb-2.5">
              <button
                onClick={() => setShowCalendar(v => !v)}
                className="flex items-center gap-2 flex-1 min-w-0 text-left"
              >
                <span className="text-base">{typeEmoji}</span>
                <span className="font-bold text-sm truncate" style={{ color: '#4a2c08' }}>{actionGoal.title}</span>
                {typeLabel && <span className="text-xs ml-1" style={{ color: '#7a5030' }}>{typeLabel}</span>}
                <span className="text-xs font-bold ml-1 shrink-0" style={{ color: '#8a6020' }}>
                  {weeklyCount}/{targetFreq}
                </span>
              </button>

              <div className="flex items-center gap-1.5 ml-2">
                {actionGoal.action_type === 'timer' ? (
                  doneToday && !isRunning ? (
                    <span className="h-8 px-3 text-xs font-bold rounded-md flex items-center gap-1" style={{
                      background: 'rgba(120,80,20,0.15)',
                      border: '2px solid rgba(120,80,20,0.25)',
                      color: '#a07840',
                    }}>✓ 완료</span>
                  ) : (
                    <button
                      className="h-8 px-3 text-xs font-bold rounded-md transition-all active:scale-95"
                      style={isRunning ? {
                        background: 'linear-gradient(180deg, #c0392b 0%, #962d22 100%)',
                        border: '2px solid #7a1f16',
                        boxShadow: 'inset 0 1px 2px rgba(255,150,120,0.3), 0 2px 4px rgba(60,10,5,0.4)',
                        color: '#ffe8e8',
                        textShadow: '0 1px 2px rgba(80,10,5,0.5)',
                      } : {
                        background: 'linear-gradient(180deg, #c49a4a 0%, #a07830 50%, #8a6520 100%)',
                        border: '2px solid #6b4e15',
                        boxShadow: 'inset 0 1px 2px rgba(255,220,120,0.4), 0 2px 4px rgba(60,35,5,0.4)',
                        color: '#fff8e8',
                        textShadow: '0 1px 2px rgba(60,30,5,0.5)',
                      }}
                      onClick={handleTimerToggle}
                    >
                      {isRunning ? (
                        <span className="flex items-center gap-1"><Square className="w-3 h-3" />{formatTime(elapsed)}</span>
                      ) : (
                        <span className="flex items-center gap-1"><Play className="w-3 h-3" />시작</span>
                      )}
                    </button>
                  )
                ) : doneToday ? (
                  <span className="h-8 px-3 text-xs font-bold rounded-md flex items-center gap-1" style={{
                    background: 'rgba(120,80,20,0.15)',
                    border: '2px solid rgba(120,80,20,0.25)',
                    color: '#a07840',
                  }}>✓ 완료</span>
                ) : (
                  <button
                    className="h-8 px-3 text-xs font-bold rounded-md transition-all active:scale-95"
                    style={{
                      background: 'linear-gradient(180deg, #c49a4a 0%, #a07830 50%, #8a6520 100%)',
                      border: '2px solid #6b4e15',
                      boxShadow: 'inset 0 1px 2px rgba(255,220,120,0.4), 0 2px 4px rgba(60,35,5,0.4)',
                      color: '#fff8e8',
                      textShadow: '0 1px 2px rgba(60,30,5,0.5)',
                    }}
                    onClick={handleConfirm}
                  >
                    <span className="flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {actionGoal.action_type === 'abstain' ? '성공' : '확인'}
                    </span>
                  </button>
                )}
                <button
                  onClick={() => setShowMenu(true)}
                  className="p-1.5 rounded transition-colors"
                  style={{ color: '#7a5030' }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 커스텀 프로그레스 바 */}
            <div className="h-2.5 rounded-full overflow-hidden" style={{
              background: 'rgba(120,80,20,0.2)',
              border: '1px solid rgba(120,80,20,0.25)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15)',
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
          </div>
        </div>

        <AnimatePresence>
          {showCalendar && (
            <MonthCalendar
              weeklyLogs={weeklyLogs}
              onClose={() => setShowCalendar(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* 액션 메뉴 */}
      <Dialog open={showMenu} onOpenChange={setShowMenu}>
        <DialogContent className="max-w-xs rounded-2xl p-4">
          <DialogHeader>
            <DialogTitle className="text-center text-base">행동 목표 관리</DialogTitle>
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
            <DialogTitle className="text-center">✏️ 행동 목표 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-amber-800 mb-1.5 block">행동 목표 이름</label>
              <Input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-amber-800 mb-1.5 block">주 횟수</label>
              <div className="grid grid-cols-7 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map(f => (
                  <button key={f} onClick={() => setEditFrequency(f)}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      editFrequency === f ? 'bg-amber-700 text-amber-50' : 'bg-secondary text-secondary-foreground'}`}>
                    {f}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">주 {editFrequency}회</p>
            </div>
            {actionGoal.action_type === 'timer' && (
              <div>
                <label className="text-xs font-semibold text-amber-800 mb-1.5 block">1회 시간</label>
                <div className="flex gap-2 mb-2">
                  {[20, 30, 60].map(m => (
                    <button key={m} onClick={() => setEditMinutes(m)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        editMinutes === m ? 'bg-amber-700 text-amber-50' : 'bg-secondary text-secondary-foreground'}`}>
                      {m}분
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="1" max="300"
                    value={editMinutes}
                    onChange={e => setEditMinutes(Number(e.target.value))}
                    className="flex-1 h-10 rounded-xl border border-input bg-white/80 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  />
                  <span className="text-sm font-semibold text-muted-foreground">분</span>
                </div>
              </div>
            )}
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
            <DialogTitle className="text-center">행동 목표를 삭제할까요?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-center">
            "{actionGoal.title}" 목표와 관련 기록이 모두 삭제됩니다.
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