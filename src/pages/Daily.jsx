import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import guestDataPersistence from '@/lib/GuestDataPersistence';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';

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
  if (hour === 12) return '12:00';
  if (hour > 12) return `${hour - 12}:00`;
  return `${hour}:00`;
};

export default function Daily() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [guestVersion] = useState(0);
  // timeBlocks: { [dateKey]: { [hour_slot_half]: text } }
  // cell key = `${hour}_${slot}_${half}` where slot='am'|'pm', half='first'|'second'
  const [timeBlocks, setTimeBlocks] = useState({});
  // pendingCell: { hour, slot, half }
  const [pendingCell, setPendingCell] = useState(null);

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
  const logsForDate = logs.filter((log) => log.date === dateKey);
  const todayBlocks = timeBlocks[dateKey] || {};

  const [inputText, setInputText] = useState('');

  const getCellData = (hour, slot, half) => {
    const key = `${hour}_${slot}_${half}`;
    const manual = todayBlocks[key];
    if (manual) return { text: manual, isManual: true };
    return null;
  };

  const setCellText = (hour, slot, half, text) => {
    if (!text.trim()) return;
    const key = `${hour}_${slot}_${half}`;
    setTimeBlocks((prev) => ({
      ...prev,
      [dateKey]: { ...(prev[dateKey] || {}), [key]: text.trim() },
    }));
    setPendingCell(null);
    setInputText('');
  };

  const clearCell = (hour, slot, half) => {
    const key = `${hour}_${slot}_${half}`;
    setTimeBlocks((prev) => {
      const dayBlocks = { ...(prev[dateKey] || {}) };
      delete dayBlocks[key];
      return { ...prev, [dateKey]: dayBlocks };
    });
  };

  const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(new Date());

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  // Unique hours that appear in either AM or PM column
  // Table rows = all hours from 8~20, AM col shows 8~11, PM col shows 12~20
  // We render 13 rows total (one per hour), AM cell empty for PM hours, PM cell empty for AM hours
  // Actually: keep it simple — one row per hour, with AM/PM columns.
  // AM column: show content if hour is 8-11; PM column: show content if hour is 12-20.

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
        </div>
        {!isToday && (
          <button onClick={goToToday} className="w-full mt-3 py-2 text-[0.875rem] font-semibold rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors">
            오늘로 이동
          </button>
        )}
      </div>

      {/* 텍스트 직접 입력 팝업 */}
      {pendingCell && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => { setPendingCell(null); setInputText(''); }}>
          <div className="w-full bg-background rounded-t-2xl p-4" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-foreground mb-3">
              {formatHour(pendingCell.hour)}:{pendingCell.half === 'first' ? '00' : '30'} {pendingCell.slot === 'am' ? '낮' : '저녁'} — 내용 입력
            </p>
            <input
              autoFocus
              type="text"
              value={inputText}
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

      {/* 타임블록 테이블 */}
      <div className="p-4">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-border px-2 py-2 text-xs font-semibold text-foreground text-left w-12">시간</th>
              <th className="border border-border px-1 py-2 text-xs font-semibold text-foreground text-center" colSpan={2}>낮</th>
              <th className="border border-border px-1 py-2 text-xs font-semibold text-foreground text-center" colSpan={2}>저녁</th>
            </tr>
            <tr>
              <th className="border border-border px-2 py-1 text-[10px] text-muted-foreground"></th>
              <th className="border border-border px-1 py-1 text-[10px] text-muted-foreground text-center">:00</th>
              <th className="border border-border px-1 py-1 text-[10px] text-muted-foreground text-center">:30</th>
              <th className="border border-border px-1 py-1 text-[10px] text-muted-foreground text-center">:00</th>
              <th className="border border-border px-1 py-1 text-[10px] text-muted-foreground text-center">:30</th>
            </tr>
          </thead>
          <tbody>
            {ALL_HOURS.map((hour) => {
              const renderHalfCell = (slot, half) => {
                const data = getCellData(hour, slot, half);
                if (data) {
                  return (
                    <button
                      onClick={() => data.isManual && clearCell(hour, slot, half)}
                      className="w-full h-full rounded font-semibold text-[10px] leading-tight hover:opacity-90 transition-opacity bg-primary/20 text-primary px-0.5 break-words"
                    >
                      {data.text}
                    </button>
                  );
                }
                return (
                  <button
                    onClick={() => setPendingCell({ hour, slot, half })}
                    className="w-full h-full rounded text-muted-foreground text-base hover:bg-secondary/30 transition-colors"
                  >
                    +
                  </button>
                );
              };

              return (
                <tr key={hour}>
                  <td className="border border-border px-2 py-0 text-xs font-medium text-foreground whitespace-nowrap w-14">
                    {formatHour(hour)}
                  </td>
                  <td className="border border-border p-0.5 h-10 w-[22%]">{renderHalfCell('am', 'first')}</td>
                  <td className="border border-border p-0.5 h-10 w-[22%]">{renderHalfCell('am', 'second')}</td>
                  <td className="border border-border p-0.5 h-10 w-[22%]">{renderHalfCell('pm', 'first')}</td>
                  <td className="border border-border p-0.5 h-10 w-[22%]">{renderHalfCell('pm', 'second')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}