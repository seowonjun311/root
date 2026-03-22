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
} from 'lucide-react';
import { toast } from 'sonner';

const ACTION_TYPES = [
  {
    value: 'confirm',
    title: '확인형',
    short: '했으면 체크',
    icon: Sword,
    emoji: '✅',
    desc: '행동을 끝낸 뒤 바로 확인하는 일반 퀘스트예요.',
  },
  {
    value: 'timer',
    title: '시간기록형',
    short: '시간을 재며 수행',
    icon: Clock3,
    emoji: '⏱️',
    desc: '집중 시간이나 운동 시간을 기록하는 퀘스트예요.',
  },
  {
    value: 'abstain',
    title: '안하기형',
    short: '유혹을 참기',
    icon: ShieldBan,
    emoji: '🚫',
    desc: '하지 않기로 한 행동을 버티는 절제 퀘스트예요.',
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

function getDefaultActionPlaceholder(category) {
  if (category === 'daily') return '예: 빨래하기, 책상 정리, 부모님께 연락하기';
  if (category === 'mental') return '예: 7시 기상, 일기 쓰기, 금연, 명상';
  if (category === 'study') return '예: 영어 듣기 30분, 수학 20문제, 전공 복습';
  return '예: 러닝 30분, 헬스 가기, 야식 참기';
}

function getDefaultGoalPlaceholder(category) {
  if (category === 'mental') return '예: 자기관리 루틴 만들기, 절제력 키우기';
  if (category === 'daily') return '예: 생활 루틴 잡기, 집관리 습관 만들기';
  if (category === 'exercise') return '예: 5kg 감량, 턱걸이 10개, 러닝 습관 만들기';
  return '어떤 결과를 이루고 싶나요?';
}

function getActionTypeMeta(type) {
  return ACTION_TYPES.find((item) => item.value === type) || ACTION_TYPES[0];
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

function FrequencyCard({ selected, onClick, label, desc }) {
  return (
    <button
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
      <div className="text-[11px] mt-1" style={{ color: '#8f6a33' }}>
        {desc}
      </div>
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
  const isStudy = category === 'study';
  const isAddingActionOnly = !!existingGoalId;

  const [step, setStep] = useState(0);
  const [hasDDay, setHasDDay] = useState(null);
  const [dDay, setDDay] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [duration, setDuration] = useState(56);
  const [customWeeks, setCustomWeeks] = useState('');
  const [isCustomDuration, setIsCustomDuration] = useState(false);

  const [actionTitle, setActionTitle] = useState('');
  const [actionType, setActionType] = useState('confirm');
  const [frequency, setFrequency] = useState(3);
  const [minutes, setMinutes] = useState(30);

  const createGoalMutation = useMutation({
    mutationFn: async (payload) => payload.data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['actionGoals'] });
      queryClient.invalidateQueries({ queryKey: ['allLogs'] });
      queryClient.invalidateQueries({ queryKey: ['allGoals'] });
      queryClient.invalidateQueries({ queryKey: ['actionGoalsAll'] });
      toast.success(data.message);
      setTimeout(() => navigate(`/Home?category=${category}`), 300);
    },
    onError: () => toast.error('목표 생성에 실패했습니다.'),
  });

  const calcDuration = () => {
    if (!dDay) return 90;
    const diff = Math.ceil((new Date(dDay) - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  };

  const currentActionTypeMeta = useMemo(() => getActionTypeMeta(actionType), [actionType]);

  const resultTitle = isStudy && hasDDay ? examTitle : goalTitle;
  const resultDuration = isStudy && hasDDay ? calcDuration() : duration;
  const resultSummary = resultTitle?.trim() || `${categoryNames[category]} 결과목표`;
  const actionSummary = actionTitle?.trim() || '행동목표 이름을 정해주세요';
  const frequencySummary = frequency === 7 ? '매일' : `주 ${frequency}회`;
  const typeSummary =
    actionType === 'timer'
      ? `시간기록형 · ${minutes}분`
      : actionType === 'abstain'
        ? '안하기형'
        : '확인형';

  const handleBack = () => {
    triggerHaptic('impact', 'light');

    if (isAddingActionOnly) {
      navigate('/Home');
      return;
    }

    if (step === 0) {
      navigate('/Home');
      return;
    }

    if (isStudy) {
      if (step === 1) {
        setStep(0);
        return;
      }
      if (step === 2) {
        setStep(1);
        return;
      }
      if (step === 3) {
        setStep(2);
        return;
      }
      if (step === 4) {
        setStep(3);
        return;
      }
      if (step === 5) {
        if (actionType === 'timer') {
          setStep(4);
        } else {
          setStep(3);
        }
        return;
      }
    } else {
      if (step === 1) {
        setStep(0);
        return;
      }
      if (step === 2) {
        setStep(1);
        return;
      }
      if (step === 3) {
        setStep(2);
        return;
      }
      if (step === 4) {
        if (actionType === 'timer') {
          setStep(3);
        } else {
          setStep(2);
        }
      }
    }
  };

  const handleSubmit = async () => {
    triggerHaptic('impact', 'heavy');

    if (isAddingActionOnly) {
      await base44.entities.ActionGoal.create({
        goal_id: existingGoalId,
        category,
        title: actionTitle.trim(),
        action_type: actionType,
        weekly_frequency: frequency,
        duration_minutes: actionType === 'timer' ? minutes : 0,
        status: 'active',
      });

      createGoalMutation.mutate({
        addingActionOnly: true,
        data: { message: '새 퀘스트가 추가되었습니다! 🦊' },
      });
      return;
    }

    const finalDuration = isStudy && hasDDay ? calcDuration() : duration;
    const finalTitle = isStudy && hasDDay ? examTitle.trim() : goalTitle.trim();
    const finalDDay = isStudy && hasDDay ? dDay : undefined;

    const goal = await base44.entities.Goal.create({
      category,
      goal_type: 'result',
      title: finalTitle,
      duration_days: finalDuration,
      start_date: new Date().toISOString().split('T')[0],
      ...(finalDDay ? { d_day: finalDDay, has_d_day: true } : {}),
      status: 'active',
    });

    await base44.entities.ActionGoal.create({
      goal_id: goal.id,
      category,
      title: actionTitle.trim() || finalTitle,
      action_type: actionType,
      weekly_frequency: frequency,
      duration_minutes: actionType === 'timer' ? minutes : 0,
      duration_days: finalDuration,
      status: 'active',
    });

    createGoalMutation.mutate({
      data: { message: '새로운 루트가 시작되었습니다! 🦊' },
    });
  };

  const goNextFromGoal = () => {
    if (isStudy) {
      setStep(1);
      return;
    }
    setStep(1);
  };

  const renderAddActionOnlyMode = () => {
    const finalStep = actionType === 'timer' ? 3 : 2;

    return (
      <div className="space-y-5">
        <StepHeader
          category={category}
          stepLabel={`행동목표 생성 · ${step + 1}/${finalStep + 1}`}
          title="새 퀘스트를 추가해요"
          desc="이 결과목표를 향해 앞으로 나아갈 행동을 정해보세요."
        />

        <div className="grid grid-cols-1 gap-2">
          <SummaryChip icon={<Flag className="w-4 h-4" />} label="카테고리" value={categoryNames[category]} />
          <SummaryChip icon={<Target className="w-4 h-4" />} label="행동목표" value={actionSummary} />
        </div>

        {step === 0 && (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-semibold mb-2 block" style={{ color: '#7a5020' }}>
                퀘스트 이름
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
              disabled={!actionTitle.trim()}
              onClick={() => setStep(1)}
            >
              행동유형 정하기
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <StepHeader
              category={category}
              stepLabel={`행동목표 생성 · 2/${finalStep + 1}`}
              title="이 퀘스트는 어떤 방식인가요?"
              desc="기록 방식에 따라 홈 화면의 버튼과 진행 방식이 달라져요."
            />

            {ACTION_TYPES.map((item) => (
              <ActionTypeCard
                key={item.value}
                item={item}
                selected={actionType === item.value}
                onClick={() => {
                  setActionType(item.value);
                  if (item.value === 'abstain') setFrequency(7);
                }}
              />
            ))}

            <Button
              className="w-full h-12 rounded-2xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold"
              onClick={() => setStep(2)}
            >
              퀘스트 빈도 정하기
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <StepHeader
              category={category}
              stepLabel={`행동목표 생성 · 3/${finalStep + 1}`}
              title="얼마나 자주 도전할까요?"
              desc="너무 무겁지 않게, 하지만 성장할 수 있게 정해보세요."
            />

            <div className="grid grid-cols-2 gap-2">
              {frequencyPresets.map((item) => (
                <FrequencyCard
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

            <Button
              className="w-full h-12 rounded-2xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold"
              onClick={() => {
                if (actionType === 'timer') {
                  setStep(3);
                } else {
                  handleSubmit();
                }
              }}
              disabled={createGoalMutation.isPending}
            >
              {actionType === 'timer' ? '시간 설정하기' : createGoalMutation.isPending ? '생성 중...' : '퀘스트 시작하기'}
            </Button>
          </div>
        )}

        {step === 3 && actionType === 'timer' && (
          <div className="space-y-5">
            <StepHeader
              category={category}
              stepLabel={`행동목표 생성 · 4/${finalStep + 1}`}
              title="한 번에 얼마 동안 할까요?"
              desc="시간기록형은 한 번 수행할 기준 시간을 정해두면 더 편해요."
            />

            <div className="grid grid-cols-3 gap-2">
              {[20, 30, 60].map((m) => (
                <button
                  key={m}
                  onClick={() => setMinutes(m)}
                  className="py-3 rounded-2xl text-sm font-semibold transition-all"
                  style={
                    minutes === m
                      ? { background: '#8b5a20', color: '#fff' }
                      : { background: '#f3ead7', color: '#7a5020' }
                  }
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
                className="flex-1 h-11 rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 text-sm text-amber-900 font-medium"
              />
              <span className="text-sm font-semibold" style={{ color: '#7a5020' }}>
                분
              </span>
            </div>

            <Button
              className="w-full h-12 rounded-2xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold"
              onClick={handleSubmit}
              disabled={!actionTitle.trim() || createGoalMutation.isPending}
            >
              {createGoalMutation.isPending ? '생성 중...' : '퀘스트 시작하기 🦊'}
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderStudyDDaySelect = () => (
    <div className="space-y-5">
      <StepHeader
        category={category}
        stepLabel="1/6"
        title="시험 D-day가 있나요?"
        desc="공부 목표는 D-day형과 일반 성장형으로 나눠서 만들 수 있어요."
      />

      <div className="space-y-3">
        <button
          onClick={() => {
            setHasDDay(true);
            setStep(1);
          }}
          className="w-full p-5 rounded-3xl text-left transition-all active:scale-[0.99]"
          style={{
            background: 'linear-gradient(135deg, #fff3d6 0%, #f5deb0 100%)',
            border: '2px solid #d6a64b',
          }}
        >
          <div className="text-lg mb-2">📅</div>
          <div className="text-base font-bold" style={{ color: '#3d2408' }}>
            D-day 있음
          </div>
          <div className="text-sm mt-1" style={{ color: '#8f6a33' }}>
            시험, 자격증, 마감일이 정해져 있어요.
          </div>
        </button>

        <button
          onClick={() => {
            setHasDDay(false);
            setStep(1);
          }}
          className="w-full p-5 rounded-3xl text-left transition-all active:scale-[0.99]"
          style={{
            background: '#fffaf0',
            border: '1.5px solid rgba(160,120,64,0.18)',
          }}
        >
          <div className="text-lg mb-2">📖</div>
          <div className="text-base font-bold" style={{ color: '#3d2408' }}>
            D-day 없음
          </div>
          <div className="text-sm mt-1" style={{ color: '#8f6a33' }}>
            꾸준히 실력을 쌓고 싶은 장기 성장 목표예요.
          </div>
        </button>
      </div>
    </div>
  );

  const renderStudyGoalStep = () => {
    if (hasDDay) {
      const daysLeft = dDay ? Math.ceil((new Date(dDay) - new Date()) / (1000 * 60 * 60 * 24)) : null;

      return (
        <div className="space-y-5">
          <StepHeader
            category={category}
            stepLabel="2/6"
            title="시험 정보를 정해볼까요?"
            desc="마감일과 시험 이름을 정하면 공부 루트가 더 선명해져요."
          />

          <div>
            <label className="text-sm font-semibold mb-2 block flex items-center gap-1" style={{ color: '#7a5020' }}>
              <CalendarDays className="w-4 h-4" />
              시험 날짜
            </label>
            <input
              type="date"
              value={dDay}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDDay(e.target.value)}
              className="w-full h-12 rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 text-sm text-amber-900 font-medium"
            />
            {daysLeft !== null && daysLeft > 0 && (
              <p className="text-xs font-semibold mt-2" style={{ color: '#8a5a17' }}>
                🎯 D-{daysLeft} · {daysLeft}일 남았어요
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block" style={{ color: '#7a5020' }}>
              시험 이름
            </label>
            <Input
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              placeholder="예: 토익 900점, 수능, 정보처리기사"
              className="h-12 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 placeholder:text-amber-400 font-medium"
            />
          </div>

          <Button
            className="w-full h-12 rounded-2xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold"
            disabled={!dDay || !examTitle.trim()}
            onClick={() => setStep(2)}
          >
            행동목표 이름 정하기
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <StepHeader
          category={category}
          stepLabel="2/5"
          title="먼저 결과목표를 정해요"
          desc="공부 루트의 도착점을 먼저 정하면 행동목표를 만들기 쉬워져요."
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
            {[4, 8, 12].map((weeks) => (
              <button
                key={weeks}
                onClick={() => {
                  setDuration(weeks * 7);
                  setIsCustomDuration(false);
                  setCustomWeeks('');
                }}
                className="py-3 rounded-2xl text-sm font-semibold transition-all"
                style={
                  !isCustomDuration && duration === weeks * 7
                    ? { background: '#8b5a20', color: '#fff' }
                    : { background: '#f3ead7', color: '#7a5020' }
                }
              >
                {weeks}주
              </button>
            ))}

            <button
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
                  setCustomWeeks(e.target.value);
                  setDuration(Number(e.target.value) * 7);
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
          disabled={!goalTitle.trim()}
          onClick={() => setStep(2)}
        >
          행동목표 이름 정하기
        </Button>
      </div>
    );
  };

  const renderGenericGoalStep = () => (
    <div className="space-y-5">
      <StepHeader
        category={category}
        stepLabel="1/5"
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
          {[4, 8, 12].map((weeks) => (
            <button
              key={weeks}
              onClick={() => {
                setDuration(weeks * 7);
                setIsCustomDuration(false);
                setCustomWeeks('');
              }}
              className="py-3 rounded-2xl text-sm font-semibold transition-all"
              style={
                !isCustomDuration && duration === weeks * 7
                  ? { background: '#8b5a20', color: '#fff' }
                  : { background: '#f3ead7', color: '#7a5020' }
              }
            >
              {weeks}주
            </button>
          ))}

          <button
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
                setCustomWeeks(e.target.value);
                setDuration(Number(e.target.value) * 7);
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
        disabled={!goalTitle.trim()}
        onClick={goNextFromGoal}
      >
        행동목표 이름 정하기
      </Button>
    </div>
  );

  const renderActionTitleStep = ({ totalSteps, nextStep }) => (
    <div className="space-y-5">
      <StepHeader
        category={category}
        stepLabel={`${step + 1}/${totalSteps}`}
        title="첫 퀘스트 이름을 정해요"
        desc="결과목표를 향해 실제로 움직이게 만드는 행동이에요."
      />

      <div className="grid grid-cols-1 gap-2">
        <SummaryChip icon={<Target className="w-4 h-4" />} label="결과목표" value={resultSummary} />
        <SummaryChip icon={<CalendarDays className="w-4 h-4" />} label="기간" value={`${resultDuration}일`} />
      </div>

      <div>
        <label className="text-sm font-semibold mb-2 block" style={{ color: '#7a5020' }}>
          행동목표 이름
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
        disabled={!actionTitle.trim()}
        onClick={() => setStep(nextStep)}
      >
        행동유형 정하기
      </Button>
    </div>
  );

  const renderActionTypeStep = ({ totalSteps, nextStep }) => (
    <div className="space-y-5">
      <StepHeader
        category={category}
        stepLabel={`${step + 1}/${totalSteps}`}
        title="이 퀘스트는 어떤 방식인가요?"
        desc="유형에 따라 홈 화면의 버튼과 기록 방식이 달라져요."
      />

      <div className="grid grid-cols-1 gap-2">
        <SummaryChip icon={<Target className="w-4 h-4" />} label="행동목표" value={actionSummary} />
        <SummaryChip icon={<Flag className="w-4 h-4" />} label="결과목표" value={resultSummary} />
      </div>

      <div className="space-y-3">
        {ACTION_TYPES.map((item) => (
          <ActionTypeCard
            key={item.value}
            item={item}
            selected={actionType === item.value}
            onClick={() => {
              setActionType(item.value);
              if (item.value === 'abstain') setFrequency(7);
            }}
          />
        ))}
      </div>

      <Button
        className="w-full h-12 rounded-2xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold"
        onClick={() => setStep(nextStep)}
      >
        퀘스트 빈도 정하기
      </Button>
    </div>
  );

  const renderFrequencyStep = ({ totalSteps, nextStep, isFinalWithoutTimer = false }) => (
    <div className="space-y-5">
      <StepHeader
        category={category}
        stepLabel={`${step + 1}/${totalSteps}`}
        title="얼마나 자주 도전할까요?"
        desc="지금의 나에게 무리가 없으면서도 성장할 수 있는 빈도로 정해보세요."
      />

      <div className="grid grid-cols-2 gap-2">
        {frequencyPresets.map((item) => (
          <FrequencyCard
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

      <Button
        className="w-full h-12 rounded-2xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold"
        onClick={() => {
          if (isFinalWithoutTimer && actionType !== 'timer') {
            handleSubmit();
            return;
          }
          setStep(nextStep);
        }}
        disabled={createGoalMutation.isPending}
      >
        {isFinalWithoutTimer && actionType !== 'timer'
          ? createGoalMutation.isPending
            ? '생성 중...'
            : '최종 확인하기'
          : '다음으로'}
      </Button>
    </div>
  );

  const renderTimerStep = ({ totalSteps, nextStep }) => (
    <div className="space-y-5">
      <StepHeader
        category={category}
        stepLabel={`${step + 1}/${totalSteps}`}
        title="한 번에 얼마 동안 할까요?"
        desc="시간기록형은 한 번 수행할 기준 시간을 정해두면 더 분명해져요."
      />

      <div className="grid grid-cols-3 gap-2">
        {[20, 30, 60].map((m) => (
          <button
            key={m}
            onClick={() => setMinutes(m)}
            className="py-3 rounded-2xl text-sm font-semibold transition-all"
            style={
              minutes === m
                ? { background: '#8b5a20', color: '#fff' }
                : { background: '#f3ead7', color: '#7a5020' }
            }
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
          className="flex-1 h-11 rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 text-sm text-amber-900 font-medium"
        />
        <span className="text-sm font-semibold" style={{ color: '#7a5020' }}>
          분
        </span>
      </div>

      <Button
        className="w-full h-12 rounded-2xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold"
        onClick={() => setStep(nextStep)}
      >
        최종 확인하기
      </Button>
    </div>
  );

  const renderFinalStep = ({ totalSteps }) => (
    <div className="space-y-5">
      <StepHeader
        category={category}
        stepLabel={`${step + 1}/${totalSteps}`}
        title="이제 루트를 시작할 준비가 됐어요"
        desc="마지막으로 이번 여정을 한 번 확인해볼까요?"
      />

      <div className="grid grid-cols-1 gap-2">
        <SummaryChip icon={<Flag className="w-4 h-4" />} label="카테고리" value={categoryNames[category]} />
        <SummaryChip icon={<Target className="w-4 h-4" />} label="결과목표" value={resultSummary} />
        <SummaryChip icon={<Sword className="w-4 h-4" />} label="행동목표" value={actionSummary} />
        <SummaryChip icon={<CalendarDays className="w-4 h-4" />} label="기간 / D-day" value={isStudy && hasDDay ? dDay : `${resultDuration}일`} />
        <SummaryChip icon={<currentActionTypeMeta.icon className="w-4 h-4" />} label="행동유형" value={typeSummary} />
        <SummaryChip icon={<Footprints className="w-4 h-4" />} label="퀘스트 빈도" value={frequencySummary} />
      </div>

      <div
        className="rounded-2xl px-4 py-3"
        style={{
          background: 'rgba(255,248,232,0.78)',
          border: '1px solid rgba(160,120,64,0.16)',
          color: '#7a5020',
        }}
      >
        <div className="text-sm font-bold mb-1">시작 후 변화</div>
        <div className="text-xs leading-relaxed" style={{ color: '#8f6a33' }}>
          행동을 완료할 때마다 경험치가 쌓이고, 캐릭터가 마왕성을 향해 전진하게 돼요.
        </div>
      </div>

      <Button
        className="w-full h-12 rounded-2xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold"
        disabled={
          !actionTitle.trim() ||
          !(isStudy && hasDDay ? examTitle.trim() : resultTitle.trim()) ||
          createGoalMutation.isPending
        }
        onClick={handleSubmit}
      >
        {createGoalMutation.isPending ? '루트 생성 중...' : '이 루트 시작하기 🦊'}
      </Button>
    </div>
  );

  const renderStep = () => {
    if (isAddingActionOnly) {
      return renderAddActionOnlyMode();
    }

    if (isStudy) {
      if (step === 0) return renderStudyDDaySelect();
      if (step === 1) return renderStudyGoalStep();
      if (step === 2) return renderActionTitleStep({ totalSteps: hasDDay ? 6 : 5, nextStep: 3 });
      if (step === 3) return renderActionTypeStep({ totalSteps: hasDDay ? 6 : 5, nextStep: 4 });
      if (step === 4) {
        if (actionType === 'timer') {
          return renderFrequencyStep({ totalSteps: hasDDay ? 6 : 5, nextStep: 5 });
        }
        return renderFinalStep({ totalSteps: hasDDay ? 6 : 5 });
      }
      if (step === 5) {
        if (actionType === 'timer') {
          return renderTimerStep({ totalSteps: hasDDay ? 6 : 5, nextStep: 6 });
        }
        return null;
      }
      if (step === 6 && actionType === 'timer') {
        return renderFinalStep({ totalSteps: 6 });
      }
    } else {
      if (step === 0) return renderGenericGoalStep();
      if (step === 1) return renderActionTitleStep({ totalSteps: 5, nextStep: 2 });
      if (step === 2) return renderActionTypeStep({ totalSteps: 5, nextStep: 3 });
      if (step === 3) {
        if (actionType === 'timer') {
          return renderFrequencyStep({ totalSteps: 5, nextStep: 4 });
        }
        return renderFinalStep({ totalSteps: 5 });
      }
      if (step === 4 && actionType === 'timer') {
        return renderFinalStep({ totalSteps: 5 });
      }
    }

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

      <div className="p-4 pb-8">
        {renderStep()}
      </div>
    </div>
  );
}
