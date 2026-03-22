import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Square, Check, X, Pencil, Trash2, ChevronDown, ChevronUp, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import WeekDays from './WeekDays';

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
const TIMER_KEY = (id) => `timer_start_${id}`;
const GPS_KEY = (id) => `gps_enabled_${id}`;
const GPS_COORDS_KEY = (id) => `gps_coords_${id}`;
const GUEST_STORAGE_KEY = 'root_guest_data';

function getMonthDates(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const days = [];

  for (let i = 0; i < startOffset; i += 1) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d += 1) days.push(d);

  return days;
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

function MonthCalendar({ logs = [], onClose }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const todayStr = today.toISOString().split('T')[0];
  const doneDates = new Set((logs || []).map((log) => log.date));
  const days = getMonthDates(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((prev) => prev - 1);
      setViewMonth(11);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((prev) => prev + 1);
      setViewMonth(0);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl p-4 shadow-xl"
      style={{
        background: '#fffaf0',
        border: '1px solid #e5d3a0',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="px-2 py-1 rounded-lg text-sm"
          style={{ color: '#7a5020' }}
        >
          ‹
        </button>

        <p className="text-sm font-bold" style={{ color: '#7a5020' }}>
          {viewYear}년 {viewMonth + 1}월
        </p>

        <div className="flex items-center gap-1">
          <button
            onClick={nextMonth}
            className="px-2 py-1 rounded-lg text-sm"
            style={{ color: '#7a5020' }}
          >
            ›
          </button>
          <button onClick={onClose} className="p-1 rounded-lg">
            <X className="w-4 h-4" style={{ color: '#7a5020' }} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-semibold py-1"
            style={{ color: '#9a7b47' }}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} />;

          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isDone = doneDates.has(dateStr);
          const isToday = dateStr === todayStr;
          const isFuture = dateStr > todayStr;

          return (
            <div
              key={dateStr}
              className="aspect-square rounded-lg flex items-center justify-center text-[11px] font-semibold"
              style={{
                background: isDone ? '#d29b38' : isToday ? '#fff1c7' : isFuture ? 'transparent' : '#f3ead7',
                border: isToday ? '2px solid #d29b38' : '1px solid transparent',
                color: isDone ? '#fff' : isFuture ? '#d0c4ad' : '#7a5020',
              }}
            >
              {isDone ? '✓' : day}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function ActionGoalCard({
  actionGoal,
  weeklyLogs = [],
  allLogs = [],
  onComplete,
}) {
  const queryClient = useQueryClient();

  const [elapsed, setElapsed] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showWeeklyDetail, setShowWeeklyDetail] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showGpsDialog, setShowGpsDialog] = useState(false);

  const [editTitle, setEditTitle] = useState(actionGoal.title || '');
  const [editFrequency, setEditFrequency] = useState(actionGoal.weekly_frequency || 5);
  const [editMinutes, setEditMinutes] = useState(actionGoal.duration_minutes || 30);

  const [gpsEnabled, setGpsEnabled] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(GPS_KEY(actionGoal.id)) || 'false');
    } catch {
      return false;
    }
  });

  const intervalRef = useRef(null);
  const cardRef = useRef(null);
  const watchIdRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const isGuest = !user;

  const weeklyCount = weeklyLogs.length;
  const targetFreq = actionGoal.weekly_frequency || 7;
  const progressPercent = Math.min(100, Math.round((weeklyCount / targetFreq) * 100));

  const todayStr = new Date().toISOString().split('T')[0];
  const doneToday = weeklyLogs.some((log) => log.date === todayStr);

  const detailLogs = Array.isArray(allLogs) && allLogs.length > 0 ? allLogs : weeklyLogs;

  const [isRunning, setIsRunning] = useState(() => !!localStorage.getItem(TIMER_KEY(actionGoal.id)));

  useEffect(() => {
    if (!isRunning) {
      setElapsed(0);
      clearInterval(intervalRef.current);
      return undefined;
    }

    const tick = () => {
      const start = parseInt(localStorage.getItem(TIMER_KEY(actionGoal.id)) || '0', 10);
      setElapsed(Math.floor((Date.now() - start) / 1000));
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, actionGoal.id]);

  useEffect(() => {
    localStorage.setItem(GPS_KEY(actionGoal.id), JSON.stringify(gpsEnabled));
  }, [gpsEnabled, actionGoal.id]);

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showCalendar) return undefined;

    const handler = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCalendar]);

  const updateMutation = useMutation({
    mutationFn: (updateData) => base44.entities.ActionGoal.update(actionGoal.id, updateData),
    onSuccess: () => {
      toast.success('행동 목표가 수정되었습니다.');
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
      toast.success('행동 목표가 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['actionGoals'] });
      setShowDelete(false);
    },
    onError: () => {
      toast.error('삭제에 실패했습니다.');
    },
  });

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remain = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remain).padStart(2, '0')}`;
  };

  const startGpsTracking = () => {
    if (actionGoal.category !== 'exercise') return;
    if (!('geolocation' in navigator)) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords = JSON.parse(localStorage.getItem(GPS_COORDS_KEY(actionGoal.id)) || '[]');
        coords.push([latitude, longitude]);
        localStorage.setItem(GPS_COORDS_KEY(actionGoal.id), JSON.stringify(coords));
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const stopGpsTracking = () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const calculateDistance = (coords) => {
    if (!coords || coords.length < 2) return 0;

    let distance = 0;

    for (let i = 1; i < coords.length; i += 1) {
      const [lat1, lng1] = coords[i - 1];
      const [lat2, lng2] = coords[i];
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distance += R * c;
    }

    return Math.round(distance * 100) / 100;
  };

  const handleTimerStart = (enableGps) => {
    localStorage.setItem(TIMER_KEY(actionGoal.id), String(Date.now()));
    setIsRunning(true);
    setGpsEnabled(enableGps);

    if (enableGps) {
      localStorage.setItem(GPS_COORDS_KEY(actionGoal.id), JSON.stringify([]));
      startGpsTracking();
    }

    setShowGpsDialog(false);
  };

  const handleTimerToggle = () => {
    if (doneToday && !isRunning) {
      toast.error('오늘 이미 완료했어요. 내일 다시 도전해 주세요! 💪');
      return;
    }

    if (isRunning) {
      const start = parseInt(localStorage.getItem(TIMER_KEY(actionGoal.id)) || '0', 10);
      const totalElapsed = Math.floor((Date.now() - start) / 1000);

      localStorage.removeItem(TIMER_KEY(actionGoal.id));
      clearInterval(intervalRef.current);
      setIsRunning(false);
      setElapsed(0);
      stopGpsTracking();

      const minutes = Math.round(totalElapsed / 60);

      if (minutes > 0 || totalElapsed > 30) {
        const coords = gpsEnabled
          ? JSON.parse(localStorage.getItem(GPS_COORDS_KEY(actionGoal.id)) || '[]')
          : [];
        const distance = gpsEnabled ? calculateDistance(coords) : null;

        localStorage.removeItem(GPS_COORDS_KEY(actionGoal.id));

        onComplete(actionGoal, Math.max(1, minutes), {
          gpsEnabled,
          distance,
          coords,
        });
      }
    } else if (actionGoal.category === 'exercise' && actionGoal.action_type === 'timer') {
      setShowGpsDialog(true);
    } else {
      handleTimerStart(false);
    }
  };

  const handleConfirm = () => {
    if (doneToday) {
      toast.error('오늘 이미 완료했어요. 내일 다시 도전해 주세요! 💪');
      return;
    }

    onComplete(actionGoal, actionGoal.duration_minutes || 0, { gpsEnabled: false });
  };

  const handleEditOpen = () => {
    setEditTitle(actionGoal.title || '');
    setEditFrequency(actionGoal.weekly_frequency || 5);
    setEditMinutes(actionGoal.duration_minutes || 30);
    setShowMenu(false);
    setShowEdit(true);
  };

  const handleDeleteOpen = () => {
    setShowMenu(false);
    setShowDelete(true);
  };

  const handleSave = () => {
    const updateData = {
      title: editTitle.trim(),
      weekly_frequency: editFrequency,
    };

    if (actionGoal.action_type === 'timer') {
      updateData.duration_minutes = editMinutes;
    }

    if (isGuest) {
      updateGuestActionGoal(actionGoal.id, updateData);
      toast.success('행동 목표가 수정되었습니다.');
      setShowEdit(false);
      return;
    }

    updateMutation.mutate(updateData);
  };

  const handleDelete = () => {
    if (isGuest) {
      deleteGuestActionGoal(actionGoal.id);
      toast.success('행동 목표가 삭제되었습니다.');
      setShowDelete(false);
      return;
    }

    deleteMutation.mutate();
  };

  const typeEmoji =
    actionGoal.action_type === 'timer'
      ? '⏱️'
      : actionGoal.action_type === 'abstain'
        ? '🚫'
        : '✅';

  const rightMeta =
    actionGoal.action_type === 'timer'
      ? `${actionGoal.duration_minutes || 0}분`
      : actionGoal.action_type === 'abstain'
        ? '안하기'
        : '확인형';

  return (
    <>
      <div ref={cardRef} className="relative">
        <div
          className="rounded-2xl px-3 py-3"
          style={{
            background: 'linear-gradient(135deg, #f5e6c8 0%, #eedcb0 60%, #f0e0bc 100%)',
            border: '1.5px solid #d7b97b',
            boxShadow: '0 3px 8px rgba(80,50,10,0.12)',
          }}
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-base shrink-0">{typeEmoji}</span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="truncate text-sm font-bold"
                    style={{ color: '#3a1f04' }}
                  >
                    {actionGoal.title}
                  </span>
                  <span
                    className="text-[11px] font-semibold shrink-0"
                    style={{ color: '#8f6a33' }}
                  >
                    {rightMeta}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-2">
                  <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full"
                    style={{ background: 'rgba(122,80,32,0.16)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${progressPercent}%`,
                        background:
                          'linear-gradient(90deg, #8b5a20 0%, #c98a2b 50%, #e1b44f 100%)',
                      }}
                    />
                  </div>

                  <span
                    className="text-[11px] font-bold shrink-0"
                    style={{ color: '#7a5020' }}
                  >
                    {weeklyCount}/{targetFreq}
                  </span>
                </div>
              </div>
            </div>

            {actionGoal.action_type === 'timer' ? (
              doneToday && !isRunning ? (
                <span
                  className="h-8 px-2.5 rounded-lg text-[11px] font-bold flex items-center shrink-0"
                  style={{
                    background: 'rgba(122,80,32,0.12)',
                    color: '#8f6a33',
                    border: '1px solid rgba(122,80,32,0.15)',
                  }}
                >
                  완료
                </span>
              ) : (
                <button
                  onClick={handleTimerToggle}
                  className="h-8 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0"
                  style={
                    isRunning
                      ? {
                          background: '#b94030',
                          color: '#fff',
                        }
                      : {
                          background: '#8b5a20',
                          color: '#fff',
                        }
                  }
                >
                  {isRunning ? (
                    <>
                      <Square className="w-3 h-3" />
                      {formatTime(elapsed)}
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      시작
                    </>
                  )}
                </button>
              )
            ) : doneToday ? (
              <span
                className="h-8 px-2.5 rounded-lg text-[11px] font-bold flex items-center shrink-0"
                style={{
                  background: 'rgba(122,80,32,0.12)',
                  color: '#8f6a33',
                  border: '1px solid rgba(122,80,32,0.15)',
                }}
              >
                완료
              </span>
            ) : (
              <button
                onClick={handleConfirm}
                className="h-8 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0"
                style={{
                  background: '#8b5a20',
                  color: '#fff',
                }}
              >
                <Check className="w-3 h-3" />
                {actionGoal.action_type === 'abstain' ? '성공' : '확인'}
              </button>
            )}

            <button
              onClick={() => setShowMenu(true)}
              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: 'rgba(122,80,32,0.08)',
                color: '#7a5020',
              }}
              aria-label="행동 목표 관리"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setShowWeeklyDetail((prev) => !prev)}
            className="w-full text-left"
            aria-label="주간 기록 펼치기"
          >
            <WeekDays logs={weeklyLogs} weeklyTarget={targetFreq} />
          </button>

          <AnimatePresence initial={false}>
            {showWeeklyDetail && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16 }}
                className="mt-2 rounded-xl px-3 py-3"
                style={{
                  background: 'rgba(255,250,240,0.82)',
                  border: '1px solid rgba(160,120,64,0.18)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div
                      className="text-xs font-bold"
                      style={{ color: '#7a5020' }}
                    >
                      주간 기록 요약
                    </div>
                    <div
                      className="text-[11px] mt-1"
                      style={{ color: '#8f6a33' }}
                    >
                      이번 주 {weeklyCount}회 완료 / 목표 {targetFreq}회
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCalendar((prev) => !prev);
                      }}
                      className="h-8 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1"
                      style={{
                        background: '#fff3d6',
                        color: '#7a5020',
                        border: '1px solid rgba(160,120,64,0.18)',
                      }}
                    >
                      <CalendarDays className="w-3.5 h-3.5" />
                      달력
                    </button>

                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{
                        background: 'rgba(122,80,32,0.08)',
                        color: '#7a5020',
                      }}
                    >
                      {showWeeklyDetail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showCalendar && (
            <MonthCalendar logs={detailLogs} onClose={() => setShowCalendar(false)} />
          )}
        </AnimatePresence>
      </div>

      <Drawer open={showMenu} onOpenChange={setShowMenu}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle>행동 목표 관리</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-6">
            <div className="space-y-2">
              <button
                onClick={handleEditOpen}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left"
              >
                <Pencil className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold">목표 수정</span>
              </button>

              <button
                onClick={handleDeleteOpen}
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
            <DrawerTitle>행동 목표 수정</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 space-y-4 pb-6">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#7a5020' }}>
                행동 목표 이름
              </label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#7a5020' }}>
                주 횟수
              </label>
              <div className="grid grid-cols-7 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map((freq) => (
                  <button
                    key={freq}
                    onClick={() => setEditFrequency(freq)}
                    className="py-2 rounded-xl text-sm font-semibold"
                    style={
                      editFrequency === freq
                        ? { background: '#8b5a20', color: '#fff' }
                        : { background: '#f3ead7', color: '#7a5020' }
                    }
                  >
                    {freq}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-1.5" style={{ color: '#9a7b47' }}>
                주 {editFrequency}회
              </p>
            </div>

            {actionGoal.action_type === 'timer' && (
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#7a5020' }}>
                  1회 시간
                </label>

                <div className="flex gap-2 mb-2">
                  {[20, 30, 60].map((minute) => (
                    <button
                      key={minute}
                      onClick={() => setEditMinutes(minute)}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold"
                      style={
                        editMinutes === minute
                          ? { background: '#8b5a20', color: '#fff' }
                          : { background: '#f3ead7', color: '#7a5020' }
                      }
                    >
                      {minute}분
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
            <DrawerTitle>행동 목표를 삭제할까요?</DrawerTitle>
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

      <Drawer open={showGpsDialog} onOpenChange={setShowGpsDialog}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle>GPS 추적을 사용할까요?</DrawerTitle>
          </DrawerHeader>

          <p className="px-4 text-sm text-center text-muted-foreground">
            운동 경로와 거리를 기록하고 싶다면 GPS를 켜 주세요.
          </p>

          <DrawerFooter className="flex gap-2 pt-6">
            <Button variant="outline" onClick={() => handleTimerStart(false)} className="flex-1 rounded-xl">
              안 함
            </Button>
            <Button
              onClick={() => handleTimerStart(true)}
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              GPS 사용
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
