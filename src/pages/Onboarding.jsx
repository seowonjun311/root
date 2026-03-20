import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { AnimatePresence, motion } from 'framer-motion';
import { guestDataPersistence } from '@/lib/GuestDataPersistence';
import { useQueryClient } from '@tanstack/react-query';
import OnboardingProgress from '@/components/onboarding/OnboardingProgress';
import OnboardingNavigation from '@/components/onboarding/OnboardingNavigation';
import OnboardingWelcome from '@/components/onboarding/OnboardingWelcome';
import OnboardingGoal from '@/components/onboarding/OnboardingGoal';
import OnboardingCategory from '@/components/onboarding/OnboardingCategory';
import OnboardingDDay from '@/components/onboarding/OnboardingDDay';
import OnboardingDDayDate from '@/components/onboarding/OnboardingDDayDate';
import OnboardingDuration from '@/components/onboarding/OnboardingDuration';
import OnboardingAction from '@/components/onboarding/OnboardingAction';
import OnboardingNickname from '@/components/onboarding/OnboardingNickname';

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { triggerHaptic } = useHapticFeedback();
  const formContainerRef = React.useRef(null);

  // Auto scroll form inputs into view when focused on mobile
  React.useEffect(() => {
    const container = formContainerRef.current;
    if (!container) return;

    const handleFocus = (e) => {
      const target = e.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        requestAnimationFrame(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      }
    };

    container.addEventListener('focus', handleFocus, true);
    return () => container.removeEventListener('focus', handleFocus, true);
  }, []);

  const [stepHistory, setStepHistory] = useState(['welcome']);
  const currentStep = stepHistory[stepHistory.length - 1];

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('from') === 'login') {
      window.history.replaceState({}, '', '/Onboarding');
      base44.auth.isAuthenticated().then(async (isLoggedIn) => {
        if (!isLoggedIn) return;
        // 기존 목표가 있으면 바로 홈으로
        try {
          const existingGoals = await base44.entities.Goal.filter({ status: 'active' });
          if (existingGoals && existingGoals.length > 0) {
            // 기존 사용자 - 온보딩 완료 표시 후 홈으로
            await base44.auth.updateMe({ onboarding_complete: true });
            queryClient.setQueryData(['me'], (old) => ({
              ...(old || {}),
              onboarding_complete: true,
            }));
            navigate('/Home', { replace: true });
          } else {
            // 신규 사용자 - 온보딩 진행
            setStepHistory(['welcome', 'goal']);
          }
        } catch {
          // 오류 시 온보딩 진행
          setStepHistory(['welcome', 'goal']);
        }
      });
    }
  }, []);

  const [goalInput, setGoalInput] = useState('');
  const [category, setCategory] = useState('');
  const [hasDDay, setHasDDay] = useState(null);
  const [dDay, setDDay] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [duration, setDuration] = useState(90);
  const [customDuration, setCustomDuration] = useState('');
  const [actionTitle, setActionTitle] = useState('');
  const [actionType, setActionType] = useState('confirm');
  const [frequency, setFrequency] = useState(7);
  const [actionMinutes, setActionMinutes] = useState(60);
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = category === 'study' && hasDDay === true ? 7 : category === 'study' ? 7 : 6;
  const stepIndex = stepHistory.length - 1;

  const goNext = (nextStep) => {
    triggerHaptic('impact', 'light');
    setStepHistory(prev => [...prev, nextStep]);
  };
  const goBack = () => {
    triggerHaptic('impact', 'light');
    setStepHistory(prev => prev.slice(0, -1));
  };

  const calcDDayDuration = () => {
    if (!dDay) return 90;
    const diff = Math.ceil((new Date(dDay) - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  };

  const handleComplete = async () => {
    triggerHaptic('impact', 'heavy');
    setIsSubmitting(true);
    try {
      const isStudyDDay = category === 'study' && hasDDay === true;
      const finalTitle = isStudyDDay ? examTitle : goalInput;
      const finalDuration = isStudyDDay ? calcDDayDuration() : (customDuration ? (parseInt(customDuration) || 4) * 7 : duration);

      const isLoggedIn = await base44.auth.isAuthenticated();

      if (isLoggedIn) {
        // 기존 데이터 삭제는 백그라운드에서 처리 (완료를 기다리지 않음)
        Promise.all([
          base44.entities.Goal.list('-created_date', 200),
          base44.entities.ActionGoal.list('-created_date', 200),
          base44.entities.ActionLog.list('-created_date', 500),
          base44.entities.Badge.list('-created_date', 200),
        ]).then(([existingGoals, existingActionGoals, existingLogs, existingBadges]) => {
          return Promise.all([
            ...existingGoals.map(g => base44.entities.Goal.delete(g.id)),
            ...existingActionGoals.map(ag => base44.entities.ActionGoal.delete(ag.id)),
            ...existingLogs.map(l => base44.entities.ActionLog.delete(l.id)),
            ...existingBadges.map(b => base44.entities.Badge.delete(b.id)),
          ]);
        }).catch(err => console.warn('기존 데이터 삭제 중 오류 (무시):', err));

        const goal = await base44.entities.Goal.create({
          category,
          goal_type: 'result',
          title: finalTitle,
          duration_days: finalDuration,
          start_date: new Date().toISOString().split('T')[0],
          ...(isStudyDDay ? { d_day: dDay, has_d_day: true } : {}),
          status: 'active',
        });

        await base44.entities.ActionGoal.create({
          goal_id: goal.id,
          category,
          title: actionTitle || finalTitle,
          action_type: actionType,
          weekly_frequency: frequency,
          duration_minutes: actionType === 'timer' ? actionMinutes : 0,
          duration_days: finalDuration,
          status: 'active',
        });

        await base44.auth.updateMe({
          nickname: nickname || '용사',
          onboarding_complete: true,
          active_category: category,
        });

        // Home에서 캐시된 구 user 데이터로 인해 다시 Onboarding으로 튕기는 것 방지
        queryClient.setQueryData(['me'], (old) => ({
          ...(old || {}),
          onboarding_complete: true,
          active_category: category,
          nickname: nickname || '용사',
        }));

      } else {
        // Guest mode: use robust data persistence with error handling
        const startDate = new Date().toISOString().split('T')[0];
        const goalData = {
          id: 'local_goal_1',
          category,
          goal_type: 'result',
          title: finalTitle,
          duration_days: finalDuration,
          start_date: startDate,
          ...(isStudyDDay ? { d_day: dDay, has_d_day: true } : {}),
          status: 'active',
          created_date: new Date().toISOString(),
        };
        const actionGoalData = {
          id: 'local_ag_1',
          goal_id: 'local_goal_1',
          category,
          title: actionTitle || finalTitle,
          action_type: actionType,
          weekly_frequency: frequency,
          duration_minutes: actionType === 'timer' ? actionMinutes : 0,
          duration_days: finalDuration,
          status: 'active',
          created_date: new Date().toISOString(),
        };

        const savedSuccessfully = guestDataPersistence.saveOnboardingData({
          goalData,
          actionGoalData,
          nickname: nickname || '용사',
          category,
        });

        if (!savedSuccessfully) {
          console.error('Failed to save guest data to localStorage');
          // Still navigate, but data may be lost if storage fails
        }
      }

      navigate('/Home');
    } catch (error) {
      console.error('온보딩 완료 오류:', error);
      setIsSubmitting(false);
    }
  };

  const canNext = () => {
    if (currentStep === 'welcome') return true;
    if (currentStep === 'goal') return goalInput.trim().length > 0;
    if (currentStep === 'category') return category !== '';
    if (currentStep === 'study_dday') return hasDDay !== null;
    if (currentStep === 'study_dday_date') return dDay !== '' && examTitle.trim().length > 0;
    if (currentStep === 'duration') return (duration > 0 && !customDuration) || (customDuration && parseInt(customDuration) > 0);
    if (currentStep === 'action') return actionTitle.trim().length > 0;
    if (currentStep === 'nickname') return nickname.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (currentStep === 'welcome') return goNext('goal');
    if (currentStep === 'goal') return goNext('category');
    if (currentStep === 'category') {
      if (category === 'study') return goNext('study_dday');
      return goNext('duration');
    }
    if (currentStep === 'study_dday') {
      if (hasDDay === true) return goNext('study_dday_date');
      return goNext('duration');
    }
    if (currentStep === 'study_dday_date') return goNext('action');
    if (currentStep === 'duration') return goNext('action');
    if (currentStep === 'action') return goNext('nickname');
    if (currentStep === 'nickname') return handleComplete();
  };

  const isLastStep = currentStep === 'nickname';

  const renderContent = () => {
    switch (currentStep) {
      case 'welcome':
        return <OnboardingWelcome onLogin={() => base44.auth.redirectToLogin('/Onboarding?from=login')} onGuestStart={() => goNext('goal')} />;
      case 'goal':
        return <OnboardingGoal value={goalInput} onChange={e => setGoalInput(e.target.value)} />;
      case 'category':
        return <OnboardingCategory value={category} onChange={setCategory} />;
      case 'study_dday':
        return <OnboardingDDay value={hasDDay} onChange={setHasDDay} />;
      case 'study_dday_date':
        return <OnboardingDDayDate dDay={dDay} onDDayChange={e => setDDay(e.target.value)} examTitle={examTitle} onExamChange={e => setExamTitle(e.target.value)} />;
      case 'duration':
        return <OnboardingDuration duration={duration} customDuration={customDuration} onDurationChange={setDuration} onCustomChange={setCustomDuration} />;
      case 'action':
        return <OnboardingAction category={category} actionTitle={actionTitle} onActionTitleChange={e => setActionTitle(e.target.value)} actionType={actionType} onActionTypeChange={setActionType} frequency={frequency} onFrequencyChange={setFrequency} actionMinutes={actionMinutes} onActionMinutesChange={setActionMinutes} />;
      case 'nickname':
        return <OnboardingNickname value={nickname} onChange={e => setNickname(e.target.value)} />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={formContainerRef}
      className="bg-background max-w-lg mx-auto flex flex-col"
      style={{
        position: 'fixed',
        inset: 0,
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <OnboardingProgress stepIndex={stepIndex} totalSteps={totalSteps} />

      <div className="flex-1 overflow-y-auto py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {currentStep !== 'welcome' && (
        <OnboardingNavigation
          showBack={stepHistory.length > 1}
          isLastStep={isLastStep}
          isSubmitting={isSubmitting}
          canContinue={canNext()}
          onBack={goBack}
          onNext={handleNext}
        />
      )}
    </div>
  );
}