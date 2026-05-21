import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import guestDataPersistence from '@/lib/GuestDataPersistence';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

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

  const { data: logsFromServer = [] } = useQuery({
    queryKey: ['allLogs'],
    queryFn: () => base44.entities.ActionLog.list('-date', 500).catch(() => []),
  });

  const guestLogs = Array.isArray(guestData?.actionLogs) ? guestData.actionLogs : [];
  const logs = isGuest ? guestLogs : logsFromServer;

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const logsForDate = logs.filter((log) => log.date === dateStr);

  const hourlyData = useMemo(() => {
    const data = {};
    HOURS.forEach((hour) => {
      data[hour] = [];
    });

    logsForDate.forEach((log) => {
      if (log.duration_minutes) {
        const startHour = Math.floor((log.start_hour || 0) % 24);
        const durationHours = Math.ceil(log.duration_minutes / 60);
        for (let i = 0; i < durationHours; i++) {
          const hour = (startHour + i) % 24;
          if (!data[hour].find((l) => l.id === log.id)) {
            data[hour].push(log);
          }
        }
      }
    });

    return data;
  }, [logsForDate]);

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

      <div className="p-4 space-y-1">
        {/* 오전 (0시-11시) */}
        <div>
          <h2 className="text-[0.875rem] font-bold text-amber-900 mb-2 px-2">오전</h2>
          <div className="space-y-1">
            {HOURS.slice(0, 12).map((hour) => {
              const hoursLogs = hourlyData[hour] || [];
              const hasLogs = hoursLogs.length > 0;

              return (
                <div
                  key={`am-${hour}`}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-10 text-[0.75rem] font-semibold text-muted-foreground text-right shrink-0">
                    {hour}:00
                  </div>

                  <div
                    className="flex-1 h-10 rounded-lg bg-secondary/30 flex items-center px-2 gap-1 overflow-x-auto"
                    style={{
                      backgroundColor: hasLogs ? 'rgba(250, 204, 21, 0.1)' : undefined,
                    }}
                  >
                    {hasLogs ? (
                      <div className="flex items-center gap-1 min-w-max">
                        {hoursLogs.map((log) => (
                          <span
                            key={log.id}
                            className="text-[0.625rem] px-1.5 py-0.5 rounded text-white font-semibold shrink-0"
                            style={{
                              backgroundColor: CAT_COLORS[log.category] || '#6b7280',
                            }}
                          >
                            {CAT_LABELS[log.category] || '기타'}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[0.625rem] text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 오후 (12시-23시) */}
        <div className="mt-6">
          <h2 className="text-[0.875rem] font-bold text-amber-900 mb-2 px-2">오후</h2>
          <div className="space-y-1">
            {HOURS.slice(12, 24).map((hour) => {
              const hoursLogs = hourlyData[hour] || [];
              const hasLogs = hoursLogs.length > 0;
              const displayHour = hour === 12 ? 12 : hour - 12;

              return (
                <div
                  key={`pm-${hour}`}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-10 text-[0.75rem] font-semibold text-muted-foreground text-right shrink-0">
                    {displayHour}:00
                  </div>

                  <div
                    className="flex-1 h-10 rounded-lg bg-secondary/30 flex items-center px-2 gap-1 overflow-x-auto"
                    style={{
                      backgroundColor: hasLogs ? 'rgba(250, 204, 21, 0.1)' : undefined,
                    }}
                  >
                    {hasLogs ? (
                      <div className="flex items-center gap-1 min-w-max">
                        {hoursLogs.map((log) => (
                          <span
                            key={log.id}
                            className="text-[0.625rem] px-1.5 py-0.5 rounded text-white font-semibold shrink-0"
                            style={{
                              backgroundColor: CAT_COLORS[log.category] || '#6b7280',
                            }}
                          >
                            {CAT_LABELS[log.category] || '기타'}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[0.625rem] text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 카테고리 범례 */}
        <div className="mt-8 p-4 rounded-xl bg-secondary/20 border border-border/30">
          <p className="text-[0.75rem] font-semibold text-amber-900 mb-2">카테고리</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CAT_LABELS).map(([key, label]) => (
              <span
                key={key}
                className="text-[0.625rem] px-2 py-1 rounded text-white font-semibold"
                style={{ backgroundColor: CAT_COLORS[key] }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}