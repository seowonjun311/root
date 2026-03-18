import React, { useState } from 'react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import FocusLock from 'react-focus-lock';

/**
 * DeleteAccountDialog - Multi-step account deletion flow
 * 
 * Step 1: Warning & Data Loss Info
 * Step 2: Confirmation (type email)
 * Step 3: Final Confirmation
 * Step 4: Deletion in Progress or Error
 */
export default function DeleteAccountDialog({ open, onOpenChange, userEmail, onConfirm, isPending, onError }) {
  const { triggerHaptic } = useHapticFeedback();
  const [step, setStep] = useState(1); // 1: warning, 2: email confirm, 3: final, 4: processing
  const [confirmEmail, setConfirmEmail] = useState('');
  const [error, setError] = useState(null);

  // Reset state when dialog closes
  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      setStep(1);
      setConfirmEmail('');
      setError(null);
    }
    onOpenChange(newOpen);
  };

  const handleProceedToEmailConfirm = () => {
    triggerHaptic('impact', 'light');
    setStep(2);
    setError(null);
  };

  const handleEmailConfirmContinue = () => {
    if (confirmEmail.trim() !== userEmail) {
      triggerHaptic('impact', 'medium');
      setError('이메일이 일치하지 않습니다. 다시 확인해 주세요.');
      return;
    }
    triggerHaptic('impact', 'light');
    setStep(3);
    setError(null);
  };

  const handleFinalConfirm = async () => {
    triggerHaptic('impact', 'heavy');
    setStep(4);
    setError(null);
    
    try {
      await onConfirm();
      // Success is handled by mutation callback
    } catch (err) {
      // Error handling
      const errorMsg = err?.message || '계정 삭제 중 오류가 발생했습니다.';
      setError(errorMsg);
      setStep(3); // Go back to final confirmation
      triggerHaptic('impact', 'medium');
      if (onError) onError(errorMsg);
    }
  };

  const handleBackStep = () => {
    triggerHaptic('impact', 'light');
    if (step > 1) {
      setStep(step - 1);
      setError(null);
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <FocusLock disabled={!open}>
        <DrawerContent
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-desc"
        >
          {/* STEP 1: Warning & Data Loss Information */}
          {step === 1 && (
            <>
              <DrawerHeader className="text-center">
                <DrawerTitle id="delete-dialog-title" className="text-red-600 flex items-center justify-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  계정 삭제
                </DrawerTitle>
              </DrawerHeader>

              <div className="px-6 py-4 space-y-4">
                <div className="bg-red-50/80 dark:bg-red-950/30 rounded-xl p-4 border border-red-200 dark:border-red-900">
                  <p className="text-sm font-bold text-red-900 dark:text-red-100 mb-3">
                    ⚠️ 이 작업은 되돌릴 수 없습니다
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200 leading-relaxed font-semibold">
                    계정을 삭제하면 다음 데이터가 즉시 서버에서 영구 삭제됩니다:
                  </p>
                </div>

                <div className="space-y-2">
                  {[
                    { icon: '📊', text: '모든 목표 및 진행 상황' },
                    { icon: '📝', text: '활동 로그, 통계 데이터, 사진 및 메모' },
                    { icon: '🏆', text: '배지 및 성취 기록' },
                    { icon: '⚙️', text: '저장된 설정 및 환경설정' },
                    { icon: '🔐', text: '인증 토큰 및 세션 정보' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm">
                      <span className="text-lg mt-0.5">{item.icon}</span>
                      <span className="text-red-700 dark:text-red-300 font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50/80 dark:bg-amber-950/20 rounded-xl p-3 border border-amber-200 dark:border-amber-900/50">
                  <p className="text-xs text-amber-900 dark:text-amber-200">
                    <span className="font-semibold">복구 불가능:</span> 삭제된 데이터는 복구할 수 없으며, 같은 이메일로 재가입해도 이전 데이터는 복원되지 않습니다.
                  </p>
                </div>

                <p id="delete-dialog-desc" className="text-xs text-muted-foreground text-center pt-2">
                  계속하면 이메일 확인 단계로 진행합니다.
                </p>
              </div>

              <DrawerFooter className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="flex-1 rounded-xl"
                  aria-label="계정 삭제 취소"
                >
                  취소
                </Button>
                <Button
                  onClick={handleProceedToEmailConfirm}
                  className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white"
                  aria-label="계정 삭제 진행"
                >
                  계속
                </Button>
              </DrawerFooter>
            </>
          )}

          {/* STEP 2: Email Confirmation */}
          {step === 2 && (
            <>
              <DrawerHeader className="text-center">
                <DrawerTitle id="delete-dialog-title" className="text-red-600">
                  이메일 확인
                </DrawerTitle>
              </DrawerHeader>

              <div className="px-6 py-4 space-y-4">
                <p className="text-sm text-center text-muted-foreground">
                  계정 삭제를 확인하기 위해 가입하신 이메일을 입력해 주세요.
                </p>

                <div>
                  <label htmlFor="confirm-email" className="text-xs font-semibold text-foreground mb-2 block">
                    가입 이메일
                  </label>
                  <Input
                    id="confirm-email"
                    type="email"
                    value={confirmEmail}
                    onChange={e => {
                      setConfirmEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder={userEmail}
                    className="h-12 rounded-xl"
                    aria-label="가입 이메일 입력"
                    aria-describedby={error ? 'email-error' : undefined}
                  />
                  {error && (
                    <p id="email-error" className="text-xs text-red-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {error}
                    </p>
                  )}
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  입력한 이메일이 가입 이메일과 정확히 일치해야 합니다.
                </p>
              </div>

              <DrawerFooter className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleBackStep}
                  className="flex-1 rounded-xl"
                  aria-label="이전 단계로"
                >
                  이전
                </Button>
                <Button
                  onClick={handleEmailConfirmContinue}
                  disabled={!confirmEmail.trim()}
                  className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                  aria-label="이메일 확인 계속"
                >
                  다음
                </Button>
              </DrawerFooter>
            </>
          )}

          {/* STEP 3: Final Confirmation */}
          {step === 3 && (
            <>
              <DrawerHeader className="text-center">
                <DrawerTitle id="delete-dialog-title" className="text-red-600">
                  최종 확인
                </DrawerTitle>
              </DrawerHeader>

              <div className="px-6 py-4 space-y-4">
                <div className="bg-red-50/80 dark:bg-red-950/30 rounded-xl p-4 border-2 border-red-400 dark:border-red-700">
                  <p className="text-sm font-bold text-red-900 dark:text-red-100 text-center">
                    정말로 계정을 삭제하시겠습니까?
                  </p>
                  <p className="text-xs text-red-800 dark:text-red-200 text-center mt-2">
                    이 작업은 즉시 실행되며 되돌릴 수 없습니다.
                  </p>
                </div>

                <div className="space-y-2 bg-red-50/50 dark:bg-red-950/20 rounded-lg p-3">
                  <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
                    다음 데이터가 즉시 영구 삭제됩니다:
                  </p>
                  <div className="space-y-1.5">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      • 모든 목표, 활동 기록, 통계 데이터
                    </p>
                    <p className="text-sm text-red-800 dark:text-red-200">
                      • 배지, 성취 기록, 사진 및 메모
                    </p>
                    <p className="text-sm text-red-800 dark:text-red-200">
                      • 개인 설정 및 환경설정
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50/80 dark:bg-blue-950/20 rounded-xl p-3 border border-blue-200 dark:border-blue-900/50">
                  <p className="text-xs text-blue-900 dark:text-blue-200">
                    ℹ️ 재가입 시에도 이전 데이터는 복원되지 않습니다. 계속 진행하려면 아래 '삭제' 버튼을 누르세요.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50/80 dark:bg-red-950/30 rounded-xl p-3 border border-red-200 dark:border-red-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-700 dark:text-red-200">{error}</p>
                  </div>
                )}
              </div>

              <DrawerFooter className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleBackStep}
                  disabled={isPending}
                  className="flex-1 rounded-xl"
                  aria-label="이전 단계로"
                >
                  취소
                </Button>
                <Button
                  onClick={handleFinalConfirm}
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                  aria-label="계정 삭제 확인"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      삭제 중...
                    </>
                  ) : (
                    '삭제'
                  )}
                </Button>
              </DrawerFooter>
            </>
          )}

          {/* STEP 4: Deletion Processing */}
          {step === 4 && !error && (
            <>
              <DrawerHeader className="text-center">
                <DrawerTitle id="delete-dialog-title" className="text-amber-600">
                  계정 삭제 중
                </DrawerTitle>
              </DrawerHeader>

              <div className="px-6 py-8 flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
                <p className="text-sm text-muted-foreground text-center">
                  계정이 삭제되고 있습니다.<br />
                  잠시만 기다려 주세요...
                </p>
              </div>

              <DrawerFooter>
                <p className="text-xs text-muted-foreground text-center">
                  이 창을 닫지 마세요
                </p>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </FocusLock>
    </Drawer>
  );
}