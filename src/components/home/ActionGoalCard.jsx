import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Play,
  Square,
  Check,
  X,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Camera,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { base44 } from '@/api/base44Client';
import guestDataPersistence from '@/lib/GuestDataPersistence';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import WeekDays from './WeekDays';

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

const DEFAULT_RUNTIME_STATE = {
  timerStart: 0,
  gpsEnabled: false,
  gpsCoords: [],
};

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function formatKoreanDate(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function getDdayText(dateString) {
  if (!dateString) return '-';

  const today = new Date();
  const target = new Date(dateString);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return '오늘';
  if (diff > 0) return `D-${diff}`;
  return '기한 지남';
}

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
    return guestDataPersistence.getData() || {};
  } catch {
    return {};
  }
}

function saveGuestData(data) {
  return guestDataPersistence.setData(data);
}

function getActionRuntimeState(actionGoalId) {
  const data = loadGuestData();
  const runtime = data?.actionRuntime || {};
  const current = runtime[actionGoalId] || {};

  return {
    ...DEFAULT_RUNTIME_STATE,
    ...current,
    gpsCoords: Array.isArray(current?.gpsCoords) ? current.gpsCoords : [],
  };
}

function updateActionRuntimeState(actionGoalId, patchOrUpdater) {
  return guestDataPersistence.updateData((prev) => {
    const runtime = { ...(prev?.actionRuntime || {}) };
    const current = {
      ...DEFAULT_RUNTIME_STATE,
      ...(runtime[actionGoalId] || {}),
      gpsCoords: Array.isArray(runtime[actionGoalId]?.gpsCoords)
        ? runtime[actionGoalId].gpsCoords
        : [],
    };

    const nextForGoal =
      typeof patchOrUpdater === 'function'
        ? patchOrUpdater(current)
        : { ...current, ...(patchOrUpdater || {}) };

    runtime[actionGoalId] = {
      ...DEFAULT_RUNTIME_STATE,
      ...nextForGoal,
      gpsCoords: Array.isArray(nextForGoal?.gpsCoords) ? nextForGoal.gpsCoords : [],
    };

    return {
      ...prev,
      actionRuntime: runtime,
    };
  });
}

function clearActionRuntimeState(actionGoalId) {
  return guestDataPersistence.updateData((prev) => {
    const runtime = { ...(prev?.actionRuntime || {}) };
    delete runtime[actionGoalId];
    return {
      ...prev,
      actionRuntime: runtime,
    };
  });
}

function updateGuestActionGoal(actionGoalId, updateData) {
  const current = loadGuestData();
  const nextActionGoals = (current.actionGoals || []).map((goal) =>
    goal.id === actionGoalId ? { ...goal, ...updateData } : goal
  );

  saveGuestData({
    ...current,
    actionGoals: nextActionGoals,
    actionGoalData: nextActionGoals[0] || current.actionGoalData || null,
  });

  window.dispatchEvent(new Event('root-home-data-updated'));
}

function deleteGuestActionGoal(actionGoalId) {
  const current = loadGuestData();

  const nextActionGoals = (current.actionGoals || []).filter((goal) => goal.id !== actionGoalId);
  const nextActionLogs = (current.actionLogs || []).filter((log) => log.action_goal_id !== actionGoalId);

  saveGuestData({
    ...current,
    actionGoals: nextActionGoals,
    actionLogs: nextActionLogs,
    actionGoalData: nextActionGoals[0] || null,
  });

  clearActionRuntimeState(actionGoalId);
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
        <button onClick={prevMonth} className="px-2 py-1 rounded-lg text-sm" style={{ color: '#7a5020' }}>
          ‹
        </button>

        <p className="text-sm font-bold" style={{ color: '#7a5020' }}>
          {viewYear}년 {viewMonth + 1}월
        </p>

        <div className="flex items-center gap-1">
          <button onClick={nextMonth} className="px-2 py-1 rounded-lg text-sm" style={{ color: '#7a5020' }}>
            ›
          </button>
          <button onClick={onClose} className="p-1 rounded-lg" type="button">
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
  streak = 0,
  onComplete,
}) {
  const queryClient = useQueryClient();

  const [elapsed, setElapsed] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showGpsDialog, setShowGpsDialog] = useState(false);
  const [showPhotoConfirm, setShowPhotoConfirm] = useState(false);

  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState('');
  const [pendingNoPhoto, setPendingNoPhoto] = useState(false);
  const [pendingTimerData, setPendingTimerData] = useState(null);

  const [editTitle, setEditTitle] = useState(actionGoal.title || '');
  const [editFrequency, setEditFrequency] = useState(actionGoal.weekly_frequency || 5);
  const [editMinutes, setEditMinutes] = useState(actionGoal.duration_minutes || 30);
  const [editActionType, setEditActionType] = useState(actionGoal.action_type || 'confirm');
  const [editScheduledDate, setEditScheduledDate] = useState(actionGoal.scheduled_date || '');

  const [gpsEnabled, setGpsEnabled] = useState(() => {
    return !!getActionRuntimeState(actionGoal.id).gpsEnabled;
  });

  const intervalRef = useRef(null);
  const cardRef = useRef(null);
  const watchIdRef = useRef(null);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const isGuest = !user;
  const isOneTime = actionGoal.action_type === 'one_time';

  const weeklyCount = weeklyLogs.length;
  const targetFreq = actionGoal.weekly_frequency || 7;

  const todayStr = getTodayString();
  const doneToday = isOneTime
    ? actionGoal.status === 'completed' ||
      allLogs.some((log) => log?.action_goal_id === actionGoal.id && log?.completed)
    : weeklyLogs.some((log) => log.date === todayStr);

  const progressPercent = isOneTime
    ? actionGoal.status === 'completed'
      ? 100
      : getDdayText(actionGoal.scheduled_date) === '기한 지남'
        ? 100
        : 0
    : Math.min(100, Math.round((weeklyCount / Math.max(1, targetFreq)) * 100));

  const detailLogs = Array.isArray(allLogs) && allLogs.length > 0 ? allLogs : weeklyLogs;

  const [isRunning, setIsRunning] = useState(() => {
    return Number(getActionRuntimeState(actionGoal.id).timerStart) > 0;
  });

  useEffect(() => {
    if (!isRunning) {
      setElapsed(0);
      clearInterval(intervalRef.current);
      return undefined;
    }

    const tick = () => {
      const start = Number(getActionRuntimeState(actionGoal.id).timerStart || 0);
      if (!start) {
        setElapsed(0);
        return;
      }
      setElapsed(Math.floor((Date.now() - start) / 1000));
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, actionGoal.id]);

  useEffect(() => {
    updateActionRuntimeState(actionGoal.id, { gpsEnabled });
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

  useEffect(() => {
    return () => {
      if (selectedPhotoPreview) {
        URL.revokeObjectURL(selectedPhotoPreview);
      }
    };
  }, [selectedPhotoPreview]);

  const resetPhotoState = () => {
    if (selectedPhotoPreview) {
      URL.revokeObjectURL(selectedPhotoPreview);
    }
    setSelectedPhoto(null);
    setSelectedPhotoPreview('');
    setPendingNoPhoto(false);
    setPendingTimerData(null);

    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const updateMutation = useMutation({
    mutationFn: (updateData) => base44.entities.ActionGoal.update(actionGoal.id, updateData),
    onSuccess: () => {
      toast.success('행동 목표가 수정되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['actionGoals'] });
      setShowEdit(false);
      window.dispatchEvent(new Event('root-home-data-updated'));
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
      window.dispatchEvent(new Event('root-home-data-updated'));
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
        updateActionRuntimeState(actionGoal.id, (current) => ({
          ...current,
          gpsCoords: [
            ...(Array.isArray(current.gpsCoords) ? current.gpsCoords : []),
            [latitude, longitude],
          ],
        }));
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
    updateActionRuntimeState(actionGoal.id, {
      timerStart: Date.now(),
      gpsEnabled: enableGps,
      gpsCoords: enableGps ? [] : getActionRuntimeState(actionGoal.id).gpsCoords,
    });

    setIsRunning(true);
    setGpsEnabled(enableGps);

    if (enableGps) {
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
      const start = Number(getActionRuntimeState(actionGoal.id).timerStart || 0);
      const totalElapsed = start ? Math.floor((Date.now() - start) / 1000) : 0;

      updateActionRuntimeState(actionGoal.id, { timerStart: 0 });
      clearInterval(intervalRef.current);
      setIsRunning(false);
      setElapsed(0);
      stopGpsTracking();

      const minutes = Math.round(totalElapsed / 60);

      if (minutes > 0 || totalElapsed > 30) {
        const coords = gpsEnabled
          ? (Array.isArray(getActionRuntimeState(actionGoal.id).gpsCoords)
              ? getActionRuntimeState(actionGoal.id).gpsCoords
              : [])
          : [];
        const distance = gpsEnabled ? calculateDistance(coords) : null;

        updateActionRuntimeState(actionGoal.id, { gpsCoords: [] });

        if (selectedPhotoPreview) {
          URL.revokeObjectURL(selectedPhotoPreview);
        }
        setSelectedPhoto(null);
        setSelectedPhotoPreview('');
        setPendingNoPhoto(false);

        setPendingTimerData({
          minutes: Math.max(1, minutes),
          gpsEnabled,
          distance,
          coords,
        });

        setShowPhotoConfirm(true);
      } else {
        clearActionRuntimeState(actionGoal.id);
      }
    } else if (actionGoal.category === 'exercise' && actionGoal.action_type === 'timer') {
      setShowGpsDialog(true);
    } else {
      handleTimerStart(false);
    }
  };

  const finalizeConfirm = (photoInfo = null) => {
    if (pendingTimerData) {
      onComplete(actionGoal, pendingTimerData.minutes, {
        gpsEnabled: pendingTimerData.gpsEnabled,
        distance: pendingTimerData.distance,
        coords: pendingTimerData.coords,
        photo: photoInfo,
      });
      resetPhotoState();
      clearActionRuntimeState(actionGoal.id);
      setShowPhotoConfirm(false);
      return;
    }

    if (isOneTime) {
      onComplete(actionGoal, 0, {
        gpsEnabled: false,
        photo: photoInfo,
      });
      resetPhotoState();
      setShowPhotoConfirm(false);
      return;
    }

    if (doneToday) {
      toast.error('오늘 이미 완료했어요. 내일 다시 도전해 주세요! 💪');
      resetPhotoState();
      setShowPhotoConfirm(false);
      return;
    }

    onComplete(actionGoal, actionGoal.duration_minutes || 0, {
      gpsEnabled: false,
      photo: photoInfo,
    });
    resetPhotoState();
    setShowPhotoConfirm(false);
  };

  const handleConfirm = () => {
    if (
      actionGoal.action_type === 'confirm' ||
      actionGoal.action_type === 'abstain' ||
      actionGoal.action_type === 'timer' ||
      isOneTime
    ) {
      resetPhotoState();
      setShowPhotoConfirm(true);
      return;
    }

    if (doneToday) {
      toast.error('오늘 이미 완료했어요. 내일 다시 도전해 주세요! 💪');
      return;
    }

    onComplete(actionGoal, actionGoal.duration_minutes || 0, { gpsEnabled: false });
  };

  const handlePhotoSelected = (e, source) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (selectedPhotoPreview) {
      URL.revokeObjectURL(selectedPhotoPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setSelectedPhoto({
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      source,
    });
    setSelectedPhotoPreview(previewUrl);
    setPendingNoPhoto(false);
  };

  const handleSavePhotoConfirm = () => {
    if (pendingNoPhoto) {
      finalizeConfirm(null);
      return;
    }

    if (!selectedPhoto) {
      toast.error('사진을 선택하거나 "사진 없이 저장"을 눌러 주세요.');
      return;
    }

    finalizeConfirm({
      name: selectedPhoto.name,
      type: selectedPhoto.type,
      size: selectedPhoto.size,
      source: selectedPhoto.source,
    });
  };

  const handleNoPhotoMode = () => {
    if (selectedPhotoPreview) {
      URL.revokeObjectURL(selectedPhotoPreview);
    }
    setSelectedPhoto(null);
    setSelectedPhotoPreview('');
    setPendingNoPhoto(true);
  };

  const handleEditOpen = () => {
    setEditTitle(actionGoal.title || '');
    setEditFrequency(actionGoal.weekly_frequency || 5);
    setEditMinutes(actionGoal.duration_minutes || 30);
    setEditActionType(actionGoal.action_type || 'confirm');
    setEditScheduledDate(actionGoal.scheduled_date || '');
    setShowMenu(false);
    setShowEdit(true);
  };

  const handleDeleteOpen = () => {
    setShowMenu(false);
    setShowDelete(true);
  };

  const handleSave = () => {
    const safeActionType = editActionType || 'confirm';

    const updateData = {
      title: editTitle.trim(),
      weekly_frequency: safeActionType === 'one_time' ? 0 : editFrequency,
      action_type: safeActionType,
      scheduled_date: safeActionType === 'one_time' ? editScheduledDate || null : null,
      frequency_mode: safeActionType === 'one_time' ? 'one_time' : 'weekly',
    };

    if (safeActionType === 'timer') {
      updateData.duration_minutes = Math.max(1, Number(editMinutes) || 30);
    } else {
      updateData.duration_minutes = 0;
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

  const typeLabel =
    actionGoal.action_type === 'timer'
      ? `${actionGoal.duration_minutes || 0}분`
      : actionGoal.action_type === 'abstain'
        ? '안하기형'
        : actionGoal.action_type === 'one_time'
          ? '1회성'
          : '확인형';

  return (
    <>
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handlePhotoSelected(e, 'gallery')}
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handlePhotoSelected(e, 'camera')}
      />

      <div ref={cardRef} className="relative">
        <div
          onClick={() => setShowCalendar((prev) => !prev)}
          className="rounded-2xl px-3 py-3 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #f5e6c8 0%, #eedcb0 60%, #f0e0bc 100%)',
            border: '1.5px solid #d7b97b',
            boxShadow: '0 3px 8px rgba(80,50,10,0.12)',
          }}
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: 'rgba(255,255,255,0.28)',
                  border: '1px solid rgba(122,80,32,0.12)',
                }}
              >
                {doneToday ? (
                  <Check className="w-4 h-4" style={{ color: '#4ca86a' }} />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#d2b06a' }} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate text-sm font-bold" style={{ color: '#3a1f04' }}>
                    {actionGoal.title}
                  </span>

                  <span className="text-[11px] font-semibold shrink-0" style={{ color: '#8f6a33' }}>
                    {typeLabel}
                  </span>
                </div>

                {!isOneTime && streak > 0 && (
                  <div className="mt-1 flex items-center gap-2">
                    <div
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-bold"
                      style={{
                        background: 'rgba(255,140,0,0.10)',
                        color: '#b85c00',
                        border: '1px solid rgba(184,92,0,0.16)',
                      }}
                    >
                      <span>🔥</span>
                      <span>{streak}일 연속</span>
                    </div>
                  </div>
                )}

                <div className="mt-1 flex items-center gap-2">
                  {isOneTime ? (
                    <>
                      <div className="text-[11px] font-semibold" style={{ color: '#7a5020' }}>
                        {actionGoal.scheduled_date
                          ? `예정일: ${formatKoreanDate(actionGoal.scheduled_date)}`
                          : '날짜 미지정'}
                      </div>

                      <span
                        className="text-[11px] font-bold shrink-0 ml-auto"
                        style={{
                          color: doneToday
                            ? '#4ca86a'
                            : getDdayText(actionGoal.scheduled_date) === '기한 지남'
                              ? '#b94030'
                              : '#7a5020',
                        }}
                      >
                        {doneToday ? '1/1' : '0/1'}
                      </span>
                    </>
                  ) : (
                    <>
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

                      <span className="text-[11px] font-bold shrink-0" style={{ color: '#7a5020' }}>
                        {weeklyCount}/{targetFreq}
                      </span>
                    </>
                  )}
                </div>

                {isOneTime && (
                  <div className="mt-1 text-[11px] font-semibold" style={{ color: '#9a7b47' }}>
                    {getDdayText(actionGoal.scheduled_date)}
                  </div>
                )}
              </div>
            </div>

            {isOneTime ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirm();
                }}
                className="h-8 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0"
                style={{
                  background: '#8b5a20',
                  color: '#fff',
                }}
                type="button"
              >
                <Check className="w-3 h-3" />
                완료
              </button>
            ) : actionGoal.action_type === 'timer' ? (
              doneToday && !isRunning ? (
                <span
                  onClick={(e) => e.stopPropagation()}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTimerToggle();
                  }}
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
                  type="button"
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
                onClick={(e) => e.stopPropagation()}
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirm();
                }}
                className="h-8 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0"
                style={{
                  background: '#8b5a20',
                  color: '#fff',
                }}
                type="button"
              >
                <Check className="w-3 h-3" />
                {actionGoal.action_type === 'abstain' ? '성공' : '확인'}
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(true);
              }}
              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: 'rgba(122,80,32,0.08)',
                color: '#7a5020',
              }}
              aria-label="행동 목표 관리"
              type="button"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>

          {!isOneTime && (
            <div className="mt-1">
              <WeekDays
                logs={weeklyLogs}
                weeklyTarget={targetFreq}
                category={actionGoal.category}
              />
            </div>
          )}
        </div>

        <AnimatePresence>
          {showCalendar && <MonthCalendar logs={detailLogs} onClose={() => setShowCalendar(false)} />}
        </AnimatePresence>
      </div>

      <Drawer
        open={showPhotoConfirm}
        onOpenChange={(open) => {
          setShowPhotoConfirm(open);
          if (!open) resetPhotoState();
        }}
      >
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle>기록을 어떻게 남길까요?</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-2 space-y-2">
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="w-full flex items-center gap-3 p-4 rounded-xl text-left"
              style={{ background: '#f8f1df' }}
              type="button"
            >
              <ImageIcon className="w-5 h-5 text-amber-700" />
              <div>
                <div className="text-sm font-bold">사진 저장 갤러리</div>
                <div className="text-xs text-muted-foreground">앨범에서 사진 선택</div>
              </div>
            </button>

            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full flex items-center gap-3 p-4 rounded-xl text-left"
              style={{ background: '#f8f1df' }}
              type="button"
            >
              <Camera className="w-5 h-5 text-amber-700" />
              <div>
                <div className="text-sm font-bold">사진 찍기</div>
                <div className="text-xs text-muted-foreground">지금 바로 촬영해서 선택</div>
              </div>
            </button>

            <button
              onClick={handleNoPhotoMode}
              className="w-full flex items-center justify-center p-4 rounded-xl text-sm font-bold"
              style={{
                background: pendingNoPhoto ? '#a66c1f' : '#efe4c8',
                color: pendingNoPhoto ? '#fff' : '#7a5020',
              }}
              type="button"
            >
              사진 없이 저장
            </button>

            {(selectedPhoto || pendingNoPhoto) && (
              <div
                className="mt-3 rounded-2xl p-3"
                style={{
                  background: '#fffaf0',
                  border: '1px solid #e5d3a0',
                }}
              >
                {selectedPhoto ? (
                  <>
                    {selectedPhotoPreview ? (
                      <img
                        src={selectedPhotoPreview}
                        alt="선택한 사진 미리보기"
                        className="w-full h-40 object-cover rounded-xl mb-3"
                      />
                    ) : null}

                    <div className="text-sm font-bold" style={{ color: '#7a5020' }}>
                      {selectedPhoto.name}
                    </div>
                    <div className="text-xs mt-1" style={{ color: '#9a7b47' }}>
                      {selectedPhoto.source === 'camera' ? '카메라 촬영' : '갤러리 선택'}
                    </div>
                  </>
                ) : (
                  <div className="text-sm font-bold text-center" style={{ color: '#7a5020' }}>
                    사진 없이 저장합니다.
                  </div>
                )}
              </div>
            )}
          </div>

          <DrawerFooter>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setShowPhotoConfirm(false)}>
                취소
              </Button>
              <Button type="button" onClick={handleSavePhotoConfirm}>
                저장
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={showGpsDialog} onOpenChange={setShowGpsDialog}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle>GPS를 함께 기록할까요?</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-2 text-sm text-center" style={{ color: '#7a5020' }}>
            운동 타이머를 시작하면서 GPS 이동거리도 함께 기록할 수 있어요.
          </div>

          <DrawerFooter>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => handleTimerStart(false)}>
                타이머만 시작
              </Button>
              <Button type="button" onClick={() => handleTimerStart(true)}>
                GPS 함께 시작
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={showMenu} onOpenChange={setShowMenu}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle>행동 목표 관리</DrawerTitle>
          </DrawerHeader>

          <DrawerFooter>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={handleEditOpen}>
                <Pencil className="w-4 h-4 mr-1" />
                수정
              </Button>
              <Button type="button" variant="destructive" onClick={handleDeleteOpen}>
                <Trash2 className="w-4 h-4 mr-1" />
                삭제
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={showEdit} onOpenChange={setShowEdit}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle>행동 목표 수정</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-4 space-y-3">
            <div>
              <div className="text-sm font-bold mb-2" style={{ color: '#7a5020' }}>
                목표 제목
              </div>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="행동 목표 제목"
              />
            </div>

            <div>
              <div className="text-sm font-bold mb-2" style={{ color: '#7a5020' }}>
                목표 유형
              </div>
              <select
                value={editActionType}
                onChange={(e) => setEditActionType(e.target.value)}
                className="w-full h-10 rounded-md border px-3 text-sm bg-white"
              >
                <option value="confirm">확인형</option>
                <option value="timer">시간형</option>
                <option value="abstain">안하기형</option>
                <option value="one_time">1회성</option>
              </select>
            </div>

            {editActionType !== 'one_time' && (
              <div>
                <div className="text-sm font-bold mb-2" style={{ color: '#7a5020' }}>
                  주간 횟수
                </div>
                <Input
                  type="number"
                  min={1}
                  max={7}
                  value={editFrequency}
                  onChange={(e) => setEditFrequency(Number(e.target.value))}
                />
              </div>
            )}

            {editActionType === 'timer' && (
              <div>
                <div className="text-sm font-bold mb-2" style={{ color: '#7a5020' }}>
                  목표 시간(분)
                </div>
                <Input
                  type="number"
                  min={1}
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(Number(e.target.value))}
                />
              </div>
            )}

            {editActionType === 'one_time' && (
              <div>
                <div className="text-sm font-bold mb-2" style={{ color: '#7a5020' }}>
                  예정일
                </div>
                <Input
                  type="date"
                  value={editScheduledDate}
                  onChange={(e) => setEditScheduledDate(e.target.value)}
                />
              </div>
            )}
          </div>

          <DrawerFooter>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>
                취소
              </Button>
              <Button type="button" onClick={handleSave}>
                저장
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={showDelete} onOpenChange={setShowDelete}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle>행동 목표를 삭제할까요?</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-2 text-sm text-center" style={{ color: '#7a5020' }}>
            삭제하면 이 행동목표와 연결된 기록도 함께 정리돼요.
          </div>

          <DrawerFooter>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDelete(false)}>
                취소
              </Button>
              <Button type="button" variant="destructive" onClick={handleDelete}>
                삭제
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
