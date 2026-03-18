import React from 'react';

export default function OnboardingProgress({ stepIndex, totalSteps }) {
  return (
    <div className="flex gap-1 px-6 pt-6 pb-2">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            i < stepIndex ? 'bg-amber-600' : i === stepIndex ? 'bg-amber-400' : 'bg-secondary'
          }`}
        />
      ))}
    </div>
  );
}