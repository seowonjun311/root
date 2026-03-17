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
    <div className="mx-4 rounded-lg overflow-hidden" style={{
      background: 'linear-gradient(135deg, #f5e6c8 0%, #eedcb0 60%, #f0e0bc 100%)',
      border: '2px solid #a07840',
      boxShadow: 'inset 0 1px 3px rgba(255,240,180,0.6), 0 2px 6px rgba(80,50,10,0.2)',
    }}>
      <div className="flex justify-center gap-1.5 px-3 py-2.5">
        {weekDates.map((date, i) => {
          const isToday = date === todayStr;
          const done = logDates.has(date);
          return (
            <div
              key={date}
              className="w-9 h-9 rounded-md flex items-center justify-center text-xs font-bold transition-all"
              style={isToday ? {
                background: 'linear-gradient(180deg, #8b5e20 0%, #6b4010 100%)',
                border: '2px solid #3d2008',
                boxShadow: 'inset 0 1px 2px rgba(255,200,100,0.3)',
                color: '#ffe8a0',
              } : done ? {
                background: 'linear-gradient(180deg, #c49a4a 0%, #a07830 100%)',
                border: '2px solid #7a5820',
                color: '#fff8e8',
                textShadow: '0 1px 1px rgba(60,30,5,0.4)',
              } : {
                background: 'rgba(120,80,20,0.1)',
                border: '1px solid rgba(120,80,20,0.25)',
                color: '#a07840',
              }}
            >
              {dayLabels[i]}
            </div>
          );
        })}
      </div>
    </div>
  );
}