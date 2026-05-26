import React, { useState, useMemo, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import guestDataPersistence from '@/lib/GuestDataPersistence';
import { ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react';
import DailyLedger from '@/components/daily/DailyLedger';
import DailyMemo from '@/components/daily/DailyMemo';
import DailyMeal from '@/components/daily/DailyMeal';
import DailyDiary from '@/components/daily/DailyDiary';

const DAILY_SECTION_SETTINGS_KEY = 'daily_section_settings_v1';
function loadSectionSettings() {
  try {
    const s = localStorage.getItem(DAILY_SECTION_SETTINGS_KEY);
    return s ? JSON.parse(s) : { showLedger: true, showMeal: true };
  } catch { return { showLedger: true, showMeal: true }; }
}
function saveSectionSettings(settings) {
  localStorage.setItem(DAILY_SECTION_SETTINGS_KEY, JSON.stringify(settings));
}
import { format, addDays, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday as dateFnsIsToday } from 'date-fns';
import html2canvas from 'html2canvas';
import { Share2 } from 'lucide-react';

// 12:00 ~ 23:00 (오전: 12~17, 오후: 18~23)
const AM_HOURS = [12, 13, 14, 15, 16, 17];
const PM_HOURS = [18, 19, 20, 21, 22, 23];
const ALL_HOURS = [...AM_HOURS, ...PM_HOURS];

const CAT_COLORS = {
  exercise: '#f59e0b',
  study: '#3b82f6',
  mental: '#8b5cf6',
  daily: '#10b981',
};

const CAT_LABELS = {
  exercise: '운동',
  study: '공부',
  mental: '정신',
  daily: '일상',
};

const formatHour = (hour) => {
  if (hour === 12) return '12';
  if (hour > 12) return `${hour - 12}`;
  return `${hour}`;
};

// 텍스트별 고유 색상 팔레트 (bg, text 쌍)
const COLOR_PALETTE = [
  { bg: 'rgba(59,130,246,0.18)', text: '#1d4ed8' },   // blue
  { bg: 'rgba(16,185,129,0.18)', text: '#047857' },   // green
  { bg: 'rgba(245,158,11,0.22)', text: '#b45309' },   // amber
  { bg: 'rgba(139,92,246,0.18)', text: '#6d28d9' },   // purple
  { bg: 'rgba(236,72,153,0.18)', text: '#be185d' },   // pink
  { bg: 'rgba(239,68,68,0.18)',  text: '#b91c1c' },   // red
  { bg: 'rgba(20,184,166,0.18)', text: '#0f766e' },   // teal
  { bg: 'rgba(249,115,22,0.18)', text: '#c2410c' },   // orange
];

function getTextColor(text, allTexts) {
  // 같은 날 등장한 고유 텍스트 목록에서 인덱스를 구해 일관된 색 반환
  const unique = [...new Set(allTexts)];
  const idx = unique.indexOf(text);
  return COLOR_PALETTE[idx % COLOR_PALETTE.length];
}

export default function Daily() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sectionSettings, setSectionSettings] = useState(loadSectionSettings);

  const toggleSection = (key) => {
    setSectionSettings(prev => {
      const next = { ...prev, [key]: !prev[key] };
      saveSectionSettings(next);
      return next;
    });
  };
  const [guestVersion] = useState(0);
  // timeBlocks: { [dateKey]: { [hour_slot_half]: text } }
  // cell key = `${hour}_${slot}_${half}` where slot='am'|'pm', half='first'|'second'
  const [timeBlocks, setTimeBlocks] = useState(() => {
    try {
      const saved = localStorage.getItem('daily_timeblocks_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  // pendingCell: { hour, slot, half }
  const [pendingCell, setPendingCell] = useState(null);
  const gridRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 0,
  });

  const isGuest = !user;

  const { data: guestData = {} } = useQuery({
    queryKey: ['guest-daily-data', guestVersion],
    queryFn: () => guestDataPersistence.loadOnboardingData(),
    staleTime: 0,
  });

  const { data: actionGoalsFromServer = [] } = useQuery({
    queryKey: ['actionGoals'],
    queryFn: () => base44.entities.ActionGoal.list().catch(() => []),
  });

  const { data: logsFromServer = [] } = useQuery({
    queryKey: ['allLogs'],
    queryFn: () => base44.entities.ActionLog.list('-date', 500).catch(() => []),
  });

  const logs = isGuest ? (Array.isArray(guestData?.actionLogs) ? guestData.actionLogs : []) : logsFromServer;
  const actionGoals = isGuest ? (guestData?.actionGoals || []) : actionGoalsFromServer;
  const timerGoals = actionGoals.filter((g) => g.action_type === 'timer' && g.status === 'active');

  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const dateKeyRef = React.useRef(dateKey);
  dateKeyRef.current = dateKey;
  const logsForDate = logs.filter((log) => log.date === dateKey);
  const todayBlocks = timeBlocks[dateKey] || {};

  const [inputText, setInputText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // 탭 전환 후 돌아올 때 localStorage에서 최신 데이터 동기화
  useEffect(() => {
    const sync = () => {
      try {
        const saved = localStorage.getItem('daily_timeblocks_v1');
        if (saved) setTimeBlocks(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') sync();
    });
    return () => {
      window.removeEventListener('focus', sync);
    };
  }, []);

  React.useEffect(() => {
    if (!pendingCell) return;
    const onResize = () => {
      if (window.visualViewport) {
        const keyboardH = window.innerHeight - window.visualViewport.height;
        setKeyboardHeight(Math.max(0, keyboardH));
      } else {
        // fallback: assume ~300px keyboard
        setKeyboardHeight(300);
      }
    };
    window.visualViewport?.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('scroll', onResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('scroll', onResize);
      setKeyboardHeight(0);
    };
  }, [pendingCell]);



  const getCellData = (hour, slot, half) => {
    const key = `${hour}_${slot}_${half}`;
    const manual = todayBlocks[key];
    if (manual) return { text: manual, isManual: true };
    return null;
  };

  const setCellText = (hour, slot, half, text) => {
    if (!text.trim()) return;
    const key = `${hour}_${slot}_${half}`;
    const dk = dateKeyRef.current;
    setTimeBlocks((prev) => {
      const next = { ...prev, [dk]: { ...(prev[dk] || {}), [key]: text.trim() } };
      localStorage.setItem('daily_timeblocks_v1', JSON.stringify(next));
      return next;
    });
    setPendingCell(null);
    setInputText('');
  };

  const clearCell = (hour, slot, half) => {
    const key = `${hour}_${slot}_${half}`;
    const dk = dateKeyRef.current;
    setTimeBlocks((prev) => {
      const dayBlocks = { ...(prev[dk] || {}) };
      delete dayBlocks[key];
      const next = { ...prev, [dk]: dayBlocks };
      localStorage.setItem('daily_timeblocks_v1', JSON.stringify(next));
      return next;
    });
  };

  const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(new Date());

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  const shareTimeline = async () => {
    if (!gridRef.current) return;
    try {
      const canvas = await html2canvas(gridRef.current, { backgroundColor: '#fff' });
      const image = canvas.toDataURL('image/png');
      
      // 모바일 공유 API 지원 확인
      if (navigator.share && navigator.canShare) {
        const response = await fetch(image);
        const blob = await response.blob();
        const file = new File([blob], `timeline-${dateKey}.png`, { type: 'image/png' });
        
        navigator.share({
          files: [file],
          title: '나의 일정',
          text: `${format(selectedDate, 'yyyy년 M월 d일')} 일정`
        }).catch(() => {
          // 공유 실패 시 다운로드로 폴백
          downloadImage(image);
        });
      } else {
        downloadImage(image);
      }
    } catch (err) {
      console.error('공유 실패:', err);
    }
  };

  const downloadImage = (imageData) => {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `timeline-${dateKey}.png`;
    link.click();
  };

  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // 달력 날짜 그리드 계산
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  // 기록이 있는 날짜 set
  const datesWithBlocks = useMemo(() => {
    return new Set(Object.keys(timeBlocks).filter(k => Object.keys(timeBlocks[k] || {}).length > 0));
  }, [timeBlocks]);

  return (
    <div className="min-h-full bg-background pb-24">
      {/* 날짜 네비게이션 */}
      <div className="sticky top-0 z-20 bg-background border-b border-border/50 p-4">
        <div className="flex items-center justify-between gap-3">
          <button onClick={goToPreviousDay} className="p-2 rounded-lg hover:bg-secondary transition-colors" aria-label="이전 날짜">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center">
            <p className="text-[0.875rem] text-muted-foreground">
              {format(selectedDate, 'yyyy년 M월 d일')}
            </p>
            {isToday && <p className="text-[0.75rem] text-amber-600 font-semibold">오늘</p>}
          </div>
          <button onClick={goToNextDay} className="p-2 rounded-lg hover:bg-secondary transition-colors" aria-label="다음 날짜">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button onClick={() => setShowCalendar(true)} className="p-2 rounded-lg hover:bg-secondary transition-colors" aria-label="달력 열기">
            <CalendarDays className="w-5 h-5" />
          </button>
          <button onClick={shareTimeline} className="p-2 rounded-lg hover:bg-secondary transition-colors" aria-label="공유">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
        {!isToday && (
          <button onClick={goToToday} className="w-full mt-3 py-2 text-[0.875rem] font-semibold rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors">
            오늘로 이동
          </button>
        )}
      </div>

      {/* 달력 모달 */}
      {showCalendar && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowCalendar(false)}>
          <div className="w-full bg-background rounded-t-2xl p-4 pb-8" onClick={e => e.stopPropagation()}>
            {/* 달력 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCalendarMonth(m => subDays(startOfMonth(m), 1))} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-base font-bold text-foreground">
                {format(calendarMonth, 'yyyy년 M월')}
              </span>
              <button onClick={() => setCalendarMonth(m => addDays(endOfMonth(m), 1))} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
              <button onClick={() => setShowCalendar(false)} className="p-2 rounded-lg hover:bg-secondary transition-colors ml-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 mb-1">
              {['일','월','화','수','목','금','토'].map(d => (
                <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-y-1">
              {calendarDays.map(day => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, calendarMonth);
                const isTodayDay = dateFnsIsToday(day);
                const hasBlocks = datesWithBlocks.has(dayKey);
                return (
                  <button
                    key={dayKey}
                    onClick={() => { setSelectedDate(day); setShowCalendar(false); }}
                    className={`relative flex flex-col items-center justify-center rounded-xl py-2 transition-colors
                      ${isSelected ? 'bg-primary text-primary-foreground' : isTodayDay ? 'bg-amber-100 text-amber-800' : isCurrentMonth ? 'hover:bg-secondary text-foreground' : 'text-muted-foreground/40'}
                    `}
                  >
                    <span className="text-sm font-semibold leading-none">{format(day, 'd')}</span>
                    {hasBlocks && (
                      <span className={`mt-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 텍스트 직접 입력 팝업 */}
      {pendingCell && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => { setPendingCell(null); setInputText(''); }}>
          <div
            className="bg-background rounded-2xl p-4 pb-6 absolute left-4 right-4"
            style={{ bottom: keyboardHeight + 16 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-foreground mb-3">
              {formatHour(pendingCell.hour)}:{pendingCell.half === 'first' ? '00' : '30'} {pendingCell.slot === 'am' ? '낮' : '저녁'} — 내용 입력
            </p>
            <input
              autoFocus
              type="text"
              value={inputText}
              onFocus={() => {
                if (window.visualViewport) {
                  const keyboardH = window.innerHeight - window.visualViewport.height;
                  setKeyboardHeight(Math.max(280, keyboardH));
                } else {
                  setKeyboardHeight(300);
                }
              }}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setCellText(pendingCell.hour, pendingCell.slot, pendingCell.half, inputText);
              }}
              placeholder="활동 내용을 입력하세요"
              className="w-full p-3 rounded-lg border border-border bg-background text-foreground text-sm mb-3 outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setCellText(pendingCell.hour, pendingCell.slot, pendingCell.half, inputText)}
                className="flex-1 p-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm"
              >
                확인
              </button>
              <button
                onClick={() => { setPendingCell(null); setInputText(''); }}
                className="flex-1 p-3 rounded-lg bg-secondary text-foreground font-semibold text-sm"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 타임블록 그리드 */}
      <div className="p-4" ref={gridRef}>
        {/* 헤더 */}
        <div className="flex border border-border rounded-t-lg overflow-hidden mb-0">
          <div className="w-14 shrink-0 bg-secondary/40 border-r border-border py-2 text-center text-xs font-semibold text-foreground">시간</div>
          <div className="flex-1 grid grid-cols-2 divide-x divide-border">
            <div className="py-2 text-center text-xs font-semibold text-foreground">낮 (오전)</div>
            <div className="py-2 text-center text-xs font-semibold text-foreground">저녁 (오후)</div>
          </div>
        </div>
        {/* 서브헤더 */}
        <div className="flex border-x border-b border-border">
          <div className="w-14 shrink-0 border-r border-border" />
          <div className="flex-1 grid grid-cols-4 divide-x divide-border">
            {[':00', ':30', ':00', ':30'].map((label, i) => (
              <div key={i} className="py-1 text-center text-[10px] text-muted-foreground">{label}</div>
            ))}
          </div>
        </div>
        {/* 시간 행들 (오전 낮 그룹) */}
        {(() => {
          // 오늘 블록에서 등장하는 모든 텍스트 수집 (색상 일관성용)
          const allBlockTexts = Object.values(todayBlocks).filter(Boolean);
          return ALL_HOURS.map((hour) => {
          const renderCell = (slot, half) => {
            const data = getCellData(hour, slot, half);
            if (data) {
              const color = getTextColor(data.text, allBlockTexts);
              return (
                <button
                  onClick={() => clearCell(hour, slot, half)}
                  className="w-full h-full rounded font-semibold text-[10px] leading-tight hover:opacity-90 transition-opacity px-0.5 break-words"
                  style={{ backgroundColor: color.bg, color: color.text }}
                >
                  {data.text}
                </button>
              );
            }
            return (
              <button
                onClick={() => setPendingCell({ hour, slot, half })}
                className="w-full h-full rounded text-muted-foreground text-lg hover:bg-secondary/30 transition-colors"
              >
                +
              </button>
            );
          };

          return (
            <div key={hour} className="flex border-x border-b border-border" style={{ minHeight: '44px' }}>
              {/* 시간 숫자 */}
              <div className="w-14 shrink-0 border-r border-border bg-secondary/20 flex items-center justify-center text-base font-bold text-foreground">
                {formatHour(hour)}
              </div>
              {/* 4칸 */}
              <div className="flex-1 grid grid-cols-4 divide-x divide-border">
                <div className="p-0.5">{renderCell('am', 'first')}</div>
                <div className="p-0.5">{renderCell('am', 'second')}</div>
                <div className="p-0.5">{renderCell('pm', 'first')}</div>
                <div className="p-0.5">{renderCell('pm', 'second')}</div>
              </div>
            </div>
          );
        });
        })()}
      </div>

      {/* 메모 섹션 */}
      <div className="mt-2 border-t border-border/50 pt-4">
        <DailyMemo dateKey={dateKey} />
      </div>

      {/* 일기 섹션 */}
      <div className="mt-2 border-t border-border/50 pt-4">
        <DailyDiary dateKey={dateKey} />
      </div>

      {/* 가계부 섹션 */}
      <div className="mt-2 border-t border-border/50">
        <button
          onClick={() => toggleSection('showLedger')}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <span className="text-sm font-bold text-foreground">💰 오늘의 가계부</span>
          <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${sectionSettings.showLedger ? 'bg-primary' : 'bg-border'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${sectionSettings.showLedger ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        </button>
        {sectionSettings.showLedger && (
          <div className="pt-0 pb-4 px-0">
            <DailyLedger dateKey={dateKey} />
          </div>
        )}
      </div>

      {/* 식단 섹션 */}
      <div className="mt-2 border-t border-border/50">
        <button
          onClick={() => toggleSection('showMeal')}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <span className="text-sm font-bold text-foreground">🍽️ 오늘의 식단</span>
          <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${sectionSettings.showMeal ? 'bg-primary' : 'bg-border'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${sectionSettings.showMeal ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        </button>
        {sectionSettings.showMeal && (
          <div className="pt-0 pb-4 px-0">
            <DailyMeal dateKey={dateKey} />
          </div>
        )}
      </div>
    </div>
  );
}