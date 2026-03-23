import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

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
    sub: '예: 주 3회 러닝, 주 5회 영어 단어',
  },
  {
    value: 'single',
    label: '🎯 단발형',
    desc: '특정 날짜에 한 번 하는 행동이에요',
    sub: '예: 모의고사 보기, 병원 가기, 서류 제출',
  },
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

const getGoalPlaceholder = (category) => {
  if (category === 'mental') return '예: 자기관리, 생활규칙 만들기, 절제, 나 챙기기';
  if (category === 'daily') return '예: 갓생살기, 일찍 일어나기, 루틴 찾기';
  if (category === 'exercise') return '예: 살빼기, 턱걸이 30개, 등산 100회';
  if (category === 'study') return '예: 수학 1회독, 영어 실력 올리기';
  return '어떤 결과를 이루고 싶으신가요?';
};

const getRoutineActionPlaceholder = (category) => {
  if (category === 'daily') return '예: 팩하기, 집청소, 빨래, 부모님 연락';
  if (category === 'mental') return '예: 7시 기상, 일기쓰기, 금연, 명상';
  if (category === 'study') return '예: 독해, 듣기, 회화, 전공서, 수학';
  if (category === 'exercise') return '예: 러닝, 등산, 헬스, 야식참기';
  return '예: 러닝, LC 공부, 명상';
};

const getSingleActionPlaceholder = (category) => {
  if (category === 'daily') return '예: 방 청소하기, 서류 제출하기, 행정업무 처리';
  if (category === 'mental') return '예: 상담 예약하기, 디지털 디톡스 하루 하기';
  if (category === 'study') return '예: 모의고사 보기, 과제 제출하기, 시험 접수하기';
  if (category === 'exercise') return '예: 체성분 검사하기, 헬스 OT 받기, 등산 가기';
  return '예: 한 번에 끝낼 행동을 입력하세요';
};

const getToday = () => new Date().toISOString().split('T')[0];

const getDaysLeft = (dateString) => {
  if (!dateString) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
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

export default function CreateGoal() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { triggerHaptic } = useHapticFeedback();
  const formContainerRef = useScrollIntoViewOnFocus();

  const category = searchParams.get('category') || location.state?.category || 'exercise';
  const paramGoalId = searchParams.get('goalId') || location.state?.goalId || null;
  const isAddingActionOnly = Boolean(paramGoalId);
  const isStudy = category === 'study';

  const { data: existingGoal } = useQuery({
    queryKey: ['existingGoal', category],
    enabled: !isAddingActionOnly,
    queryFn: async () => {
      const goals = await base44.entities.Goal.filter({
        category,
        status: 'active',
        goal_type: 'result',
      });
      return goals[0] || null;
    },
  });

  const existingGoalId = paramGoalId || existingGoal?.id || null;

  const [step, setStep] = useState(0);

  // 결과목표 전용
  const [hasDDay, setHasDDay] = useState(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [duration, setDuration] = useState(56);
  const [customWeeks, setCustomWeeks] = useState('');
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [dDay, setDDay] = useState('');
  const [examTitle, setExamTitle] = useState('');

  // 행동목표 전용
  const [actionMode, setActionMode] = useState('routine');
  const [actionTitle, setActionTitle] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [actionType, setActionType] = useState('confirm');
  const [frequency, setFrequency] = useState(3);
  const [minutes, setMinutes] = useState(30);

  useEffect(() => {
    setStep(0);
    setActionMode('routine');
    setActionTitle('');
    setScheduledDate('');
    setActionType('confirm');
    setFrequency(3);
    setMinutes(30);
  }, [category, paramGoalId]);

  const pageTitle = isAddingActionOnly
    ? `${categoryNames[category]} 행동 목표 추가`
    : `${categoryNames[category]} 결과 목표 만들기`;

  const pageDesc = isAddingActionOnly
    ? '지금 결과목표에 연결할 행동을 추가해요'
    : '이번 카테고리의 최종 목표를 먼저 정해요';

  const daysLeft = useMemo(() => getDaysLeft(dDay), [dDay]);

  const calcDuration = () => {
    if (!dDay) return 90;
    const diff = getDaysLeft(dDay);
    return Math.max(1, diff || 1);
  };

  const finalGoalTitle = isStudy && hasDDay ? examTitle.trim() : goalTitle.trim();
  const finalDuration = isStudy && hasDDay ? calcDuration() : duration;

  const isStudyEntryStep = !isAddingActionOnly && isStudy && step === 0;
  const isStudyDDayStep = !isAddingActionOnly && isStudy && step === 1 && hasDDay;
  const isGoalStep =
    !isAddingActionOnly &&
    ((isStudy && step === 1 && !hasDDay) || (!isStudy && step === 0));

  const isGoalStepValid = (() => {
    if (!isGoalStep) return false;
    if (!goalTitle.trim()) return false;

    if (isCustomDuration) {
      const weeks = Number(customWeeks);
      if (!weeks || weeks < 1) return false;
    }

    return true;
  })();

  const isStudyDDayStepValid = (() => {
    if (!isStudyDDayStep) return false;
    return !!dDay && !!examTitle.trim();
  })();

  const isActionStepValid = (() => {
    if (!isAddingActionOnly) return false;
    if (!existingGoalId) return false;
    if (!actionTitle.trim()) return false;

    if (actionMode === 'single' && !scheduledDate) return false;
    if (actionMode === 'routine' && (!frequency || frequency < 1 || frequency > 7)) return false;
    if (actionType === 'timer' && (!minutes || Number(minutes) < 1)) return false;

    return true;
  })();

  const createGoalMutation = useMutation({
    mutationFn: async ({ message }) => ({ message }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['actionGoals'] });
      queryClient.invalidateQueries({ queryKey: ['allLogs'] });
      queryClient.invalidateQueries({ queryKey: ['allGoals'] });
      queryClient.invalidateQueries({ queryKey: ['actionGoalsAll'] });
      queryClient.invalidateQueries({ queryKey: ['existingGoal', category] });

      toast.success(data.message);
      setTimeout(() => navigate(`/Home?category=${category}`), 250);
    },
    onError: () => toast.error('저장에 실패했습니다.'),
  });

  const handleBack = () => {
    triggerHaptic('impact', 'light');

    if (isAddingActionOnly) {
      navigate(`/Home?category=${category}`);
      return;
    }

    if (isStudy) {
      if (step === 0) {
        navigate(`/Home?category=${category}`);
        return;
      }
      setStep(step - 1);
      return;
    }

    if (step === 0) {
      navigate(`/Home?category=${category}`);
      return;
    }

    setStep(step - 1);
  };

  const handleCreateResultGoal = async () => {
    if (createGoalMutation.isPending) return;

    try {
      triggerHaptic('impact', 'heavy');

      await base44.entities.Goal.create({
        category,
        goal_type: 'result',
        title: finalGoalTitle,
        duration_days: finalDuration,
        start_date: getToday(),
        ...(isStudy && hasDDay ? { d_day: dDay, has_d_day: true } : {}),
        status: 'active',
      });

      createGoalMutation.mutate({ message: '결과 목표가 만들어졌습니다! 🦊' });
    } catch (error) {
      console.error(error);
      toast.error('결과 목표 저장 중 문제가 발생했습니다.');
    }
  };

  const handleCreateActionGoal = async () => {
    if (!existingGoalId) {
      toast.error('연결할 결과목표를 찾지 못했습니다. 홈에서 다시 들어와 주세요.');
      return;
    }

    if (!isActionStepValid || createGoalMutation.isPending) return;

    try {
      triggerHaptic('impact', 'heavy');

      await base44.entities.ActionGoal.create({
        goal_id: existingGoalId,
        category,
        title: actionTitle.trim(),
        action_mode: actionMode,
        action_type: actionType,
        weekly_frequency: actionMode === 'routine' ? frequency : null,
        scheduled_date: actionMode === 'single' ? scheduledDate : null,
        duration_minutes: actionType === 'timer' ? Math.max(1, Number(minutes) || 1) : 0,
        status: 'active',
      });

      createGoalMutation.mutate({ message: '행동 목표가 추가되었습니다! 🦊' });
    } catch (error) {
      console.error(error);
      toast.error('행동 목표 저장 중 문제가 발생했습니다.');
    }
  };

  const renderHeader = () => (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
          aria-label="뒤로가기"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <p className="text-xs font-semibold text-amber-700">
            {categoryEmojis[category]} {categoryNames[category]}
          </p>
          <h1 className="text-lg font-bold text-foreground">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground">{pageDesc}</p>
        </div>
      </div>
    </div>
  );

  const renderStudyEntryStep = () => (
    <div className="space-y-6">
      <div className="pt-2 text-center">
        <p className="mb-3 text-4xl">📚</p>
        <h2 className="text-lg font-bold text-amber-900">시험 D-day가 있나요?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          공부 결과목표는 시험형과 일반형으로 나눌 수 있어요
        </p>
      </div>

      <div className="space-y-3">
        <SelectCard
          active={hasDDay === true}
          title="📅 D-day 있음"
          desc="시험이나 마감일이 정해져 있어요"
          sub="예: 토익, 자격증, 모의고사, 과제 마감"
          onClick={() => {
            setHasDDay(true);
            setStep(1);
          }}
        />

        <SelectCard
          active={hasDDay === false}
          title="📖 D-day 없음"
          desc="꾸준히 실력을 쌓는 결과목표예요"
          sub="예: 수학 1회독, 영어 실력 올리기"
          onClick={() => {
            setHasDDay(false);
            setStep(1);
          }}
        />
      </div>
    </div>
  );

  const renderStudyDDayStep = () => (
    <div className="space-y-6">
      <SectionTitle
        title="시험 결과목표 설정"
        desc="시험 날짜와 목표 이름을 입력하면 기간이 자동 계산돼요"
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
        <label className="mb-2 block text-sm font-semibold text-amber-800">시험 목표 이름</label>
        <Input
          value={examTitle}
          onChange={(e) => setExamTitle(e.target.value)}
          placeholder="예: 토익 900점, 수능, 정보처리기사"
          className="h-12 rounded-xl bg-white/80"
        />
      </div>

      <Button
        type="button"
        className="h-12 w-full rounded-xl bg-amber-700 font-semibold text-amber-50 hover:bg-amber-800"
        disabled={!isStudyDDayStepValid || createGoalMutation.isPending}
        onClick={handleCreateResultGoal}
      >
        {createGoalMutation.isPending ? '저장 중...' : '결과 목표 만들기 🦊'}
      </Button>
    </div>
  );

  const renderGoalStep = () => (
    <div className="space-y-6">
      <SectionTitle
        title="결과 목표 설정"
        desc="이번 카테고리에서 이루고 싶은 최종 목표 하나를 정해요"
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

      <Button
        type="button"
        className="h-12 w-full rounded-xl bg-amber-700 font-semibold text-amber-50 hover:bg-amber-800"
        disabled={!isGoalStepValid || createGoalMutation.isPending}
        onClick={handleCreateResultGoal}
      >
        {createGoalMutation.isPending ? '저장 중...' : '결과 목표 만들기 🦊'}
      </Button>
    </div>
  );

  const renderActionModeSection = () => (
    <div className="space-y-3">
      <SectionTitle
        title="행동 방식 선택"
        desc="행동목표 안에서만 루틴형과 단발형을 만들 수 있어요"
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
  );

  const renderActionTypeSection = () => (
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
  );

  const renderRoutineSection = () => (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-semibold text-amber-800">행동 목표 이름</label>
        <Input
          value={actionTitle}
          onChange={(e) => setActionTitle(e.target.value)}
          placeholder={getRoutineActionPlaceholder(category)}
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
  );

  const renderSingleSection = () => (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-semibold text-amber-800">1회 행동</label>
        <Input
          value={actionTitle}
          onChange={(e) => setActionTitle(e.target.value)}
          placeholder={getSingleActionPlaceholder(category)}
          className="h-12 rounded-xl bg-white/80"
        />
      </div>

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
            🎯 {scheduledDate}에 완료할 1회 행동이에요
          </p>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">오늘 이후 날짜만 선택할 수 있어요</p>
        )}
      </div>
    </div>
  );

  const renderMinutesSection = () => (
    <div className="space-y-3">
      <div>
        <label className="mb-2 block text-sm font-semibold text-amber-800">1회 시간</label>

        <div className="mb-2 flex gap-2">
          {[20, 30, 60].map((m) => (
            <button
              type="button"
              key={m}
              onClick={() => setMinutes(m)}
              className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-all ${
                Number(minutes) === m
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
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="h-11 flex-1 rounded-xl border border-input bg-white/80 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          />
          <span className="text-sm font-semibold text-muted-foreground">분</span>
        </div>
      </div>
    </div>
  );

  const renderActionStep = () => (
    <div className="space-y-6">
      <SectionTitle
        title="행동 목표 추가"
        desc="루틴형과 단발형은 여기서만 만들 수 있어요"
      />

      {!existingGoalId ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          연결할 결과목표를 찾지 못했습니다. 홈 화면에서 결과목표 카드 아래의
          “행동목표 추가하기” 버튼으로 다시 들어와 주세요.
        </div>
      ) : null}

      {renderActionModeSection()}

      {actionMode === 'single' ? renderSingleSection() : renderRoutineSection()}

      {renderActionTypeSection()}

      {actionType === 'timer' ? renderMinutesSection() : null}

      <Button
        type="button"
        className="h-12 w-full rounded-xl bg-amber-700 font-semibold text-amber-50 hover:bg-amber-800"
        disabled={!isActionStepValid || createGoalMutation.isPending}
        onClick={handleCreateActionGoal}
      >
        {createGoalMutation.isPending ? '저장 중...' : '행동 목표 추가하기 🦊'}
      </Button>
    </div>
  );

  const renderStep = () => {
    if (isAddingActionOnly) return renderActionStep();
    if (isStudyEntryStep) return renderStudyEntryStep();
    if (isStudyDDayStep) return renderStudyDDayStep();
    if (isGoalStep) return renderGoalStep();
    return null;
  };

  return (
    <div
      ref={formContainerRef}
      className="min-h-screen max-w-lg mx-auto bg-background"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="p-6 pb-10">
        {renderHeader()}
        {renderStep()}
      </div>
    </div>
  );
}
