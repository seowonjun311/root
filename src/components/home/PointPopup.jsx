import React from 'react';

export default function PointPopup({ points }) {
  return (
    <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
      <div
        className="px-4 py-2 rounded-full text-sm font-bold animate-bounce"
        style={{ background: '#8b5a20', color: '#fff8e8', boxShadow: '0 4px 12px rgba(80,50,10,0.3)' }}
      >
        +{points} ✦
      </div>
    </div>
  );
}