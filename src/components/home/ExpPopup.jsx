import React from 'react';

export default function ExpPopup({ exp }) {
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
      <div
        className="px-4 py-2 rounded-full text-sm font-bold animate-bounce"
        style={{ background: '#c49a4a', color: '#fff', boxShadow: '0 4px 12px rgba(80,50,10,0.3)' }}
      >
        +{exp} XP
      </div>
    </div>
  );
}