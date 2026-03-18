import React from 'react';
import { base44 } from '@/api/base44Client';

export default function OnboardingWelcome({ onLogin, onGuestStart }) {
  return (
    <div className="flex flex-col items-center text-center px-6">
      <div className="w-24 h-24 rounded-3xl bg-amber-200/80 border-2 border-amber-400/50 flex items-center justify-center text-5xl mb-6 shadow-lg">
        🦊
      </div>
      <h1 className="text-2xl font-bold text-amber-900 mb-3">루트에 오신 것을 환영합니다</h1>
      <p className="text-muted-foreground leading-relaxed mb-2">
        루트는 당신의 작은 의지를 기억하는 친구입니다.
      </p>
      <p className="text-sm text-muted-foreground/70">
        채찍도, 비교도, 성과 압박도 없습니다.<br />
        "너 오늘도 조금 해냈네." 라고 말해주는 존재.
      </p>
      <div className="space-y-3 mt-8 w-full">
        <button
          onClick={onLogin}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-amber-700 text-amber-50 hover:bg-amber-800 transition-colors flex items-center justify-center gap-2"
          aria-label="로그인"
        >
          로그인하기
        </button>
        <button
          onClick={onGuestStart}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors border-2 border-dashed border-amber-300"
          aria-label="가입없이 시작"
        >
          <span className="mr-2" aria-hidden="true">🦊</span>가입없이 시작
        </button>
      </div>
    </div>
  );
}