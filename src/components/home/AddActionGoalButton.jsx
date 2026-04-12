import React from 'react';
import { Plus } from 'lucide-react';

export default function AddActionGoalButton({ onClick, categoryLabel }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold"
      style={{
        background: 'linear-gradient(135deg, #f5e6c8 0%, #eedcb0 100%)',
        border: '1.5px dashed #c49a4a',
        color: '#7a5020',
      }}
    >
      <Plus className="w-4 h-4" />
      {categoryLabel} 행동목표 추가
    </button>
  );
}