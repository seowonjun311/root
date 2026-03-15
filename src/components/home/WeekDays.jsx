import React from 'react';

const dayLabels = ['월', '화', '수', '목', '금', '토', '일'];

export default function WeekDays({ logs = [] }) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + i);
    return d.toISOString().split('T')[0];
  });

  const todayStr = today.toISOString().split('T')[0];
  const logDates = new Set(logs.map(l => l.date));

  return (
    <div className="flex justify-center gap-2 px-4 py-2">
      {weekDates.map((date, i) => {
        const isToday = date === todayStr;
        const done = logDates.has(date);
        return (
          <div
            key={date}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all
              ${isToday
                ? 'bg-amber-700 text-amber-50 ring-2 ring-amber-400/50 shadow-md'
                : done
                  ? 'bg-amber-200/80 text-amber-800'
                  : 'bg-secondary/60 text-muted-foreground'}`}
          >
            {dayLabels[i]}
          </div>
        );
      })}
    </div>
  );
}