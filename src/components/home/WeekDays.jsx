import React from 'react';

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

function getWeekDates() {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + i);
    return d.toISOString().split('T')[0];
  });
}

export default function WeekDays({ logs = [], weeklyTarget = 7 }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const weekDates = getWeekDates();
  const doneDates = new Set((logs || []).map((log) => log.date));
  const weeklyCount = weekDates.filter((date) => doneDates.has(date)).length;
  const progressPercent = Math.min(100, Math.round((weeklyCount / Math.max(1, weeklyTarget)) * 100));

  return (
    <div className="mt-2 rounded-xl px-3 py-2.5" style={{
      background: 'rgba(255,248,232,0.72)',
      border: '1px solid rgba(160,120,64,0.18)',
    }}>
      <div className="flex items-center justify-between mb-2">
        <div
          className="text-[11px] font-bold"
          style={{ color: '#7a5020' }}
        >
          이번 주 진행
        </div>

        <div
          className="text-[11px] font-bold"
          style={{ color: '#8f6a33' }}
        >
          {weeklyCount}/{weeklyTarget}
        </div>
      </div>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full mb-2.5"
        style={{ background: 'rgba(122,80,32,0.12)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progressPercent}%`,
            background: 'linear-gradient(90deg, #8b5a20 0%, #c98a2b 55%, #e1b44f 100%)',
          }}
        />
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {weekDates.map((date, index) => {
          const isToday = date === todayStr;
          const isDone = doneDates.has(date);
          const isFuture = date > todayStr;

          return (
            <div key={date} className="flex flex-col items-center gap-1">
              <span
                className="text-[10px] font-semibold"
                style={{ color: isToday ? '#7a5020' : '#9a7b47' }}
              >
                {DAY_LABELS[index]}
              </span>

              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all"
                style={
                  isDone
                    ? {
                        background: 'linear-gradient(180deg, #c49a4a 0%, #a07830 100%)',
                        border: '1.5px solid #7a5820',
                        color: '#fffaf0',
                        boxShadow: 'inset 0 1px 2px rgba(255,240,190,0.3)',
                      }
                    : isToday
                      ? {
                          background: '#fff1c7',
                          border: '1.5px solid #d29b38',
                          color: '#7a5020',
                        }
                      : isFuture
                        ? {
                            background: 'rgba(255,255,255,0.45)',
                            border: '1px dashed rgba(160,120,64,0.18)',
                            color: '#d1c1a6',
                          }
                        : {
                            background: 'rgba(120,80,20,0.06)',
                            border: '1px solid rgba(120,80,20,0.14)',
                            color: '#b59766',
                          }
                }
              >
                {isDone ? '✓' : isToday ? '●' : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
