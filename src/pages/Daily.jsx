import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import guestDataPersistence from '@/lib/GuestDataPersistence';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';

// 8:00 ~ 20:00 (오전: 8~11, 오후: 12~20)
const AM_HOURS = [8, 9, 10, 11];
const PM_HOURS = [12, 13, 14, 15, 16, 17, 18, 19, 20];
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
  if (hour < 12) return `${hour}:00`;
  if (hour === 12) return '12:00';
  return `${hour - 12}:00`;
};

export default function Daily() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [guestVersion] = useState(0);
  // timeBlocks: { [dateKey]: { [hour_am]: cat, [hour_pm]: cat } }
  // Each cell key = `${hour}_am` or `${hour}_pm`
  const [timeBlocks, setTimeBlocks] = useState({});
  // pendingCell: { hour, slot } where slot = 'am' | 'pm'
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

  // auto-filled from logs
  const autoFilledCells = useMemo(() => {
    const filled = {};
    timerGoals.forEach((goal) => {
      logsForDate
        .filter((log) => log.action_goal_id === goal.id)
        .forEach((log) => {
          const hour = new Date(log.created_date || log.createdAt).getHours();
          const slot = hour < 12 ? 'am' : 'pm';
          const key = `${hour}_${slot}`;
          filled[key] = { category: log.category, label: goal.title };
        });
    });
    return filled;
  }, [logsForDate, timerGoals]);

  const getCellData = (hour, slot) => {
    const key = `${hour}_${slot}`;
    const manual = todayBlocks[key];
    if (manual) return { category: manual, isManual: true };
    const auto = autoFilledCells[key];
    if (auto) return { ...auto, isManual: false };
    return null;
  };

  const setCellCategory = (hour, slot, category) => {
    const key = `${hour}_${slot}`;
    setTimeBlocks((prev) => ({
      ...prev,
      [dateKey]: { ...(prev[dateKey] || {}), [key]: category },
    }));
    setPendingCell(null);
  };

  const clearCell = (hour, slot) => {
    const key = `${hour}_${slot}`;
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

      {/* 카테고리 선택 팝업 */}
      {pendingCell && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setPendingCell(null)}>
          <div className="w-full bg-background rounded-t-2xl p-4 space-y-2" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-foreground mb-3">
              {pendingCell.hour}:00 {pendingCell.slot === 'am' ? '오전' : '오후'} — 카테고리 선택
            </p>
            {Object.entries(CAT_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setCellCategory(pendingCell.hour, pendingCell.slot, key)}
                className="w-full p-3 rounded-lg text-white font-semibold"
                style={{ backgroundColor: CAT_COLORS[key] }}
              >
                {label}
              </button>
            ))}
            <button onClick={() => setPendingCell(null)} className="w-full p-3 rounded-lg bg-secondary text-foreground font-semibold">
              취소
            </button>
          </div>
        </div>
      )}

      {/* 타임블록 테이블 */}
      <div className="p-4">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-border px-3 py-3 text-sm font-semibold text-foreground text-left w-16">시간</th>
              <th className="border border-border px-3 py-3 text-sm font-semibold text-foreground text-center">오전</th>
              <th className="border border-border px-3 py-3 text-sm font-semibold text-foreground text-center">오후</th>
            </tr>
          </thead>
          <tbody>
            {ALL_HOURS.map((hour) => {
              const isAmHour = hour < 12;
              const isPmHour = hour >= 12;
              const amData = isAmHour ? getCellData(hour, 'am') : null;
              const pmData = isPmHour ? getCellData(hour, 'pm') : null;

              return (
                <tr key={hour}>
                  <td className="border border-border px-3 py-0 text-sm font-medium text-foreground whitespace-nowrap">
                    {formatHour(hour)}
                  </td>

                  {/* 오전 셀 */}
                  <td className="border border-border p-1 h-14">
                    {isAmHour ? (
                      amData ? (
                        <button
                          onClick={() => amData.isManual && clearCell(hour, 'am')}
                          className="w-full h-full rounded text-white font-semibold text-xs hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: CAT_COLORS[amData.category] }}
                        >
                          {CAT_LABELS[amData.category]}
                        </button>
                      ) : (
                        <button
                          onClick={() => setPendingCell({ hour, slot: 'am' })}
                          className="w-full h-full rounded text-muted-foreground text-lg hover:bg-secondary/30 transition-colors"
                        >
                          +
                        </button>
                      )
                    ) : (
                      <div className="w-full h-full bg-muted/30 rounded" />
                    )}
                  </td>

                  {/* 오후 셀 */}
                  <td className="border border-border p-1 h-14">
                    {isPmHour ? (
                      pmData ? (
                        <button
                          onClick={() => pmData.isManual && clearCell(hour, 'pm')}
                          className="w-full h-full rounded text-white font-semibold text-xs hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: CAT_COLORS[pmData.category] }}
                        >
                          {CAT_LABELS[pmData.category]}
                        </button>
                      ) : (
                        <button
                          onClick={() => setPendingCell({ hour, slot: 'pm' })}
                          className="w-full h-full rounded text-muted-foreground text-lg hover:bg-secondary/30 transition-colors"
                        >
                          +
                        </button>
                      )
                    ) : (
                      <div className="w-full h-full bg-muted/30 rounded" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}