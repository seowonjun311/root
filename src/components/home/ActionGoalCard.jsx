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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
const TIMER_KEY = (id) => `timer_start_${id}`;
const GPS_KEY = (id) => `gps_enabled_${id}`;
const GPS_COORDS_KEY = (id) => `gps_coords_${id}`;
const GUEST_STORAGE_KEY = 'root_guest_data';

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function normalizeDateOnly(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function getScheduledDateValue(actionGoal) {
  return (
    actionGoal?.scheduled_date ||
    actionGoal?.scheduledDate ||
    actionGoal?.date ||
    actionGoal?.target_date ||
    actionGoal?.targetDate ||
    actionGoal?.selected_date ||
    actionGoal?.selectedDate ||
    ''
  );
}

function formatKoreanDate(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function getDdayText(dateString) {
  if (!dateString) return '-';

  const normalized = normalizeDateOnly(dateString);
  if (!normalized) return '-';

  const today = new Date();
  const target = new Date(normalized);

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

function SimpleWeekRow({ logs = [] }) {
  const doneSet = new Set(
    (logs || [])
      .map((log) => {
        const d = new Date(log.date);
        if (Number.isNaN(d.getTime())) return null;
        return (d.getDay() + 6) % 7;
      })
      .filter((v) => v !== null)
  );

  return (
    <div className="mt-1 flex items-center justify-between gap-1">
      {DAY_LABELS.map((day, index) => {
        const isDone = doneSet.has(index);

        return (
          <div key={day} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
            <span
              className="text-[9px] font-semibold leading-none"
              style={{ color: '#9a7b47' }}
            >
              {day}
            </span>
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
              style={{
                background: isDone ? '#c7973a' : '#f5ecda',
                border: isDone ? '1px solid #a9771f' : '1px solid #e8dbc0',
                color: isDone ? '#fff' : '#d9ccb3',
              }}
            >
              {isDone ? '✓' : ''}
            </div>
          </div>
        );
      })}
    </div>
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

  const resolvedScheduledDate = normalizeDateOnly(getScheduledDateValue(actionGoal));

  const [editTitle, setEditTitle] = useState(actionGoal.title || '');
  const [editFrequency, setEditFrequency] = useState(actionGoal.weekly_frequency || 5);
  const [editMinutes, setEditMinutes] = useState(actionGoal.duration_minutes || 30);
  const [editActionType, setEditActionType] = useState(actionGoal.action_type || 'confirm');
  const [editScheduledDate, setEditScheduledDate] = useState(resolvedScheduledDate || '');

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
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const isGuest = !user;
  const isOneTime = actionGoal.action_type === 'one_time';

  const todayStr = getTodayString();
  const doneToday = isOneTime
    ? actionGoal.status === 'completed' ||
      allLogs.some((log) => log?.action_goal_id === actionGoal.id && log?.completed)
    : weeklyLogs.some((log) => log.date === todayStr);

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
    setEditScheduledDate(normalizeDateOnly(getScheduledDateValue(actionGoal)) || '');
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

  const renderActionButton = () => {
    if (isOneTime) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleConfirm();
          }}
          className="h-7 px-2.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0"
          style={{
            background: '#c8ab6b',
            color: '#5f4310',
          }}
        >
          완료
        </button>
      );
    }

    if (actionGoal.action_type === 'timer') {
      if (doneToday && !isRunning) {
        return (
          <span
            onClick={(e) => e.stopPropagation()}
            className="h-7 px-2.5 rounded-lg text-[10px] font-bold flex items-center shrink-0"
            style={{
              background: '#e5d6b8',
              color: '#8f6a33',
            }}
          >
            완료
          </span>
        );
      }

      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleTimerToggle();
          }}
          className="h-7 px-2.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0"
          style={
            isRunning
              ? {
                  background: '#b94030',
                  color: '#fff',
                }
              : {
                  background: '#c8ab6b',
                  color: '#5f4310',
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
      );
    }

    if (doneToday) {
      return (
        <span
          onClick={(e) => e.stopPropagation()}
          className="h-7 px-2.5 rounded-lg text-[10px] font-bold flex items-center shrink-0"
          style={{
            background: '#e5d6b8',
            color: '#8f6a33',
          }}
        >
          완료
        </span>
      );
    }

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleConfirm();
        }}
        className="h-7 px-2.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0"
        style={{
          background: '#c8ab6b',
          color: '#5f4310',
        }}
      >
        <Check className="w-3 h-3" />
        {actionGoal.action_type === 'abstain' ? '성공' : '완료'}
      </button>
    );
  };

  const oneTimeSubText = resolvedScheduledDate
    ? `${formatKoreanDate(resolvedScheduledDate)} · ${getDdayText(resolvedScheduledDate)}`
    : '날짜 미지정';

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
          className="rounded-2xl px-3 py-2 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #f5e6c8 0%, #eedcb0 60%, #f0e0bc 100%)',
            border: '1.5px solid #d7b97b',
            boxShadow: '0 3px 8px rgba(80,50,10,0.10)',
          }}
        >
          <div className="flex items-start gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: 'rgba(255,255,255,0.28)',
                border: '1px solid rgba(122,80,32,0.10)',
              }}
            >
              {doneToday ? (
                <Check className="w-3.5 h-3.5" style={{ color: '#4ca86a' }} />
              ) : (
                <div className="w-2 h-2 rounded-full" style={{ background: '#d2b06a' }} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[13px] font-bold leading-tight"
                    style={{ color: '#3a1f04' }}
                  >
                    {actionGoal.title}
                  </div>

                  {isOneTime ? (
                    <div
                      className="mt-0.5 text-[10px] font-semibold leading-none"
                      style={{ color: '#8f6a33' }}
                    >
                      {oneTimeSubText}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {renderActionButton()}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(true);
                    }}
                    className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: 'rgba(122,80,32,0.08)',
                      color: '#7a5020',
                    }}
                    aria-label="행동 목표 관리"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {!isOneTime && <SimpleWeekRow logs={weeklyLogs} />}
            </div>
          </div>
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

                    <div className="text-sm font-bold mb-1" style={{ color: '#4a2c08' }}>
                      선택된 사진
                    </div>
                    <div className="text-xs" style={{ color: '#8f6a33' }}>
                      {selectedPhoto.name}
                    </div>
                    <div className="text-xs mt-1" style={{ color: '#9a7b47' }}>
                      {selectedPhoto.source === 'camera' ? '카메라로 촬영한 사진' : '갤러리에서 선택한 사진'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-bold mb-1" style={{ color: '#4a2c08' }}>
                      사진 없이 저장
                    </div>
                    <div className="text-xs" style={{ color: '#8f6a33' }}>
                      사진 첨부 없이 오늘 기록을 저장합니다.
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <DrawerFooter className="pt-2">
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={() => setShowPhotoConfirm(false)} className="flex-1 rounded-xl">
                취소
              </Button>
              <Button
                onClick={handleSavePhotoConfirm}
                className="flex-1 rounded-xl"
                style={{ background: '#8b5a20', color: '#fff' }}
              >
                저장
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

          <div className="px-4 pb-6">
            <div className="space-y-2">
              <button onClick={handleEditOpen} className="w-full flex items-center gap-3 p-3 rounded-xl text-left">
                <Pencil className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold">목표 수정</span>
              </button>

              <button onClick={handleDeleteOpen} className="w-full flex items-center gap-3 p-3 rounded-xl text-left">
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
                목표 유형
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setEditActionType('confirm')}
                  className="py-2 rounded-xl text-sm font-semibold"
                  style={
                    editActionType === 'confirm'
                      ? { background: '#8b5a20', color: '#fff' }
                      : { background: '#f3ead7', color: '#7a5020' }
                  }
                >
                  확인형
                </button>

                <button
                  onClick={() => setEditActionType('timer')}
                  className="py-2 rounded-xl text-sm font-semibold"
                  style={
                    editActionType === 'timer'
                      ? { background: '#8b5a20', color: '#fff' }
                      : { background: '#f3ead7', color: '#7a5020' }
                  }
                >
                  시간기록형
                </button>

                <button
                  onClick={() => setEditActionType('abstain')}
                  className="py-2 rounded-xl text-sm font-semibold"
                  style={
                    editActionType === 'abstain'
                      ? { background: '#8b5a20', color: '#fff' }
                      : { background: '#f3ead7', color: '#7a5020' }
                  }
                >
                  안하기형
                </button>

                <button
                  onClick={() => setEditActionType('one_time')}
                  className="py-2 rounded-xl text-sm font-semibold"
                  style={
                    editActionType === 'one_time'
                      ? { background: '#8b5a20', color: '#fff' }
                      : { background: '#f3ead7', color: '#7a5020' }
                  }
                >
                  1회성
                </button>
              </div>
            </div>

            {editActionType === 'one_time' ? (
              <div data-vaul-no-drag>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#7a5020' }}>
                  예정 날짜
                </label>
                <input
                  type="date"
                  min={getTodayString()}
                  value={editScheduledDate}
                  onChange={(e) => setEditScheduledDate(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  data-vaul-no-drag
                  className="w-full h-11 rounded-xl border px-3 text-sm cursor-pointer"
                  style={{
                    borderColor: '#e1c98f',
                    background: '#fff',
                    color: '#4a2c08',
                  }}
                />
              </div>
            ) : (
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
            )}

            {editActionType === 'timer' && (
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
              disabled={!editTitle.trim() || (editActionType === 'one_time' && !editScheduledDate) || updateMutation.isPending}
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
