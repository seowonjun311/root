import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import guestDataPersistence from '@/lib/GuestDataPersistence';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';

const HOURS = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const getTimeDisplay = (hour) => {
  if (hour === 0) return '12:00 AM';
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
};

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

export default function Daily() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [guestVersion, setGuestVersion] = useState(0);
  const [timeBlocks, setTimeBlocks] = useState({});
  const [selectedHour, setSelectedHour] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const queryClient = useQueryClient();

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

  const guestLogs = Array.isArray(guestData?.actionLogs) ? guestData.actionLogs : [];
  const logs = isGuest ? guestLogs : logsFromServer;
  const actionGoals = isGuest ? (guestData?.actionGoals || []) : actionGoalsFromServer;
  
  // 시간 누적형 목표 필터링 (timer 타입)
  const timerGoals = actionGoals.filter((goal) => goal.action_type === 'timer' && goal.status === 'active');

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const logsForDate = logs.filter((log) => log.date === dateStr);

  // 타임블로킹 로컬 상태
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const todayBlocks = timeBlocks[dateKey] || {};

  // 시간 누적형 목표 자동 표시 (실제 로그 기반)
  const autoFilledHours = useMemo(() => {
    const filled = {};
    timerGoals.forEach((goal) => {
      const logsForGoal = logsForDate.filter((log) => log.action_goal_id === goal.id);
      logsForGoal.forEach((log) => {
        const hour = new Date(log.createdAt).getHours();
        filled[hour] = { goalId: goal.id, category: log.category, label: goal.title };
      });
    });
    return filled;
  }, [logsForDate, timerGoals]);

  const addTimeBlock = (hour, category) => {
    setTimeBlocks((prev) => ({
      ...prev,
      [dateKey]: { ...prev[dateKey], [hour]: category },
    }));
    setSelectedHour(null);
    setSelectedCategory(null);
  };

  const removeTimeBlock = (hour) => {
    setTimeBlocks((prev) => ({
      ...prev,
      [dateKey]: { ...prev[dateKey], [hour]: undefined },
    }));
  };

  const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(new Date());

  return (
    <div className="min-h-full bg-background pb-24">
      {/* 날짜 네비게이션 */}
      <div className="sticky top-0 z-20 bg-background border-b border-border/50 p-4">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={goToPreviousDay}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="이전 날짜"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 text-center">
            <p className="text-[0.875rem] text-muted-foreground">
              {format(selectedDate, 'yyyy년 M월 d일')} ({format(selectedDate, 'EEEE', { locale: new Intl.Locale('ko') })})
            </p>
            {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && (
              <p className="text-[0.75rem] text-amber-600 font-semibold">오늘</p>
            )}
          </div>

          <button
            onClick={goToNextDay}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="다음 날짜"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {format(selectedDate, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd') && (
          <button
            onClick={goToToday}
            className="w-full mt-3 py-2 text-[0.875rem] font-semibold rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
          >
            오늘로 이동
          </button>
        )}
      </div>

      <div className="p-4 space-y-6">
        {selectedHour !== null && selectedCategory === null ? (
          <div className="fixed inset-0 bg-black/50 flex items-end z-50">
            <div className="w-full bg-background rounded-t-2xl p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground mb-3">카테고리 선택</p>
              {Object.entries(CAT_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => addTimeBlock(selectedHour, key)}
                  className="w-full p-3 rounded-lg text-white font-semibold"
                  style={{ backgroundColor: CAT_COLORS[key] }}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => setSelectedHour(null)}
                className="w-full p-3 rounded-lg bg-secondary text-foreground font-semibold"
              >
                취소
              </button>
            </div>
          </div>
        ) : null}

        {/* 24시간 타임블록 */}
        <div className="space-y-2">
          {HOURS.map((hour) => {
            const blockCategory = todayBlocks[hour];
            const autoFilled = autoFilledHours[hour];
            const displayBlock = blockCategory ? { category: blockCategory, isManual: true } : autoFilled ? { ...autoFilled, isManual: false } : null;

            return (
              <div key={`hour-${hour}`} className="flex items-center gap-3 px-2">
                <div className="w-16 text-[0.75rem] font-semibold text-muted-foreground text-right shrink-0">
                  {getTimeDisplay(hour)}
                </div>

                {displayBlock ? (
                  <button
                    onClick={() => blockCategory && removeTimeBlock(hour)}
                    className="flex-1 h-12 rounded-lg text-white font-semibold text-xs flex items-center justify-between px-3 hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: CAT_COLORS[displayBlock.category] }}
                  >
                    <span>{CAT_LABELS[displayBlock.category]}</span>
                    {blockCategory && <X className="w-4 h-4" />}
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedHour(hour)}
                    className="flex-1 h-12 rounded-lg bg-secondary/30 border-2 border-dashed border-secondary text-muted-foreground text-xs font-semibold hover:bg-secondary/50 transition-colors"
                  >
                    +
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}