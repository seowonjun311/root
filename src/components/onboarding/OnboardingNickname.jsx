import React from 'react';
import { Input } from '@/components/ui/input';

export default function OnboardingNickname({ value, onChange }) {
  return (
    <div className="flex flex-col items-center px-6">
      <div className="w-20 h-20 rounded-3xl bg-amber-200/80 border-2 border-amber-400/50 flex items-center justify-center text-4xl mb-6 shadow-lg">
        🦊
      </div>
      <h2 className="text-xl font-bold text-amber-900 mb-2">이 여정을 함께 걸을 이름을 정해주세요</h2>
      <p className="text-sm text-muted-foreground text-center mb-6">루트에서 당신을 어떻게 부르면 될까요?</p>
      <Input
        value={value}
        onChange={onChange}
        placeholder="닉네임 입력"
        maxLength={12}
        className="h-12 rounded-xl text-center text-lg border-amber-300 bg-white/80 max-w-xs text-amber-900 placeholder:text-amber-300"
      />
      <p className="text-xs text-muted-foreground mt-3">예시: 성장의길 / 턱걸이10 / 루트워커</p>
      <p className="text-xs text-muted-foreground/60 mt-1">나중에 변경할 수 있어요</p>
    </div>
  );
}