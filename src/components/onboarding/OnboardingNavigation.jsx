import React from 'react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function OnboardingNavigation({ showBack, isLastStep, isSubmitting, canContinue, onBack, onNext }) {
  const { triggerHaptic } = useHapticFeedback();
  return (
    <div className="px-6 pb-8 flex gap-3">
      {showBack && (
        <Button
          variant="outline"
          onClick={() => {
            triggerHaptic('impact', 'light');
            onBack();
          }}
          className="rounded-xl h-12 px-4"
          aria-label="이전 단계로 돌아가기"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </Button>
      )}
      <Button
        className="flex-1 h-12 rounded-xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold text-base"
        disabled={!canContinue || isSubmitting}
        onClick={() => {
          triggerHaptic('impact', isLastStep ? 'heavy' : 'light');
          onNext();
        }}
      >
        {isLastStep ? (isSubmitting ? '여정을 시작하는 중...' : '여정 시작하기 🦊') : <><ChevronRight className="w-4 h-4 mr-1" />다음</>}
      </Button>
    </div>
  );
}