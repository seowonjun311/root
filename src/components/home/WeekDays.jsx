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

export default function WeekDays({ logs = [] }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const weekDates = getWeekDates();
  const doneDates = new Set((logs || []).map((log) => log.date));

  return (
    <div
      className="mt-2 rounded-xl px-2.5 py-2"
      style={{
        background: 'rgba(255,248,232,0.52)',
        border: '1px solid rgba(160,120,64,0.12)',
      }}
    >
      <div className="grid grid-cols-7 gap-1">
        {weekDates.map((date, index) => {
          const isToday = date === todayStr;
          const isDone = doneDates.has(date);
          const isFuture = date > todayStr;

          return (
            <div key={date} className="flex flex-col items-center gap-1">
              <span
                className="text-[9px] font-semibold leading-none"
                style={{ color: isToday ? '#7a5020' : '#9a7b47' }}
              >
                {DAY_LABELS[index]}
              </span>

              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-all"
                style={
                  isDone
                    ? {
                        background: 'linear-gradient(180deg, #c49a4a 0%, #a07830 100%)',
                        border: '1.2px solid #7a5820',
                        color: '#fffaf0',
                      }
                    : isToday
                      ? {
                          background: '#fff1c7',
                          border: '1.2px solid #d29b38',
                          color: '#7a5020',
                        }
                      : isFuture
                        ? {
                            background: 'rgba(255,255,255,0.3)',
                            border: '1px dashed rgba(160,120,64,0.14)',
                            color: '#d1c1a6',
                          }
                        : {
                            background: 'rgba(120,80,20,0.04)',
                            border: '1px solid rgba(120,80,20,0.1)',
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
