import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { guestDataPersistence } from '@/lib/GuestDataPersistence';
import { useQueryClient } from '@tanstack/react-query';
import OnboardingProgress from '@/components/onboarding/OnboardingProgress';
import OnboardingWelcome from '@/components/onboarding/OnboardingWelcome';
import OnboardingCategory from '@/components/onboarding/OnboardingCategory';
import OnboardingDDay from '@/components/onboarding/OnboardingDDay';
import OnboardingDDayDate from '@/components/onboarding/OnboardingDDayDate';
import OnboardingGoal from '@/components/onboarding/OnboardingGoal';
import OnboardingAction from '@/components/onboarding/OnboardingAction';
import OnboardingNickname from '@/components/onboarding/OnboardingNickname';
import OnboardingNavigation from '@/components/onboarding/OnboardingNavigation';

const getToday = () => new Date().toISOString().split('T')[0];

const getDaysLeft = (dateString) => {
  if (!dateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
};

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { triggerHaptic } = useHapticFeedback();

  const [stepHistory, setStepHistory] = useState(['welcome']);
  const currentStep = stepHistory[stepHistory.length - 1];

  const [category, setCategory] = useState('');
  const [hasDDay, setHasDDay] = useState(null);

  const [goalTitle, setGoalTitle] = useState('');
  const [duration, setDuration] = useState(56);
  const [customWeeks, setCustomWeeks] = useState('');
  const [isCustomDuration, setIsCustomDuration] = useState(false);

  const [dDay, setDDay] = useState('');
  const [examTitle, setExamTitle] = useState('');

  const [actionMode, setActionMode] = useState('routine');
  const [actionTitle, setActionTitle] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [actionType, setActionType] = useState('confirm');
  const [frequency, setFrequency] = useState(3);
  const [actionMinutes, setActionMinutes] = useState(30);

  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStudy = category === 'study';
  const daysLeft = useMemo(() => getDaysLeft(dDay), [dDay]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('from') === 'login') {
      window.history.replaceState({}, '', '/Onboarding');

      base44.auth.isAuthenticated().then(async (isLoggedIn) => {
        if (!isLoggedIn) return;

        try {
          const existingGoals = await base44.entities.Goal.filter({ status: 'active' });

          if (existingGoals && existingGoals.length > 0) {
            await base44.auth.updateMe({ onboarding_complete: true });
            queryClient.setQueryData(['me'], (old) => ({
              ...(old || {}),
              onboarding_complete: true,
            }));
            navigate('/Home', { replace: true });
          } else {
            setStepHistory(['welcome', 'category']);
          }
        } catch (error) {
          console.error(error);
          setStepHistory(['welcome', 'category']);
        }
      });
    }
  }, [navigate, queryClient]);

  const goNext = (nextStep) => {
    triggerHaptic('impact', 'light');
    setStepHistory((prev) => [...prev, nextStep]);
  };

  const goBack = () => {
    triggerHaptic('impact', 'light');
    setStepHistory((prev) => {
      if (prev.length <= 1) return prev;
      return prev.slice(0, -1);
    });
  };

  const calcFinalDuration = () => {
    if (isStudy && hasDDay) {
      const diff = getDaysLeft(dDay);
      return Math.max(1, diff || 1);
    }

    if (isCustomDuration) {
      return Math.max(1, Number(customWeeks) || 0) * 7;
    }

    return duration;
  };

  const finalDuration = calcFinalDuration();
  const finalGoalTitle = isStudy && hasDDay ? examTitle.trim() : goalTitle.trim();

  const getSingleActionTitle = () => {
    if (actionTitle.trim()) return actionTitle.trim();
    if (isStudy && hasDDay && examTitle.trim()) return `${examTitle.trim()} 실행`;
    if (goalTitle.trim()) return `${goalTitle.trim()} 실행`;
    return '1회 목표';
  };

  const canNext = () => {
    if (currentStep === 'welcome') return true;
    if (currentStep === 'category') return !!category;
    if (currentStep === 'study_dday') return hasDDay !== null;

    if (currentStep === 'study_dday_date') {
      return !!dDay && !!examTitle.trim();
    }

    if (currentStep === 'goal') {
      if (!goalTitle.trim()) return false;
      if (isCustomDuration) {
        const weeks = Number(customWeeks);
        if (!weeks || weeks < 1) return false;
      }
      return true;
    }

    if (currentStep === 'action') {
      if (!actionTitle.trim()) return false;

      if (actionMode === 'single') {
        if (!scheduledDate) return false;
        if (actionType === 'timer' && (!actionMinutes || Number(actionMinutes) < 1)) return false;
        return true;
      }

      if (!frequency || frequency < 1 || frequency > 7) return false;
      if (actionType === 'timer' && (!actionMinutes || Number(actionMinutes) < 1)) return false;
      return true;
    }

    if (currentStep === 'nickname') {
      return nickname.trim().length > 0;
    }

    return true;
  };

  const handleNext = () => {
    if (!canNext()) return;

    if (currentStep === 'welcome') {
      goNext('category');
      return;
    }

    if (currentStep === 'category') {
      if (category === 'study') goNext('study_dday');
      else goNext('goal');
      return;
    }

    if (currentStep === 'study_dday') {
      if (hasDDay === true) goNext('study_dday_date');
      else goNext('goal');
      return;
    }

    if (currentStep === 'study_dday_date') {
      goNext('action');
      return;
    }

    if (currentStep === 'goal') {
      goNext('action');
      return;
    }

    if (currentStep === 'action') {
      goNext('nickname');
      return;
    }

    if (currentStep === 'nickname') {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!canNext() || isSubmitting) return;

    triggerHaptic('impact', 'heavy');
    setIsSubmitting(true);

    try {
      const isLoggedIn = await base44.auth.isAuthenticated();
      const startDate = getToday();

      const goalPayload = {
        category,
        goal_type: 'result',
        title: finalGoalTitle,
        duration_days: finalDuration,
        start_date: startDate,
        ...(isStudy && hasDDay ? { d_day: dDay, has_d_day: true } : {}),
        status: 'active',
      };

      const actionPayload = {
        category,
        title: actionMode === 'single' ? getSingleActionTitle() : actionTitle.trim(),
        action_mode: actionMode,
        action_type: actionType,
        weekly_frequency: actionMode === 'routine' ? frequency : null,
        scheduled_date: actionMode === 'single' ? scheduledDate : null,
        duration_minutes: actionType === 'timer' ? Math.max(1, Number(actionMinutes) || 1) : 0,
        duration_days: finalDuration,
        status: 'active',
      };

      if (isLoggedIn) {
        const goal = await base44.entities.Goal.create(goalPayload);

        await base44.entities.ActionGoal.create({
          ...actionPayload,
          goal_id: goal.id,
        });

        await base44.auth.updateMe({
          nickname: nickname || '용사',
          onboarding_complete: true,
          active_category: category,
        });

        queryClient.setQueryData(['me'], (old) => ({
          ...(old || {}),
          onboarding_complete: true,
          active_category: category,
          nickname: nickname || '용사',
        }));
      } else {
        const goalData = {
          id: 'local_goal_1',
          ...goalPayload,
          created_date: new Date().toISOString(),
        };

        const actionGoalData = {
          id: 'local_ag_1',
          goal_id: 'local_goal_1',
          ...actionPayload,
          created_date: new Date().toISOString(),
        };

        guestDataPersistence.saveOnboardingData({
          goalData,
          actionGoalData,
          nickname: nickname || '용사',
          category,
        });
      }

      navigate('/Home');
    } catch (error) {
      console.error('온보딩 완료 오류:', error);
      setIsSubmitting(false);
    }
  };

  const totalSteps = (() => {
    if (currentStep === 'welcome') return 1;
    if (category === 'study' && hasDDay === true) return 6;
    if (category === 'study' && hasDDay === false) return 5;
    if (category && category !== 'study') return 4;
    return 4;
  })();

  const stepIndex = (() => {
    if (currentStep === 'welcome') return 0;

    const steps = ['category'];

    if (category === 'study') {
      steps.push('study_dday');
      if (hasDDay === true) steps.push('study_dday_date');
      if (hasDDay === false) steps.push('goal');
    } else if (category) {
      steps.push('goal');
    }

    steps.push('action');
    steps.push('nickname');

    return Math.max(1, steps.indexOf(currentStep) + 1);
  })();

  const renderContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <OnboardingWelcome
            onLogin={() => base44.auth.redirectToLogin('/Onboarding?from=login')}
            onGuestStart={() => goNext('category')}
          />
        );

      case 'category':
        return <OnboardingCategory value={category} onChange={setCategory} />;

      case 'study_dday':
        return <OnboardingDDay value={hasDDay} onChange={setHasDDay} />;

      case 'study_dday_date':
        return (
          <OnboardingDDayDate
            dDay={dDay}
            onDDayChange={(e) => setDDay(e.target.value)}
            examTitle={examTitle}
            onExamChange={(e) => setExamTitle(e.target.value)}
            daysLeft={daysLeft}
          />
        );

      case 'goal':
        return (
          <OnboardingGoal
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            duration={duration}
            customDuration={customWeeks}
            onDurationChange={setDuration}
            onCustomChange={(e) => setCustomWeeks(e.target.value)}
            isCustomDuration={isCustomDuration}
            onCustomDurationToggle={setIsCustomDuration}
          />
        );

      case 'action':
        return (
          <OnboardingAction
            category={category}
            actionMode={actionMode}
            onActionModeChange={setActionMode}
            actionTitle={actionTitle}
            onActionTitleChange={(e) => setActionTitle(e.target.value)}
            scheduledDate={scheduledDate}
            onScheduledDateChange={(e) => setScheduledDate(e.target.value)}
            actionType={actionType}
            onActionTypeChange={setActionType}
            frequency={frequency}
            onFrequencyChange={setFrequency}
            actionMinutes={actionMinutes}
            onActionMinutesChange={setActionMinutes}
          />
        );

      case 'nickname':
        return <OnboardingNickname value={nickname} onChange={(e) => setNickname(e.target.value)} />;

      default:
        return null;
    }
  };

  return (
    <div
      className="bg-background max-w-lg mx-auto flex flex-col"
      style={{
        position: 'fixed',
        inset: 0,
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {currentStep !== 'welcome' ? (
        <OnboardingProgress stepIndex={stepIndex} totalSteps={totalSteps} />
      ) : null}

      <div className="flex-1 overflow-y-auto pb-4">
        {renderContent()}
      </div>

      {currentStep !== 'welcome' ? (
        <OnboardingNavigation
          showBack={stepHistory.length > 1}
          isLastStep={currentStep === 'nickname'}
          isSubmitting={isSubmitting}
          canContinue={canNext()}
          onBack={goBack}
          onNext={handleNext}
        />
      ) : null}
    </div>
  );
}
