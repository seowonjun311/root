import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronLeft, Bell, BellOff, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const ENCOURAGEMENTS = [
  '🦊 오늘도 한 걸음! 용사님의 여정을 응원합니다.',
  '💪 꾸준함이 가장 큰 힘이에요. 지금 바로 시작해볼까요?',
  '⚔️ 오늘의 목표를 달성하면 내일의 나는 더 강해집니다.',
  '🌱 작은 습관이 쌓여 큰 변화를 만들어요.',
  '🏆 오늘의 나를 응원하는 여우가 기다리고 있어요!',
];

const DEFAULT_SETTINGS = {
  enabled: false,
  time: '09:00',
  days: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false },
};

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem('notificationSettings') || 'null') || DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings) {
  localStorage.setItem('notificationSettings', JSON.stringify(settings));
}

const isNotificationSupported = () => typeof window !== 'undefined' && 'Notification' in window;

// Schedule next notification using setTimeout
function scheduleNotifications(settings) {
  if (!isNotificationSupported()) return;

  // Clear existing timers
  const existingIds = JSON.parse(localStorage.getItem('notifTimerIds') || '[]');
  existingIds.forEach(id => clearTimeout(id));
  localStorage.setItem('notifTimerIds', '[]');

  if (!settings.enabled) return;

  const now = new Date();
  const [hours, minutes] = settings.time.split(':').map(Number);
  const dayIndexMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0 };

  const timerIds = [];

  DAY_KEYS.forEach((key) => {
    if (!settings.days[key]) return;
    const targetDay = dayIndexMap[key];
    const daysUntil = (targetDay - now.getDay() + 7) % 7;
    const target = new Date(now);
    target.setDate(now.getDate() + daysUntil);
    target.setHours(hours, minutes, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 7);

    const ms = target - now;
    const id = setTimeout(() => {
      if (Notification.permission === 'granted') {
        const msg = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
        new Notification('루트 (Route) 🦊', { body: msg, icon: '/favicon.ico' });
      }
    }, ms);
    timerIds.push(id);
  });

  localStorage.setItem('notifTimerIds', JSON.stringify(timerIds));
}

export default function NotificationSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(loadSettings);
  const [permission, setPermission] = useState(
    isNotificationSupported() ? window.Notification.permission : 'unsupported'
  );
  const [testLoading, setTestLoading] = useState(false);
  const [showTimeDialog, setShowTimeDialog] = useState(false);
  const [pendingTime, setPendingTime] = useState(settings.time);
  const [pendingDays, setPendingDays] = useState(settings.days);
  const [switchPending, setSwitchPending] = useState(false);

  useEffect(() => {
    if (!isNotificationSupported()) return;
    const syncPermission = () => setPermission(window.Notification.permission);
    syncPermission();
    window.addEventListener('focus', syncPermission);
    return () => window.removeEventListener('focus', syncPermission);
  }, []);

  const requestPermission = async () => {
    if (!isNotificationSupported()) {
      toast.error('이 브라우저는 알림을 지원하지 않습니다.');
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      toast.success('알림 권한이 허용되었습니다!');
    } else {
      toast.error('알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.');
    }
  };

  const handleToggle = async (enabled) => {
    if (enabled) {
      if (permission !== 'granted') {
        await requestPermission();
        if (Notification.permission !== 'granted') return;
        setPermission('granted');
      }
      setSwitchPending(true);
      setPendingTime(settings.time);
      setPendingDays(settings.days);
      setShowTimeDialog(true);
    } else {
      const next = { ...settings, enabled: false };
      setSettings(next);
      saveSettings(next);
      scheduleNotifications(next);
      toast.success('알림이 비활성화되었습니다.');
    }
  };

  const handleDialogConfirm = () => {
    const next = { ...settings, enabled: true, time: pendingTime, days: pendingDays };
    setSettings(next);
    saveSettings(next);
    scheduleNotifications(next);
    setSwitchPending(false);
    setShowTimeDialog(false);
    toast.success('알림이 활성화되었습니다.');
  };

  const handleDialogCancel = () => {
    setSwitchPending(false);
    setShowTimeDialog(false);
  };

  const handleTimeChange = (e) => {
    const next = { ...settings, time: e.target.value };
    setSettings(next);
    saveSettings(next);
    if (settings.enabled) scheduleNotifications(next);
  };

  const handleDayToggle = (key) => {
    const next = { ...settings, days: { ...settings.days, [key]: !settings.days[key] } };
    setSettings(next);
    saveSettings(next);
    if (settings.enabled) scheduleNotifications(next);
  };

  const handleTestNotification = async () => {
    if (permission !== 'granted') {
      await requestPermission();
      if (Notification.permission !== 'granted') return;
      setPermission('granted');
    }
    setTestLoading(true);
    setTimeout(() => {
      const msg = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
      new Notification('루트 (Route) 🦊', { body: msg, icon: '/favicon.ico' });
      setTestLoading(false);
      toast.success('테스트 알림을 전송했습니다!');
    }, 500);
  };

  const activeCount = Object.values(settings.days).filter(Boolean).length;
  const pendingActiveCount = Object.values(pendingDays).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      {/* 시간 설정 다이얼로그 */}
      <Dialog open={showTimeDialog} onOpenChange={(open) => { if (!open) handleDialogCancel(); }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">🔔 알림 시간 설정</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-amber-600" />
                <p className="font-semibold text-sm">알림 시간</p>
              </div>
              <div className="flex justify-center">
                <input
                  type="time"
                  value={pendingTime}
                  onChange={e => setPendingTime(e.target.value)}
                  className="text-3xl font-bold text-amber-900 bg-secondary/50 border border-border rounded-2xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-amber-600" />
                <p className="font-semibold text-sm">알림 요일</p>
              </div>
              <div className="flex gap-1.5 justify-between">
                {DAY_KEYS.map((key, i) => (
                  <button
                    key={key}
                    onClick={() => setPendingDays(prev => ({ ...prev, [key]: !prev[key] }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      pendingDays[key]
                        ? 'bg-amber-700 text-amber-50 shadow-md shadow-amber-800/20'
                        : 'bg-secondary/70 text-muted-foreground'
                    }`}
                  >
                    {DAYS[i]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                {pendingActiveCount === 0 ? '최소 하루는 선택해주세요' : `주 ${pendingActiveCount}회 알림`}
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleDialogCancel} className="flex-1 rounded-xl">취소</Button>
            <Button
              onClick={handleDialogConfirm}
              disabled={pendingActiveCount === 0}
              className="flex-1 rounded-xl bg-amber-700 hover:bg-amber-800 text-amber-50"
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Header */}
      <div className="flex items-center gap-3 p-5 pb-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-xl font-bold text-amber-900 flex items-center gap-2">
          🔔 알림 설정
        </h1>
      </div>

      <div className="px-4 space-y-4 pb-8">
        {/* Permission banner */}
        {permission === 'unsupported' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-red-50 border border-red-200"
          >
            <p className="text-sm font-semibold text-red-700 mb-1">알림을 지원하지 않는 환경이에요</p>
            <p className="text-xs text-red-500">Chrome, Edge 등의 브라우저에서 이용해주세요. iOS Safari는 홈 화면 추가 후 사용 가능합니다.</p>
          </motion.div>
        )}

        {/* Permission banner */}
        {permission !== 'granted' && permission !== 'unsupported' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-amber-50 border border-amber-200"
          >
            <p className="text-sm font-semibold text-amber-800 mb-1">알림 권한이 필요해요</p>
            <p className="text-xs text-amber-600 mb-3">
              {permission === 'denied'
                ? '브라우저 설정 → 사이트 권한에서 알림을 허용해주세요.'
                : '목표 달성 알림을 받으려면 권한을 허용해주세요.'}
            </p>
            {permission !== 'denied' && (
              <Button
                size="sm"
                onClick={requestPermission}
                className="bg-amber-700 hover:bg-amber-800 text-amber-50 rounded-xl h-8 text-xs"
              >
                권한 허용하기
              </Button>
            )}
          </motion.div>
        )}

        {/* Main toggle card */}
        <div className="p-5 rounded-2xl bg-card border border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${settings.enabled ? 'bg-amber-100' : 'bg-secondary'}`}>
                {settings.enabled
                  ? <Bell className="w-5 h-5 text-amber-600" />
                  : <BellOff className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div>
                <p className="font-semibold text-sm">알림 사용</p>
                <p className="text-xs text-muted-foreground">
                  {settings.enabled ? `${activeCount}일 활성 · ${settings.time}` : '비활성화됨'}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enabled || switchPending}
              onCheckedChange={handleToggle}
            />
          </div>
        </div>

        {/* Time & Day settings (활성화 후 수정) */}
        <AnimatePresence>
          {settings.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              {/* 현재 설정 요약 + 수정 버튼 */}
              <div className="p-5 rounded-2xl bg-card border border-border/60">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <p className="font-semibold text-sm">현재 알림 설정</p>
                  </div>
                  <button
                    onClick={() => { setPendingTime(settings.time); setPendingDays(settings.days); setShowTimeDialog(true); }}
                    className="text-xs font-semibold text-amber-700 hover:underline"
                  >
                    수정
                  </button>
                </div>
                <p className="text-2xl font-bold text-amber-900 mb-2">{settings.time}</p>
                <div className="flex gap-1.5">
                  {DAY_KEYS.map((key, i) => (
                    <span key={key} className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold ${
                      settings.days[key] ? 'bg-amber-700 text-amber-50' : 'bg-secondary/70 text-muted-foreground'
                    }`}>{DAYS[i]}</span>
                  ))}
                </div>
              </div>

              {/* Preview card */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/60">
                <p className="text-xs font-semibold text-amber-700 mb-2">📱 알림 미리보기</p>
                <div className="bg-white rounded-xl p-3 shadow-sm">
                  <p className="text-xs font-bold text-gray-800">루트 (Route) 🦊</p>
                  <p className="text-xs text-gray-500 mt-0.5">{ENCOURAGEMENTS[0]}</p>
                </div>
                <p className="text-[10px] text-amber-600/70 mt-2">* 매일 달라지는 격려 문구가 전송됩니다</p>
              </div>

              {/* Test button */}
              <Button
                variant="outline"
                onClick={handleTestNotification}
                disabled={testLoading}
                className="w-full h-11 rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50 font-semibold"
              >
                {testLoading ? '전송 중...' : '🔔 테스트 알림 보내기'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info */}
        <div className="p-4 rounded-2xl bg-secondary/50">
          <p className="text-xs text-muted-foreground leading-relaxed">
            💡 알림은 앱이 열려 있거나 백그라운드에 있을 때 브라우저를 통해 전송됩니다.
            기기를 잠금 해제 상태로 유지하면 더 정확하게 알림을 받을 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}