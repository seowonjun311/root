import React from 'react';
import { Grid3x3, Maximize } from 'lucide-react';

export default function GridGuideToggle({ showGrid, onToggleGrid, showSymmetry, onToggleSymmetry }) {
  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-2">
      <button
        onClick={onToggleGrid}
        className={`p-3 rounded-full shadow-lg transition-all ${
          showGrid
            ? 'bg-amber-500 text-white'
            : 'bg-white text-amber-700 hover:bg-amber-50'
        }`}
        title="격자선 표시/숨기기"
        aria-label="격자선 표시/숨기기"
      >
        <Grid3x3 className="w-5 h-5" />
      </button>
      
      <button
        onClick={onToggleSymmetry}
        className={`p-3 rounded-full shadow-lg transition-all ${
          showSymmetry
            ? 'bg-blue-500 text-white'
            : 'bg-white text-blue-700 hover:bg-blue-50'
        }`}
        title="대칭 가이드 표시/숨기기"
        aria-label="대칭 가이드 표시/숨기기"
      >
        <Maximize className="w-5 h-5" />
      </button>
    </div>
  );
}