import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { guestDataPersistence } from '@/lib/GuestDataPersistence';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, CalendarDays } from 'lucide-react';
import OnboardingProgress from '@/components/onboarding/OnboardingProgress';
import OnboardingWelcome from '@/components/onboarding/OnboardingWelcome';

const ACTION_TYPES = [
  {
    value: 'confirm',
    label: '✅ 확인형',
    desc: '완료했는지만 간단히 체크해요',
  },
  {
    value: 'timer',
    label: '⏱️ 시간형',
    desc: '얼마나 했는지 시간을 기록해요',
  },
  {
    value: 'abstain',
    label: '🚫 안하기형',
    desc: '하지 않으면 성공으로 기록해요',
  },
];

const ACTION_MODES = [
  {
    value: 'routine',
    label: '🔁 루틴형',
    desc: '반복해서 쌓는 행동이에요',
    sub: '예: 주 3회 러닝, 매일 영어 30분',
  },
  {
    value: 'single',
    label: '🎯 단발형',
    desc: '정해진 날짜에 한 번 해내는 행동이에요',
    sub: '예: 모의고사 보기, 병원 가기, 책 1권 끝내기',
  },
];

const CATEGORIES = [
  { value: 'exercise', label: '운동', emoji: '🏃', desc: '몸을 단련하고 체력을 키워요' },
  { value: 'study', label: '공부', emoji: '📚', desc: '실력을 쌓고 목표 점수에 다가가요' },
  { value: 'mental', label: '정신', emoji: '🧠', desc: '마음, 생활, 절제를 다뤄요' },
  { value: 'daily', label: '일상', emoji: '🏠', desc: '생활 루틴과 집안일을 정리해요' },
];

const categoryNames = {
  exercise: '운동',
  study: '공부',
  mental: '정신',
  daily: '일상',
};

const categoryEmojis = {
  exercise: '🏃',
  study: '📚',
  mental: '🧠',
  daily: '🏠',
};

const getToday = () => new Date().toISOString().split('T')[0];

const getDaysLeft = (dateString) => {
  if (!dateString) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);

  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  return diff;
};

const getGoalPlaceholder = (category) => {
  if (category === 'mental') return '예: 자기관리, 생활규칙 만들기, 절제, 나 챙기기';
  if (category === 'daily') return '예: 갓생살기, 일찍 일어나기, 루틴 찾기';
  if (category === 'exercise') return '예: 살빼기, 턱걸이 30개, 등산 100회';
  if (category === 'study') return '예: 수학 1회독, 영어 실력 올리기';
  return '어떤 결과를 이루고 싶으신가요?';
};

const getActionPlaceholder = (category) => {
  if (category === 'daily') return '예: 팩하기, 집청소, 빨래, 부모님 연락';
  if (category === 'mental') return '예: 7시 기상, 일기쓰기, 금연, 명상';
  if (category === 'study') return '예: 독해, 듣기, 회화, 전공서, 수학';
  if (category === 'exercise') return '예: 러닝, 등산, 헬스, 야식참기';
  return '예: 러닝, LC 공부, 명상';
};

function SectionTitle({ title, desc }) {
  return (
    <div className="space-y-1">
      <h2 className="text-base font-bold text-amber-900">{title}</h2>
      {desc ? <p className="text-sm text-muted-foreground">{desc}</p> : null}
    </div>
  );
}

function SelectCard({ active, title, desc, sub, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition-all ${
        active
          ? 'border-amber-500 bg-amber-50 shadow-sm'
          : 'border-border bg-card hover:bg-secondary/40'
      }`}
      aria-pressed={active}
    >
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      {sub ? <p className="mt-2 text-xs text-muted-foreground">{sub}</p> : null}
    </button>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { triggerHaptic } = useHapticFeedback();
  const formContainerRef = React.useRef(null);

  useEffect(() => {
    const container = formContainerRef.current;
    if (!container) return;

    const handleFocus = (e) => {
      const target = e.target;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
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
        } catch {
          setStepHistory(['welcome', 'category']);
        }
      });
    }
  }, [navigate, queryClient]);

  const [category, setCategory] = useState('');
  const [hasDDay, setHasDDay] = useState(null);

  const [goalTitle, setGoalTitle] = useState('');
  const [duration, setDuration] = useState(56);
  const [customWeeks, setCustomWeeks] = useState('');
  const [isCustomDuration, setIsCustomDuration] = useState(false);

  const [dDay, setDDay] = useState('');
  const [examTitle, setExamTitle] = useState('');

  const [actionTitle, setActionTitle] = useState('');
  const [actionMode, setActionMode] = useState('routine');
  const [scheduledDate, setScheduledDate] = useState('');
  const [actionType, setActionType] = useState('confirm');
  const [frequency, setFrequency] = useState(3);
  const [actionMinutes, setActionMinutes] = useState(30);

  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStudy = category === 'study';
  const daysLeft = useMemo(() => getDaysLeft(dDay), [dDay]);

  const goNext = (nextStep) => {
    triggerHaptic('impact', 'light');
    setStepHistory((prev) => [...prev, nextStep]);
  };

  const goBack = () => {
    triggerHaptic('impact', 'light');
    setStepHistory((prev) => prev.slice(0, -1));
  };

  const calcDDayDuration = () => {
    if (!dDay) return 90;
    const diff = getDaysLeft(dDay);
    return Math.max(1, diff || 1);
  };

  const finalGoalTitle = isStudy && hasDDay ? examTitle.trim() : goalTitle.trim();
  const finalDuration = isStudy && hasDDay
    ? calcDDayDuration()
    : (isCustomDuration ? Math.max(1, Number(customWeeks) || 0) * 7 : duration);

  const getSingleActionTitle = () => {
    if (category === 'study' && hasDDay && examTitle.trim()) {
      return `${examTitle.trim()} 실행`;
    }

    if (goalTitle.trim()) {
      return `${goalTitle.trim()} 실행`;
    }

    return '1회 행동';
  };

  const totalSteps = (() => {
    if (currentStep === 'welcome') return 1;
    if (isStudy && hasDDay === true) return 6;
    if (isStudy && hasDDay === false) return 6;
    if (!isStudy && category) return 5;
    return 5;
  })();

  const stepIndex = (() => {
    const visibleSteps = stepHistory.filter((step) => step !== 'welcome');
    return currentStep === 'welcome' ? 0 : visibleSteps.length;
  })();

  const canNext = () => {
    if (currentStep === 'welcome') return true;
    if (currentStep === 'category') return !!category;
    if (currentStep === 'study_dday') return hasDDay !== null;
    if (currentStep === 'study_dday_date') return !!dDay && !!examTitle.trim();

    if (currentStep === 'goal') {
      if (!goalTitle.trim()) return false;
      if (isCustomDuration) {
        const weeks = Number(customWeeks);
        if (!weeks || weeks < 1) return false;
      }
      return true;
    }

    if (currentStep === 'action') {
      if (actionMode === 'single') {
        if (!scheduledDate) return false;
        if (actionType === 'timer' && (!actionMinutes || Number(actionMinutes) < 1)) return false;
        return true;
      }

      if (!actionTitle.trim()) return false;
      if (!frequency || frequency < 1 || frequency > 7) return false;
      if (actionType === 'timer' && (!actionMinutes || Number(actionMinutes) < 1)) return false;
      return true;
    }

    if (currentStep === 'nickname') return nickname.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (currentStep === 'welcome') return goNext('category');

    if (currentStep === 'category') {
      if (category === 'study') return goNext('study_dday');
      return goNext('goal');
    }

    if (currentStep === 'study_dday') {
      if (hasDDay === true) return goNext('study_dday_date');
      return goNext('goal');
    }

    if (currentStep === 'study_dday_date') return goNext('action');
    if (currentStep === 'goal') return goNext('action');
    if (currentStep === 'action') return goNext('nickname');
    if (currentStep === 'nickname') return handleComplete();
  };

  const handleComplete = async () => {
    if (!canNext() || isSubmitting) return;

    triggerHaptic('impact', 'heavy');
    setIsSubmitting(true);

    try {
      const isLoggedIn = await base44.auth.isAuthenticated();
      const startDate = getToday();

      if (isLoggedIn) {
        const goal = await base44.entities.Goal.create({
          category,
          goal_type: 'result',
          title: finalGoalTitle,
          duration_days: finalDuration,
          start_date: startDate,
          ...(isStudy && hasDDay ? { d_day: dDay, has_d_day: true } : {}),
          status: 'active',
        });

        await base44.entities.ActionGoal.create({
          goal_id: goal.id,
          category,
          title: actionMode === 'single' ? getSingleActionTitle() : actionTitle.trim(),
          action_mode: actionMode,
          action_type: actionType,
          weekly_frequency: actionMode === 'routine' ? frequency : null,
          scheduled_date: actionMode === 'single' ? scheduledDate : null,
          duration_minutes: actionType === 'timer' ? Math.max(1, Number(actionMinutes) || 1) : 0,
          duration_days: finalDuration,
          status: 'active',
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
          category,
          goal_type: 'result',
          title: finalGoalTitle,
          duration_days: finalDuration,
          start_date: startDate,
          ...(isStudy && hasDDay ? { d_day: dDay, has_d_day: true } : {}),
          status: 'active',
          created_date: new Date().toISOString(),
        };

        const actionGoalData = {
          id: 'local_ag_1',
          goal_id: 'local_goal_1',
          category,
          title: actionMode === 'single' ? getSingleActionTitle() : actionTitle.trim(),
          action_mode: actionMode,
          action_type: actionType,
          weekly_frequency: actionMode === 'routine' ? frequency : null,
          scheduled_date: actionMode === 'single' ? scheduledDate : null,
          duration_minutes: actionType === 'timer' ? Math.max(1, Number(actionMinutes) || 1) : 0,
          duration_days: finalDuration,
          status: 'active',
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

  const renderTopBar = () => {
    if (currentStep === 'welcome') return null;

    return (
      <div className="mb-6 flex items-center gap-3 px-6 pt-4">
        <button
          type="button"
          onClick={goBack}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
          aria-label="뒤로가기"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <p className="text-xs font-semibold text-amber-700">
            {category ? `${categoryEmojis[category]} ${categoryNames[category]}` : '🦊 루트'}
          </p>
          <h1 className="text-lg font-bold text-foreground">첫 목표를 정해볼까요?</h1>
          <p className="text-sm text-muted-foreground">루트의 첫 여정을 시작해요</p>
        </div>
      </div>
    );
  };

  const renderBottomButton = () => {
    if (currentStep === 'welcome') return null;

    const isLastStep = currentStep === 'nickname';

    return (
      <div className="border-t border-border bg-background/95 px-6 py-4 backdrop-blur">
        <Button
          type="button"
          className="h-12 w-full rounded-xl bg-amber-700 font-semibold text-amber-50 hover:bg-amber-800"
          disabled={!canNext() || isSubmitting}
          onClick={handleNext}
        >
          {isSubmitting ? '저장 중...' : isLastStep ? '루트 시작하기 🦊' : '다음'}
        </Button>
      </div>
    );
  };

  const renderCategoryStep = () => (
    <div className="space-y-6 px-6">
      <div className="pt-2 text-center">
        <p className="mb-3 text-4xl">🗺️</p>
        <h2 className="text-lg font-bold text-amber-900">어떤 길을 먼저 시작할까요?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          가장 먼저 도전할 카테고리를 골라주세요
        </p>
      </div>

      <div className="space-y-3">
        {CATEGORIES.map((item) => (
          <SelectCard
            key={item.value}
            active={category === item.value}
            title={`${item.emoji} ${item.label}`}
            desc={item.desc}
            onClick={() => setCategory(item.value)}
          />
        ))}
      </div>
    </div>
  );

  const renderStudyDDayStep = () => (
    <div className="space-y-6 px-6">
      <div className="pt-2 text-center">
        <p className="mb-3 text-4xl">📚</p>
        <h2 className="text-lg font-bold text-amber-900">시험 D-day가 있나요?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          시험형 목표인지, 꾸준한 공부 목표인지 먼저 정해요
        </p>
      </div>

      <div className="space-y-3">
        <SelectCard
          active={hasDDay === true}
          title="📅 D-day 있음"
          desc="시험이나 마감일이 정해져 있어요"
          sub="예: 토익, 자격증, 모의고사, 과제 마감"
          onClick={() => setHasDDay(true)}
        />

        <SelectCard
          active={hasDDay === false}
          title="📖 D-day 없음"
          desc="꾸준히 공부 습관을 만들고 싶어요"
          sub="예: 수학 1회독, 영어 실력 올리기, 전공 공부"
          onClick={() => setHasDDay(false)}
        />
      </div>
    </div>
  );

  const renderStudyDDayDateStep = () => (
    <div className="space-y-6 px-6">
      <SectionTitle
        title="시험 목표 설정"
        desc="시험 날짜와 목표 이름을 입력하면 D-day 기반으로 기간이 계산돼요"
      />

      <div>
        <label className="mb-2 flex items-center gap-1 text-sm font-semibold text-amber-800">
          <CalendarDays className="h-4 w-4" />
          시험 날짜
        </label>
        <input
          type="date"
          value={dDay}
          min={getToday()}
          onChange={(e) => setDDay(e.target.value)}
          className="w-full h-12 rounded-xl border border-input bg-white/80 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
        />
        {daysLeft !== null && daysLeft >= 0 ? (
          <p className="mt-2 text-xs font-semibold text-amber-700">
            🎯 D-{daysLeft} · {daysLeft}일 남았습니다
          </p>
        ) : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-amber-800">어떤 시험인가요?</label>
        <Input
          value={examTitle}
          onChange={(e) => setExamTitle(e.target.value)}
          placeholder="예: 토익 900점, 수능, 정보처리기사"
          className="h-12 rounded-xl bg-white/80"
        />
      </div>
    </div>
  );

  const renderGoalStep = () => (
    <div className="space-y-6 px-6">
      <SectionTitle
        title="결과 목표 설정"
        desc="이번 카테고리에서 이루고 싶은 최종 목표를 먼저 정해요"
      />

      <div>
        <label className="mb-2 block text-sm font-semibold text-amber-800">결과 목표</label>
        <Input
          value={goalTitle}
          onChange={(e) => setGoalTitle(e.target.value)}
          placeholder={getGoalPlaceholder(category)}
          className="h-12 rounded-xl bg-white/80"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-amber-800">기간</label>

        <div className="mb-2 flex gap-2">
          {[
            { label: '4주', weeks: 4 },
            { label: '8주', weeks: 8 },
            { label: '12주', weeks: 12 },
          ].map(({ label, weeks }) => (
            <button
              type="button"
              key={weeks}
              onClick={() => {
                setDuration(weeks * 7);
                setIsCustomDuration(false);
                setCustomWeeks('');
              }}
              className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-all ${
                !isCustomDuration && duration === weeks * 7
                  ? 'bg-amber-700 text-amber-50'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setIsCustomDuration(true)}
            className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-all ${
              isCustomDuration
                ? 'bg-amber-700 text-amber-50'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            직접입력
          </button>
        </div>

        {isCustomDuration ? (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="52"
              value={customWeeks}
              onChange={(e) => {
                const value = e.target.value;
                setCustomWeeks(value);
                setDuration(Math.max(1, Number(value) || 0) * 7);
              }}
              placeholder="주 수 입력"
              className="h-11 flex-1 rounded-xl border border-input bg-white/80 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
            <span className="text-sm font-semibold text-muted-foreground">주</span>
          </div>
        ) : null}
      </div>
    </div>
  );

  const renderActionStep = () => (
    <div className="space-y-6 px-6">
      <SectionTitle
        title="행동 목표 설정"
        desc="어떤 방식으로 길을 앞으로 나아갈지 정해요"
      />

      <div className="space-y-3">
        <SectionTitle
          title="행동 방식 선택"
          desc="반복해서 쌓을지, 특정 날짜에 한 번 할지 정해요"
        />

        {ACTION_MODES.map((mode) => (
          <SelectCard
            key={mode.value}
            active={actionMode === mode.value}
            title={mode.label}
            desc={mode.desc}
            sub={mode.sub}
            onClick={() => setActionMode(mode.value)}
          />
        ))}
      </div>

      {actionMode === 'single' ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            이 1회 목표는 별도의 행동 이름 없이 날짜와 기록 방식만 정하면 돼요.
          </p>

          <div>
            <label className="mb-2 block text-sm font-semibold text-amber-800">날짜 선택</label>
            <input
              type="date"
              value={scheduledDate}
              min={getToday()}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full h-12 rounded-xl border border-input bg-white/80 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
            {scheduledDate ? (
              <p className="mt-2 text-xs font-semibold text-amber-700">
                🎯 {scheduledDate}에 완료할 1회 목표예요
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                오늘 이후 날짜만 선택할 수 있어요
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-amber-800">행동 목표 이름</label>
            <Input
              value={actionTitle}
              onChange={(e) => setActionTitle(e.target.value)}
              placeholder={getActionPlaceholder(category)}
              className="h-12 rounded-xl bg-white/80"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-amber-800">주 횟수</label>
            <div className="grid grid-cols-7 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((f) => (
                <button
                  type="button"
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`rounded-xl py-2.5 text-sm font-semibold transition-all ${
                    frequency === f
                      ? 'bg-amber-700 text-amber-50'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">주 {frequency}회</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <SectionTitle
          title="기록 방식 선택"
          desc="이 행동을 어떤 방식으로 완료 처리할지 정해요"
        />

        {ACTION_TYPES.map((type) => (
          <SelectCard
            key={type.value}
            active={actionType === type.value}
            title={type.label}
            desc={type.desc}
            onClick={() => setActionType(type.value)}
          />
        ))}
      </div>

      {actionType === 'timer' ? (
        <div className="space-y-3">
          <div>
            <label className="mb-2 block text-sm font-semibold text-amber-800">1회 시간</label>

            <div className="mb-2 flex gap-2">
              {[20, 30, 60].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setActionMinutes(m)}
                  className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-all ${
                    Number(actionMinutes) === m
                      ? 'bg-amber-700 text-amber-50'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {m}분
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="300"
                value={actionMinutes}
                onChange={(e) => setActionMinutes(Number(e.target.value))}
                className="h-11 flex-1 rounded-xl border border-input bg-white/80 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              />
              <span className="text-sm font-semibold text-muted-foreground">분</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderNicknameStep = () => (
    <div className="space-y-6 px-6">
      <div className="pt-2 text-center">
        <p className="mb-3 text-4xl">🦊</p>
        <h2 className="text-lg font-bold text-amber-900">마지막으로 닉네임을 정해볼까요?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          루트에서 사용할 이름이에요
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-amber-800">닉네임</label>
        <Input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="예: 용사, 루트러너, 새벽공부왕"
          className="h-12 rounded-xl bg-white/80"
        />
      </div>
    </div>
  );

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
        return renderCategoryStep();
      case 'study_dday':
        return renderStudyDDayStep();
      case 'study_dday_date':
        return renderStudyDDayDateStep();
      case 'goal':
        return renderGoalStep();
      case 'action':
        return renderActionStep();
      case 'nickname':
        return renderNicknameStep();
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
      {currentStep !== 'welcome' ? (
        <OnboardingProgress stepIndex={stepIndex} totalSteps={totalSteps} />
      ) : null}

      {renderTopBar()}

      <div className="flex-1 overflow-y-auto pb-4">
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

      {renderBottomButton()}
    </div>
  );
}
