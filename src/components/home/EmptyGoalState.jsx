import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function EmptyGoalState({ category, onCreateGoal }) {
  const categoryNames = {
    exercise: '운동',
    study: '공부',
    mental: '정신',
    daily: '일상',
  };

  return (
    <div className="mx-4 mt-6 flex flex-col items-center gap-4">
      {/* 스크롤 배너 */}
      <div className="w-full py-3 px-6 text-center rounded-sm" style={{
        background: 'linear-gradient(90deg, #c49a4a 0%, #e8d090 15%, #f5e6c8 50%, #e8d090 85%, #c49a4a 100%)',
        borderTop: '3px solid #8a6020',
        borderBottom: '3px solid #8a6020',
        boxShadow: '0 2px 8px rgba(80,50,10,0.3), inset 0 1px 3px rgba(255,240,180,0.5)',
      }}>
        <p className="font-bold text-base" style={{ color: '#4a2c08', textShadow: '0 1px 2px rgba(255,220,150,0.5)' }}>
          {categoryNames[category]} 목표를 세워보세요
        </p>
      </div>

      {/* 양피지 카드 */}
      <div className="w-full p-6 rounded-lg flex flex-col items-center gap-4" style={{
        background: 'linear-gradient(135deg, #f5e6c8 0%, #eedcb0 40%, #e8d4a0 70%, #f0e0bc 100%)',
        border: '2px solid #a07840',
        boxShadow: 'inset 0 1px 3px rgba(255,240,180,0.6), 0 3px 8px rgba(80,50,10,0.25)',
      }}>
        <div className="text-5xl">🦊</div>
        <div className="text-center">
          <p className="font-bold text-base" style={{ color: '#4a2c08' }}>아직 목표가 없습니다.</p>
          <p className="text-sm mt-1" style={{ color: '#7a5030' }}>용사님의 여정을 시작해 보세요!</p>
        </div>
        <button
          onClick={onCreateGoal}
          className="px-8 py-3 rounded-lg font-bold text-sm transition-all active:scale-95"
          style={{
            background: 'linear-gradient(180deg, #c49a4a 0%, #a07830 50%, #8a6520 100%)',
            border: '2px solid #6b4e15',
            boxShadow: 'inset 0 1px 2px rgba(255,220,120,0.4), 0 3px 6px rgba(60,35,5,0.4)',
            color: '#fff8e8',
            textShadow: '0 1px 2px rgba(60,30,5,0.5)',
          }}
        >
          ✦ 목표 만들기
        </button>
      </div>
    </div>
  );
}