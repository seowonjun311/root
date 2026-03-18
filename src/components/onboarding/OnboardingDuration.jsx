import React from 'react';

export default function OnboardingDuration({ duration, customDuration, onDurationChange, onCustomChange }) {
  return (
    <div className="px-6">
      <h2 className="text-xl font-bold text-center text-amber-900 mb-2">얼마 동안 도전하시겠습니까?</h2>
      <p className="text-sm text-muted-foreground text-center mb-6">기간을 선택해 주세요</p>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[4, 8, 12, 16, 20, 24].map(weeks => (
          <button
            key={weeks}
            onClick={() => { onDurationChange(weeks * 7); onCustomChange(''); }}
            className={`py-3 rounded-xl font-semibold text-sm transition-all ${
              duration === weeks * 7 && !customDuration ? 'bg-amber-700 text-amber-50 shadow-md' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
            aria-label={`${weeks}주 선택`}
            aria-pressed={duration === weeks * 7 && !customDuration}
          >
            {weeks}주
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-2">
        <input
          type="number"
          min="1"
          max="52"
          value={customDuration}
          onChange={e => { onCustomChange(e.target.value); onDurationChange(0); }}
          placeholder="직접 입력"
          className="flex-1 h-11 rounded-xl border border-input bg-white/80 px-4 text-sm text-center text-amber-900 placeholder:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
        />
        <span className="text-sm font-semibold text-muted-foreground">주</span>
      </div>
      {(customDuration || duration > 0) && (
        <p className="text-xs text-amber-700 font-semibold mt-2 text-center">
          총 {customDuration ? Number(customDuration) * 7 : duration}일 ({customDuration || Math.round(duration / 7)}주)
        </p>
      )}
    </div>
  );
}