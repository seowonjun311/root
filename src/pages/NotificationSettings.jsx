import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronLeft, Bell, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

const DEFAULT_SETTINGS = {
  enabled: false,
  time: '09:00',
  days: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false },
  customMessage: '',
};

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem('notificationSettings') || 'null') || {}) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings) {
  localStorage.setItem('notificationSettings', JSON.stringify(settings));
}

const isNotificationSupported = () => typeof window !== 'undefined' && 'Notification' in window;

function scheduleNotifications(settings) {
  if (!isNotificationSupported()) return;
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
        const msg = settings.customMessage || '🦊 오늘도 한 걸음! 용사님의 여정을 응원합니다.';
        new Notification('루트 (Route) 🦊', { body: msg, icon: '/favicon.ico' });
      }
    }, ms);
    timerIds.push(id);
  });
  localStorage.setItem('notifTimerIds', JSON.stringify(timerIds));
}

// 드럼롤 스크롤 피커
function DrumPicker({ items, value, onChange }) {
  const ITEM_HEIGHT = 40;
  const VISIBLE = 5;
  const listRef = useRef(null);
  const selectedIndex = items.indexOf(value);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = selectedIndex * ITEM_HEIGHT;
    }
  }, []);

  const handleScroll = () => {
    if (!listRef.current) return;
    const idx = Math.round(listRef.current.scrollTop / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    if (items[clamped] !== value) onChange(items[clamped]);
  };

  return (
    <div className="relative" style={{ height: ITEM_HEIGHT * VISIBLE }}>
      {/* 선택 영역 하이라이트 */}
      <div
        className="absolute left-0 right-0 pointer-events-none rounded-lg bg-amber-700/15 border border-amber-700/30"
        style={{ top: ITEM_HEIGHT * 2, height: ITEM_HEIGHT }}
      />
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll scrollbar-hide snap-y snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* 패딩 */}
        <div style={{ height: ITEM_HEIGHT * 2 }} />
        {items.map((item) => (
          <div
            key={item}
            className={`flex items-center justify-center snap-center font-bold transition-all cursor-pointer ${
              item === value ? 'text-amber-900 text-2xl' : 'text-muted-foreground/40 text-lg'
            }`}
            style={{ height: ITEM_HEIGHT }}
            onClick={() => {
              onChange(item);
              if (listRef.current) {
                listRef.current.scrollTop = items.indexOf(item) * ITEM_HEIGHT;
              }
            }}
          >
            {item}
          </div>
        ))}
        {/* 패딩 */}
        <div style={{ height: ITEM_HEIGHT * 2 }} />
      </div>
    </div>
  );
}

export default function NotificationSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(loadSettings);
  const [permission, setPermission] = useState(
    isNotificationSupported() ? window.Notification.permission : 'unsupported'
  );
  const [testLoading, setTestLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [switchPending, setSwitchPending] = useState(false);

  const [pendingHour, setPendingHour] = useState(settings.time.split(':')[0]);
  const [pendingMinute, setPendingMinute] = useState(settings.time.split(':')[1]);
  const [pendingDays, setPendingDays] = useState(settings.days);
  const [pendingMessage, setPendingMessage] = useState(settings.customMessage || '');

  useEffect(() => {
    if (!isNotificationSupported()) return;
    const syncPermission = () => setPermission(window.Notification.permission);
    syncPermission();
    window.addEventListener('focus', syncPermission);
    return () => window.removeEventListener('focus', syncPermission);
  }, []);

  const requestPermission = async () => {
    if (!isNotificationSupported()) { toast.error('이 브라우저는 알림을 지원하지 않습니다.'); return; }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') toast.success('알림 권한이 허용되었습니다!');
    else toast.error('알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.');
  };

  const openDialog = (isNew = false) => {
    if (isNew) setSwitchPending(true);
    setPendingHour(settings.time.split(':')[0]);
    setPendingMinute(settings.time.split(':')[1]);
    setPendingDays({ ...settings.days });
    setPendingMessage(settings.customMessage || '');
    setShowDialog(true);
  };

  const handleDialogConfirm = async () => {
    if (!isNotificationSupported()) {
      toast.error('이 브라우저는 알림을 지원하지 않습니다.');
      return;
    }
    let currentPermission = Notification.permission;
    if (currentPermission !== 'granted') {
      currentPermission = await Notification.requestPermission();
      setPermission(currentPermission);
      if (currentPermission !== 'granted') {
        toast.error('알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.');
        return;
      }
    }
    const next = {
      ...settings,
      enabled: true,
      time: `${pendingHour}:${pendingMinute}`,
      days: pendingDays,
      customMessage: pendingMessage,
    };
    setSettings(next);
    saveSettings(next);
    scheduleNotifications(next);
    setSwitchPending(false);
    setShowDialog(false);
    toast.success('알림이 설정되었습니다.');
  };

  const handleDialogCancel = () => {
    setSwitchPending(false);
    setShowDialog(false);
  };

  const handleDisable = () => {
    const next = { ...settings, enabled: false };
    setSettings(next);
    saveSettings(next);
    scheduleNotifications(next);
    toast.success('알림이 비활성화되었습니다.');
  };

  const handleTestNotification = async () => {
    if (permission !== 'granted') {
      await requestPermission();
      if (Notification.permission !== 'granted') return;
      setPermission('granted');
    }
    setTestLoading(true);
    setTimeout(() => {
      const msg = settings.customMessage || '🦊 오늘도 한 걸음! 용사님의 여정을 응원합니다.';
      new Notification('루트 (Route) 🦊', { body: msg, icon: '/favicon.ico' });
      setTestLoading(false);
      toast.success('테스트 알림을 전송했습니다!');
    }, 500);
  };

  const activeCount = Object.values(settings.days).filter(Boolean).length;
  const pendingActiveCount = Object.values(pendingDays).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      {/* 알림 설정 다이얼로그 */}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) handleDialogCancel(); }}>
        <DialogContent className="max-w-sm rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-center">🔔 알림 설정</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-1">
            {/* 시간 설정 */}
            <div>
              <p id="time-label" className="text-xs font-bold text-amber-800 mb-2">⏰ 시간 설정</p>
              <div className="flex items-center justify-center gap-2 bg-secondary/40 rounded-2xl px-4 py-1" aria-labelledby="time-label">
                <div className="w-16">
                  <DrumPicker items={HOURS} value={pendingHour} onChange={setPendingHour} aria-label="시간" />
                </div>
                <span className="text-2xl font-bold text-amber-900 pb-1" aria-hidden="true">:</span>
                <div className="w-16">
                  <DrumPicker items={MINUTES} value={pendingMinute} onChange={setPendingMinute} aria-label="분" />
                </div>
              </div>
            </div>

            {/* 요일 설정 */}
            <div>
              <p id="days-label" className="text-xs font-bold text-amber-800 mb-2">📅 요일 설정</p>
              <div className="flex gap-1.5" role="group" aria-labelledby="days-label" aria-describedby="days-helper">
                {DAY_KEYS.map((key, i) => (
                  <button
                    key={key}
                    onClick={() => setPendingDays(prev => ({ ...prev, [key]: !prev[key] }))}
                    className={`flex-1 flex flex-col items-center py-2 rounded-xl text-xs font-bold transition-all gap-1 ${
                      pendingDays[key] ? 'bg-amber-700 text-amber-50' : 'bg-secondary/70 text-muted-foreground'
                    }`}
                    aria-pressed={pendingDays[key]}
                  >
                    <span>{DAYS[i]}</span>
                    <span className="text-[10px]" aria-hidden="true">{pendingDays[key] ? '✓' : ''}</span>
                  </button>
                ))}
              </div>
              <p id="days-helper" className="text-[10px] text-muted-foreground text-center mt-1.5">
                {pendingActiveCount === 0 ? '최소 하루는 선택해주세요' : `주 ${pendingActiveCount}회 알림`}
              </p>
            </div>

            {/* 메시지 */}
            <div>
              <p id="message-label" className="text-xs font-bold text-amber-800 mb-2">💬 메시지</p>
              <div className="relative">
                <textarea
                  id="message-input"
                  value={pendingMessage}
                  onChange={e => setPendingMessage(e.target.value.slice(0, 20))}
                  placeholder="20자 이내 알림 메시지 (비우면 기본 문구)"
                  className="w-full h-16 rounded-xl border border-input bg-secondary/40 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/50 placeholder:text-muted-foreground/50"
                  maxLength={20}
                  aria-labelledby="message-label"
                  aria-describedby="message-counter"
                />
                <span id="message-counter" className="absolute bottom-2 right-3 text-[10px] text-muted-foreground" aria-live="polite">
                  {pendingMessage.length} / 20
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 mt-1">
            <Button variant="outline" onClick={handleDialogCancel} className="flex-1 rounded-xl">취소</Button>
            <Button
              onClick={handleDialogConfirm}
              disabled={pendingActiveCount === 0}
              className="flex-1 rounded-xl bg-amber-700 hover:bg-amber-800 text-amber-50"
            >
              ✓ 확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="px-4 space-y-4 pb-8" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* Permission banners */}
        {permission === 'unsupported' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-red-50 border border-red-200">
            <p className="text-sm font-semibold text-red-700 mb-1">알림을 지원하지 않는 환경이에요</p>
            <p className="text-xs text-red-500">Chrome, Edge 등의 브라우저에서 이용해주세요.</p>
          </motion.div>
        )}
        {permission !== 'granted' && permission !== 'unsupported' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <p className="text-sm font-semibold text-amber-800 mb-1">알림 권한이 필요해요</p>
            <p className="text-xs text-amber-600 mb-3">
              {permission === 'denied' ? '브라우저 설정 → 사이트 권한에서 알림을 허용해주세요.' : '목표 달성 알림을 받으려면 권한을 허용해주세요.'}
            </p>
            {permission !== 'denied' && (
              <Button size="sm" onClick={requestPermission} className="bg-amber-700 hover:bg-amber-800 text-amber-50 rounded-xl h-8 text-xs">
                권한 허용하기
              </Button>
            )}
          </motion.div>
        )}

        {/* 비활성화 상태 */}
        {!settings.enabled && !switchPending && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="text-center">
              <p className="text-4xl mb-3">🔕</p>
              <p className="text-sm font-semibold text-foreground">설정된 알림이 없습니다.</p>
              <p className="text-xs text-muted-foreground mt-1">알림을 추가하면 목표 달성을 도와드려요.</p>
            </div>
            <Button
              onClick={() => openDialog(true)}
              className="h-12 px-8 rounded-2xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold text-base gap-2"
              aria-label="새 알림 추가 설정"
            >
              <Bell className="w-5 h-5" aria-hidden="true" />
              알림 추가
            </Button>
          </motion.div>
        )}

        {/* 활성화 상태 */}
        <AnimatePresence>
          {settings.enabled && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="space-y-4"
            >
              {/* 현재 설정 카드 */}
              <div className="p-5 rounded-2xl bg-card border border-border/60">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-600" />
                    <p className="font-semibold text-sm">현재 알림 설정</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => openDialog(false)} 
                      className="text-xs font-semibold text-amber-700 hover:underline"
                      aria-label="알림 설정 수정"
                    >
                      수정
                    </button>
                    <Switch 
                      checked={settings.enabled} 
                      onCheckedChange={(v) => { if (!v) handleDisable(); }}
                      aria-label="알림 활성화/비활성화 토글"
                    />
                  </div>
                </div>
                <p className="text-2xl font-bold text-amber-900 mb-2">{settings.time}</p>
                <div className="flex gap-1.5 mb-3" role="group" aria-label="활성화된 요일">
                  {DAY_KEYS.map((key, i) => (
                    <span 
                      key={key} 
                      className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold ${
                        settings.days[key] ? 'bg-amber-700 text-amber-50' : 'bg-secondary/70 text-muted-foreground'
                      }`}
                      role="img"
                      aria-label={`${DAYS[i]}${settings.days[key] ? ' 활성화' : ' 비활성화'}`}
                      aria-hidden={false}
                    >
                      {DAYS[i]}
                    </span>
                  ))}
                </div>
                {settings.customMessage && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60">
                    <p className="text-xs text-amber-800">💬 {settings.customMessage}</p>
                  </div>
                )}
              </div>

              {/* 알림 미리보기 */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/60">
                <p className="text-xs font-semibold text-amber-700 mb-2">📱 알림 미리보기</p>
                <div className="bg-white rounded-xl p-3 shadow-sm">
                  <p className="text-xs font-bold text-gray-800">루트 (Route) 🦊</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {settings.customMessage || '🦊 오늘도 한 걸음! 용사님의 여정을 응원합니다.'}
                  </p>
                </div>
              </div>

              {/* 테스트 버튼 */}
              <Button
                variant="outline"
                onClick={handleTestNotification}
                disabled={testLoading}
                className="w-full h-11 rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50 font-semibold"
                aria-label={testLoading ? '테스트 알림 전송 중' : '테스트 알림 보내기'}
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
          </p>
        </div>
      </div>
    </div>
  );
}