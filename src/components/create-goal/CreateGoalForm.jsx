import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ChevronLeft,
  CalendarDays,
  Footprints,
  Sword,
  ShieldBan,
  Sparkles,
  Target,
  Clock3,
  Flag,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

const ACTION_TYPES = [
  {
    value: 'confirm',
    title: '확인형',
    short: '했는지 체크',
    icon: Sword,
    emoji: '✅',
    desc: '했는지 체크하는 행동이에요.',
  },
  {
    value: 'timer',
    title: '시간기록형',
    short: '시간을 기록',
    icon: Clock3,
    emoji: '⏱️',
    desc: '얼마나 했는지 시간을 기록하는 행동이에요.',
  },
  {
    value: 'abstain',
    title: '안하기형',
    short: '하지 않기',
    icon: ShieldBan,
    emoji: '🚫',
    desc: '하지 않았는지 지키는 행동이에요.',
  },
  {
    value: 'one_time',
    title: '1회성',
    short: '한 번만 하면 끝',
    icon: CheckCircle2,
    emoji: '📌',
    desc: '날짜를 정하고 한 번만 완료하면 끝나는 행동이에요.',
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
  mental: '🧘',
  daily: '🏠',
};

const frequencyPresets = [
  { value: 1, label: '주 1회', desc: '가볍게 시작' },
  { value: 3, label: '주 3회', desc: '꾸준한 루틴' },
  { value: 5, label: '주 5회', desc: '강한 성장' },
  { value: 7, label: '매일', desc: '매일 전진' },
];

const durationPresets = [
  { days: 7, label: '1주' },
  { days: 14, label: '2주' },
  { days: 28, label: '4주' },
  { days: 56, label: '8주' },
];

function getDefaultActionPlaceholder(category) {
  if (category === 'daily') return '예: 빨래하기, 책상 정리, 책 반납하기';
  if (category === 'mental') return '예: 7시 기상, 일기 쓰기, 금연, 병원 예약하기';
  if (category === 'study') return '예: 영어 듣기 30분, 수학 20문제, 토익 시험 접수하기';
  return '예: 러닝 30분, 헬스 가기, 운동화 사기';
}

function getDefaultGoalPlaceholder(category) {
  if (category === 'mental') return '예: 자기관리 루틴 만들기, 절제력 키우기';
  if (category === 'daily') return '예: 생활 루틴 잡기, 집관리 습관 만들기';
  if (category === 'exercise') return '예: 5kg 감량, 턱걸이 10개, 러닝 습관 만들기';
  if (category === 'study') return '예: 토익 900점, 수학 실력 올리기, 자격증 합격';
  return '어떤 결과를 이루고 싶나요?';
}

function getActionTypeMeta(type) {
  return ACTION_TYPES.find((item) => item.value === type) || ACTION_TYPES[0];
}

function formatDateKorean(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const date = d.getDate();
  return `${year}년 ${month}월 ${date}일`;
}

function SummaryChip({ icon, label, value }) {
  return (
    <div
      className="rounded-2xl px-3 py-2"
      style={{
        background: 'rgba(255,248,232,0.78)',
        border: '1px solid rgba(160,120,64,0.16)',
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: 'rgba(139,90,32,0.08)',
            color: '#7a5020',
          }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold" style={{ color: '#9a7b47' }}>
            {label}
          </div>
          <div className="text-sm font-bold truncate" style={{ color: '#4b2d0d' }}>
            {value || '-'}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepHeader({ category, title, desc, stepLabel }) {
  return (
    <div className="text-center pt-2 pb-1">
      <div className="text-4xl mb-3">{categoryEmojis[category] || '🦊'}</div>
      <div
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold mb-3"
        style={{
          background: 'rgba(210,155,56,0.14)',
          color: '#8a5a17',
          border: '1px solid rgba(210,155,56,0.18)',
        }}
      >
        <Sparkles className="w-3 h-3" />
        {stepLabel}
      </div>
      <h2 className="text-xl font-extrabold" style={{ color: '#3d2408' }}>
        {title}
      </h2>
      <p className="text-sm mt-1" style={{ color: '#8f6a33' }}>
        {desc}
      </p>
    </div>
  );
}

function ActionTypeCard({ item, selected, onClick }) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl p-4 text-left transition-all active:scale-[0.99]"
      style={
        selected
          ? {
              background: 'linear-gradient(135deg, #fff3d6 0%, #f5deb0 100%)',
              border: '2px solid #b88328',
              boxShadow: '0 6px 14px rgba(80,50,10,0.10)',
            }
          : {
              background: '#fffaf0',
              border: '1.5px solid rgba(160,120,64,0.18)',
            }
      }
    >
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
          style={
            selected
              ? { background: 'rgba(184,131,40,0.14)', color: '#7a5020' }
              : { background: 'rgba(139,90,32,0.08)', color: '#8f6a33' }
          }
        >
          <Icon className="w-5 h-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-base">{item.emoji}</span>
            <span className="text-sm font-bold" style={{ color: '#3d2408' }}>
              {item.title}
            </span>
          </div>
          <p className="text-sm font-semibold mt-1" style={{ color: '#7a5020' }}>
            {item.short}
          </p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: '#8f6a33' }}>
            {item.desc}
          </p>
        </div>
      </div>
    </button>
  );
}

function SelectCard({ selected, onClick, label, desc }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl p-3 text-left transition-all active:scale-[0.99]"
      style={
        selected
          ? {
              background: 'linear-gradient(135deg, #fff3d6 0%, #f5deb0 100%)',
              border: '2px solid #b88328',
            }
          : {
              background: '#fffaf0',
              border: '1.5px solid rgba(160,120,64,0.18)',
            }
      }
    >
      <div className="text-sm font-bold" style={{ color: '#3d2408' }}>
        {label}
      </div>
      {desc ? (
        <div className="text-[11px] mt-1" style={{ color: '#8f6a33' }}>
          {desc}
        </div>
      ) : null}
    </button>
  );
}

export default function CreateGoalForm({ category }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { triggerHaptic } = useHapticFeedback();
  const paramGoalId = new URLSearchParams(window.location.search).get('goalId');
  const isAddingActionOnlyEarly = !!paramGoalId;
  const formContainerRef = isAddingActionOnlyEarly ? null : useScrollIntoViewOnFocus();

  const today = new Date().toISOString().split('T')[0];

  const { data: existingGoal } = useQuery({
    queryKey: ['existingGoal', category],
    queryFn: async () => {
      const goals = await base44.entities.Goal.filter({
        category,
        status: 'active',
        goal_type: 'result',
      });
      return goals[0] || null;
    },
    enabled: !isAddingActionOnlyEarly,
  });

  const existingGoalId = paramGoalId || existingGoal?.id;
  const isAddingActionOnly = !!existingGoalId;

  const [step, setStep] = useState(0);

  const [goalTitle, setGoalTitle] = useState('');
  const [duration, setDuration] = useState(28);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customWeeks, setCustomWeeks] = useState('');

  const [actionTitle, setActionTitle] = useState('');
  const [actionType, setActionType] = useState('confirm');

  const [frequencyMode, setFrequencyMode] = useState('weekly');
  const [frequency, setFrequency] = useState(3);

  const [minutes, setMinutes] = useState(30);
  const [oneTimeDate, setOneTimeDate] = useState('');

  const createGoalMutation = useMutation({
    mutationFn: async (payload) => payload.data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['actionGoals'] });
      queryClient.invalidateQueries({ queryKey: ['allLogs'] });
      queryClient.invalidateQueries({ queryKey: ['allGoals'] });
      queryClient.invalidateQueries({ queryKey: ['actionGoalsAll'] });
      toast.success(data.message || '저장되었습니다.');
      setTimeout(() => navigate(`/Home?category=${category}`), 250);
    },
    onError: () => toast.error('목표 생성에 실패했습니다.'),
  });

  const currentActionTypeMeta = useMemo(() => getActionTypeMeta(actionType), [actionType]);

  const totalSteps = isAddingActionOnly ? 4 : 5;
  const resultSummary = isAddingActionOnly ? '기존 결과목표에 추가' : goalTitle?.trim() || `${categoryNames[category]} 결과목표`;
  const actionSummary = actionTitle?.trim() || '행동 이름을 입력해주세요';
  const durationSummary = `${duration}일`;
  const frequencySummary =
    actionType === 'one_time'
      ? formatDateKorean(oneTimeDate)
      : actionType === 'abstain'
        ? `${duration}일 동안 지키기`
        : frequencyMode === 'daily'
          ? '매일'
          : frequencyMode === 'weekly'
            ? `주 ${frequency}회`
            : `월 ${frequency}회`;

  const typeSummary =
    actionType === 'timer'
      ? `시간기록형 · ${minutes}분`
      : actionType === 'abstain'
        ? '안하기형'
        : actionType === 'one_time'
          ? '1회성'
          : '확인형';

  const canGoNextFromGoal = isAddingActionOnly || goalTitle.trim();
  const canGoNextFromActionTitle = actionTitle.trim();
  const canGoNextFromOneTimeDate = !!oneTimeDate;
  const canSubmit =
    !!actionTitle.trim() &&
    (isAddingActionOnly || !!goalTitle.trim()) &&
    (actionType !== 'one_time' || !!oneTimeDate) &&
    (actionType !== 'timer' || Number(minutes) > 0);

  const handleBack = () => {
    triggerHaptic('impact', 'light');

    if (step === 0) {
      navigate('/Home');
      return;
    }

    setStep((prev) => Math.max(0, prev - 1));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      triggerHaptic('impact', 'heavy');

      if (isAddingActionOnly) {
        await base44.entities.ActionGoal.create({
          goal_id: existingGoalId,
          category,
          title: actionTitle.trim(),
          action_type: actionType,
          weekly_frequency: actionType === 'one_time' ? 0 : frequencyMode === 'daily' ? 7 : frequency,
          frequency_mode: actionType === 'one_time' ? 'one_time' : frequencyMode,
          duration_minutes: actionType === 'timer' ? Number(minutes) : 0,
          duration_days: actionType === 'one_time' ? null : duration,
          scheduled_date: actionType === 'one_time' ? oneTimeDate : null,
          status: 'active',
        });

        createGoalMutation.mutate({
          data: { message: '새 행동목표가 추가되었습니다! 🦊' },
        });
        return;
      }

      const goal = await base44.entities.Goal.create({
        category,
        goal_type: 'result',
        title: goalTitle.trim(),
        duration_days: duration,
        start_date: today,
        status: 'active',
      });

      await base44.entities.ActionGoal.create({
        goal_id: goal.id,
        category,
        title: actionTitle.trim(),
        action_type: actionType,
        weekly_frequency: actionType === 'one_time' ? 0 : frequencyMode === 'daily' ? 7 : frequency,
        frequency_mode: actionType === 'one_time' ? 'one_time' : frequencyMode,
        duration_minutes: actionType === 'timer' ? Number(minutes) : 0,
        duration_days: actionType === 'one_time' ? null : duration,
        scheduled_date: actionType === 'one_time' ? oneTimeDate : null,
        status: 'active',
      });

      createGoalMutation.mutate({
        data: { message: '새로운 루트가 시작되었습니다! 🦊' },
      });
    } catch (error) {
      console.error(error);
      toast.error('목표 생성에 실패했습니다.');
    }
  };

  const renderGoalStep = () => {
    if (isAddingActionOnly) {
      return (
        <div className="space-y-5">
          <StepHeader
            category={category}
            stepLabel={`1/${totalSteps}`}
            title="새 행동목표를 만들어요"
            desc="이 결과목표를 향해 앞으로 나아갈 행동을 정해보세요."
          />

          <div className="grid grid-cols-1 gap-2">
            <SummaryChip icon={<Flag className="w-4 h-4" />} label="카테고리" value={categoryNames[category]} />
            <SummaryChip icon={<Target className="w-4 h-4" />} label="상태" value="기존 결과목표에 행동목표 추가" />
          </div>

          <Button
            className="w-full h-12 rounded-2xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold"
            onClick={() => setStep(1)}
          >
            행동 이름 입력하기
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <StepHeader
          category={category}
          stepLabel={`1/${totalSteps}`}
          title="먼저 결과목표를 정해요"
          desc="루트의 도착점을 정하면 행동목표가 더 자연스럽게 따라와요."
        />

        <div>
          <label className="text-sm font-semibold mb-2 block" style={{ color: '#7a5020' }}>
            결과 목표
          </label>
          <Input
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            placeholder={getDefaultGoalPlaceholder(category)}
            className="h-12 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 placeholder:text-amber-400 font-medium"
          />
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block" style={{ color: '#7a5020' }}>
            기간
          </label>

          <div className="grid grid-cols-4 gap-2 mb-2">
            {durationPresets.map((item) => (
              <button
                type="button"
                key={item.days}
                onClick={() => {
                  setDuration(item.days);
                  setIsCustomDuration(false);
                  setCustomWeeks('');
                }}
                className="py-3 rounded-2xl text-sm font-semibold transition-all"
                style={
                  !isCustomDuration && duration === item.days
                    ? { background: '#8b5a20', color: '#fff' }
                    : { background: '#f3ead7', color: '#7a5020' }
                }
              >
                {item.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setIsCustomDuration(true)}
              className="py-3 rounded-2xl text-sm font-semibold transition-all"
              style={
                isCustomDuration
                  ? { background: '#8b5a20', color: '#fff' }
                  : { background: '#f3ead7', color: '#7a5020' }
              }
            >
              직접
            </button>
          </div>

          {isCustomDuration && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number"
                min="1"
                max="52"
                value={customWeeks}
                onChange={(e) => {
                  const value = e.target.value;
                  setCustomWeeks(value);
                  setDuration(Math.max(1, Number(value || 0)) * 7);
                }}
                placeholder="주 수 입력"
                className="flex-1 h-11 rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 text-sm text-amber-900 font-medium"
              />
              <span className="text-sm font-semibold" style={{ color: '#7a5020' }}>
                주
              </span>
            </div>
          )}
        </div>

        <Button
          className="w-full h-12 rounded-2xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold"
          disabled={!canGoNextFromGoal}
          onClick={() => setStep(1)}
        >
          행동 이름 입력하기
        </Button>
      </div>
    );
  };

  const renderActionTitleStep = () => (
    <div className="space-y-5">
      <StepHeader
        category={category}
        stepLabel={`2/${totalSteps}`}
        title="어떤 행동을 할 건가요?"
        desc="작게라도 지금 시작할 수 있는 행동을 적어보세요."
      />

      <div className="grid grid-cols-1 gap-2">
        <SummaryChip icon={<Target className="w-4 h-4" />} label="결과목표" value={resultSummary} />
        {!isAddingActionOnly && (
          <SummaryChip icon={<CalendarDays className="w-4 h-4" />} label="기간" value={durationSummary} />
        )}
      </div>

      <div>
        <label className="text-sm font-semibold mb-2 block" style={{ color: '#7a5020' }}>
          행동 이름
        </label>
        <Input
          value={actionTitle}
          onChange={(e) => setActionTitle(e.target.value)}
          placeholder={getDefaultActionPlaceholder(category)}
          className="h-12 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 placeholder:text-amber-400 font-medium"
        />
      </div>

      <Button
        className="w-full h-12 rounded-2xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold"
        disabled={!canGoNextFromActionTitle}
        onClick={() => setStep(2)}
      >
        행동유형 선택하기
      </Button>
    </div>
  );

  const renderActionTypeStep = () => (
    <div className="space-y-5">
      <StepHeader
        category={category}
        stepLabel={`3/${totalSteps}`}
        title="이 행동은 어떻게 기록할까요?"
        desc="행동에 맞는 기록 방식을 선택하세요."
      />

      <div className="grid grid-cols-1 gap-2">
        <SummaryChip icon={<Target className="w-4 h-4" />} label="행동목표" value={actionSummary} />
        <SummaryChip icon={<Flag className="w-4 h-4" />} label="카테고리" value={categoryNames[category]} />
      </div>

      <div className="space-y-3">
        {ACTION_TYPES.map((item) => (
          <ActionTypeCard
            key={item.value}
            item={item}
            selected={actionType === item.value}
            onClick={() => {
              setActionType(item.value);

              if (item.value === 'abstain') {
                setFrequencyMode('daily');
                setFrequency(7);
              } else if (item.value === 'one_time') {
                setOneTimeDate(oneTimeDate || today);
              } else if (frequencyMode === 'daily' && item.value !== 'abstain') {
                setFrequency(7);
              }
            }}
          />
        ))}
      </div>

      <Button
        className="w-full h-12 rounded-2xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold"
        onClick={() => setStep(3)}
      >
        다음
      </Button>
    </div>
  );

  const renderConfigStep = () => {
    if (actionType === 'one_time') {
      return (
        <div className="space-y-5">
          <StepHeader
            category={category}
            stepLabel={`4/${totalSteps}`}
            title="언제 할 예정인가요?"
            desc="한 번만 하면 끝나는 행동이에요. 날짜를 선택하세요."
          />

          <div className="grid grid-cols-1 gap-2">
            <SummaryChip icon={<Target className="w-4 h-4" />} label="행동목표" value={actionSummary} />
            <SummaryChip icon={<currentActionTypeMeta.icon className="w-4 h-4" />} label="행동유형" value="1회성" />
          </div>

          <div>
            <label
              className="text-sm font-semibold mb-2 block flex items-center gap-1"
              style={{ color: '#7a5020' }}
            >
              <CalendarDays className="w-4 h-4" />
              날짜 선택
            </label>
            <input
              type="date"
              value={oneTimeDate}
              min={today}
              onChange={(e) => setOneTimeDate(e.target.value)}
              className="w-full h-12 rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 text-sm text-amber-900 font-medium"
            />
            <p className="text-xs font-semibold mt-2" style={{ color: '#8a5a17' }}>
              오늘 이후 날짜만 선택할 수 있어요.
            </p>
          </div>

          <div
            className="rounded-2xl px-4 py-3"
            style={{
              background: 'rgba(255,248,232,0.78)',
              border: '1px solid rgba(160,120,64,0.16)',
              color: '#7a5020',
            }}
          >
            <div className="text-sm font-bold mb-1">선택한 날짜</div>
            <div className="text-sm" style={{ color: '#8f6a33' }}>
              {oneTimeDate ? formatDateKorean(oneTimeDate) : '날짜를 선택해주세요.'}
            </div>
          </div>

          <Button
            className="w-full h-12 rounded-2xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold"
            disabled={!canGoNextFromOneTimeDate}
            onClick={() => setStep(4)}
          >
            저장 전 확인하기
          </Button>
        </div>
      );
    }

    if (actionType === 'abstain') {
      return (
        <div className="space-y-5">
          <StepHeader
            category={category}
            stepLabel={`4/${totalSteps}`}
            title="얼마나 지킬까요?"
            desc="하지 않을 기간을 정하세요."
          />

          <div className="grid grid-cols-1 gap-2">
            <SummaryChip icon={<Target className="w-4 h-4" />} label="행동목표" value={actionSummary} />
            <SummaryChip icon={<currentActionTypeMeta.icon className="w-4 h-4" />} label="행동유형" value="안하기형" />
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block" style={{ color: '#7a5020' }}>
              지킬 기간
            </label>
            <div className="grid grid-cols-4 gap-2">
              {durationPresets.map((item) => (
                <SelectCard
                  key={item.days}
                  selected={duration === item.days}
                  onClick={() => setDuration(item.days)}
                  label={item.label}
                />
              ))}
            </div>
          </div>

          <Button
            className="w-full h-12 rounded-2xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold"
            onClick={() => setStep(4)}
          >
            저장 전 확인하기
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <StepHeader
          category={category}
          stepLabel={`4/${totalSteps}`}
          title={actionType === 'timer' ? '얼마나 기록할까요?' : '얼마나 자주 할까요?'}
          desc={
            actionType === 'timer'
              ? '한 번에 할 시간과 반복 방식을 정하세요.'
              : '반복 방식과 기간을 정하세요.'
          }
        />

        <div className="grid grid-cols-1 gap-2">
          <SummaryChip icon={<Target className="w-4 h-4" />} label="행동목표" value={actionSummary} />
          <SummaryChip icon={<currentActionTypeMeta.icon className="w-4 h-4" />} label="행동유형" value={currentActionTypeMeta.title} />
        </div>

        {actionType === 'timer' && (
          <div>
            <label className="text-sm font-semibold mb-2 block" style={{ color: '#7a5020' }}>
              한 번에 얼마나 할까요?
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[10, 20, 30, 60, 90, 120].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMinutes(m)}
                  className="py-3 rounded-2xl text-sm font-semibold transition-all"
                  style={
                    minutes === m
                      ? { background: '#8b5a20', color: '#fff' }
                      : { background: '#f3ead7', color: '#7a5020' }
                  }
                >
                  {m >= 60 && m % 60 === 0 ? `${m / 60}시간` : `${m}분`}
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
                className="flex-1 h-11 rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 text-sm text-amber-900 font-medium"
              />
              <span className="text-sm font-semibold" style={{ color: '#7a5020' }}>
                분
              </span>
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-semibold mb-2 block" style={{ color: '#7a5020' }}>
            반복 방식
          </label>

          <div className="grid grid-cols-3 gap-2 mb-2">
            <SelectCard
              selected={frequencyMode === 'daily'}
              onClick={() => {
                setFrequencyMode('daily');
                setFrequency(7);
              }}
              label="매일"
              desc="매일 실천"
            />
            <SelectCard
              selected={frequencyMode === 'weekly'}
              onClick={() => {
                setFrequencyMode('weekly');
                if (frequency === 7) setFrequency(3);
              }}
              label="주 n회"
              desc="주마다 반복"
            />
            <SelectCard
              selected={frequencyMode === 'monthly'}
              onClick={() => {
                setFrequencyMode('monthly');
                if (frequency === 7) setFrequency(4);
              }}
              label="월 n회"
              desc="한 달 기준"
            />
          </div>

          {frequencyMode === 'weekly' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {frequencyPresets.map((item) => (
                  <SelectCard
                    key={item.value}
                    selected={frequency === item.value}
                    onClick={() => setFrequency(item.value)}
                    label={item.label}
                    desc={item.desc}
                  />
                ))}
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block" style={{ color: '#7a5020' }}>
                  직접 선택
                </label>
                <div className="grid grid-cols-7 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7].map((f) => (
                    <button
                      type="button"
                      key={f}
                      onClick={() => setFrequency(f)}
                      className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={
                        frequency === f
                          ? { background: '#8b5a20', color: '#fff' }
                          : { background: '#f3ead7', color: '#7a5020' }
                      }
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {frequencyMode === 'monthly' && (
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 4, 8, 12].map((f) => (
                  <button
                    type="button"
                    key={f}
                    onClick={() => setFrequency(f)}
                    className="py-3 rounded-2xl text-sm font-semibold transition-all"
                    style={
                      frequency === f
                        ? { background: '#8b5a20', color: '#fff' }
                        : { background: '#f3ead7', color: '#7a5020' }
                    }
                  >
                    {f}회
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={frequency}
                  onChange={(e) => setFrequency(Number(e.target.value))}
                  className="flex-1 h-11 rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 text-sm text-amber-900 font-medium"
                />
                <span className="text-sm font-semibold" style={{ color: '#7a5020' }}>
                  회 / 월
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block" style={{ color: '#7a5020' }}>
            기간
          </label>
          <div className="grid grid-cols-4 gap-2">
            {durationPresets.map((item) => (
              <SelectCard
                key={item.days}
                selected={duration === item.days}
                onClick={() => setDuration(item.days)}
                label={item.label}
              />
            ))}
          </div>
        </div>

        <Button
          className="w-full h-12 rounded-2xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold"
          onClick={() => setStep(4)}
        >
          저장 전 확인하기
        </Button>
      </div>
    );
  };

  const renderFinalStep = () => (
    <div className="space-y-5">
      <StepHeader
        category={category}
        stepLabel={`${totalSteps}/${totalSteps}`}
        title="이렇게 진행할까요?"
        desc="마지막으로 이번 행동목표를 한 번 확인해볼까요?"
      />

      <div className="grid grid-cols-1 gap-2">
        <SummaryChip icon={<Flag className="w-4 h-4" />} label="카테고리" value={categoryNames[category]} />
        {!isAddingActionOnly && (
          <SummaryChip icon={<Target className="w-4 h-4" />} label="결과목표" value={resultSummary} />
        )}
        <SummaryChip icon={<Sword className="w-4 h-4" />} label="행동목표" value={actionSummary} />
        <SummaryChip icon={<currentActionTypeMeta.icon className="w-4 h-4" />} label="행동유형" value={typeSummary} />
        <SummaryChip
          icon={actionType === 'one_time' ? <CalendarDays className="w-4 h-4" /> : <Footprints className="w-4 h-4" />}
          label={actionType === 'one_time' ? '예정일' : '반복 / 기간'}
          value={actionType === 'one_time' ? formatDateKorean(oneTimeDate) : `${frequencySummary} · ${duration}일`}
        />
      </div>

      {actionType === 'one_time' && (
        <div
          className="rounded-2xl px-4 py-3"
          style={{
            background: 'rgba(255,248,232,0.78)',
            border: '1px solid rgba(160,120,64,0.16)',
            color: '#7a5020',
          }}
        >
          <div className="text-sm font-bold mb-1">1회성 목표 안내</div>
          <div className="text-xs leading-relaxed" style={{ color: '#8f6a33' }}>
            완료하면 행동목표 목록에서는 사라지고 기록 타임라인에 남게 만들 수 있어요.
          </div>
        </div>
      )}

      <Button
        className="w-full h-12 rounded-2xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold"
        disabled={!canSubmit || createGoalMutation.isPending}
        onClick={handleSubmit}
      >
        {createGoalMutation.isPending ? '저장 중...' : '저장하기 🦊'}
      </Button>
    </div>
  );

  const renderStep = () => {
    if (step === 0) return renderGoalStep();
    if (step === 1) return renderActionTitleStep();
    if (step === 2) return renderActionTypeStep();
    if (step === 3) return renderConfigStep();
    if (step === 4) return renderFinalStep();
    return null;
  };

  return (
    <div
      ref={formContainerRef || null}
      className="min-h-screen bg-background max-w-lg mx-auto overflow-y-auto"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="sticky top-0 z-20 px-4 pt-3 pb-2 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{
              background: '#fffaf0',
              border: '1.5px solid rgba(160,120,64,0.18)',
              color: '#7a5020',
            }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="text-sm font-extrabold" style={{ color: '#3d2408' }}>
              {isAddingActionOnly ? '행동목표 추가' : `${categoryNames[category]} 루트 만들기`}
            </div>
            <div className="text-[11px]" style={{ color: '#8f6a33' }}>
              작은 행동이 캐릭터를 앞으로 움직이게 해요
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 pb-8">{renderStep()}</div>
    </div>
  );
}