import React from 'react';

function getSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

const seasonConfig = {
  spring: { emoji: '🌸', bg: 'from-pink-100/80 via-amber-50/60 to-green-100/40', label: '봄' },
  summer: { emoji: '☀️', bg: 'from-sky-100/80 via-emerald-50/60 to-amber-50/40', label: '여름' },
  autumn: { emoji: '🍂', bg: 'from-orange-100/80 via-amber-100/60 to-yellow-50/40', label: '가을' },
  winter: { emoji: '❄️', bg: 'from-blue-100/80 via-slate-50/60 to-white/40', label: '겨울' },
};

export default function CharacterBanner({ nickname, message }) {
  const season = getSeason();
  const config = seasonConfig[season];

  return (
    <div className={`relative overflow-hidden rounded-b-3xl bg-gradient-to-b ${config.bg} p-6 pb-8`}>
      <div className="absolute top-2 right-3 text-2xl opacity-60">{config.emoji}</div>
      
      <div className="flex items-start gap-4 mt-2">
        <div className="w-16 h-16 rounded-2xl bg-amber-200/80 border-2 border-amber-400/50 flex items-center justify-center text-3xl shadow-lg">
          🦊
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg text-amber-900 truncate">
            {nickname || '용사님'}
          </h2>
          <p className="text-sm text-amber-700/80 mt-1 leading-relaxed">
            {message || '당신을 기다리고 있습니다.'}
          </p>
        </div>
      </div>
    </div>
  );
}