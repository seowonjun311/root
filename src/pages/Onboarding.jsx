import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const CATEGORY_OPTIONS = [
  { id: 'exercise', label: '운동', emoji: '🏃', examples: ['살 빼고 싶어요', '러닝을 시작하고 싶어요', '근력을 키우고 싶어요'] },
  { id: 'study', label: '공부', emoji: '📚', examples: ['영어 공부를 시작하고 싶어요', '자격증을 따고 싶어요', '책을 더 읽고 싶어요'] },
  { id: 'mental', label: '정신', emoji: '🧘', examples: ['금연하고 싶어요', '명상을 시작하고 싶어요', 'SNS를 줄이고 싶어요'] },
  { id: 'daily', label: '일상', emoji: '🏠', examples: ['생활을 정리하고 싶어요', '일찍 일어나고 싶어요', '규칙적으로 살고 싶어요'] },
];

const DURATION_OPTIONS = [
  { value: 30, label: '30일' },
  { value: 60, label: '60일' },
  { value: 90, label: '90일' },
  { value: 0, label: '직접 입력' },
];

const FREQ_OPTIONS = [
  { value: 3, label: '주 3회' },
  { value: 5, label: '주 5회' },
  { value: 7, label: '매일' },
];

const ACTION_TYPE_OPTIONS = [
  { value: 'timer', label: '시간 기록형', desc: '시간을 기록하며 수행합니다', emoji: '⏱️' },
  { value: 'confirm', label: '확인형', desc: '했으면 확인을 누릅니다', emoji: '✅' },
  { value: 'abstain', label: '안하기', desc: '나쁜 습관을 참으며 기록합니다', emoji: '🚫' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [goalInput, setGoalInput] = useState('');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState(90);
  const [customDuration, setCustomDuration] = useState('');
  const [actionTitle, setActionTitle] = useState('');
  const [actionType, setActionType] = useState('confirm');
  const [frequency, setFrequency] = useState(5);
  const [actionMinutes, setActionMinutes] = useState(60);
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const finalDuration = duration === 0 ? (parseInt(customDuration) || 30) : duration;

  const handleComplete = async () => {
    setIsSubmitting(true);
    const goal = await base44.entities.Goal.create({
      category,
      goal_type: 'result',
      title: goalInput,
      duration_days: finalDuration,
      start_date: new Date().toISOString().split('T')[0],
      status: 'active',
    });

    await base44.entities.ActionGoal.create({
      goal_id: goal.id,
      category,
      title: actionTitle || goalInput,
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

    navigate('/Home');
  };

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="flex flex-col items-center text-center px-6">
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
    </div>,

    // Step 1: Goal input
    <div key="goal" className="px-6">
      <h2 className="text-xl font-bold text-center text-amber-900 mb-2">
        어떤 여정을 시작하시겠습니까?
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-6">자유롭게 입력해 주세요</p>
      
      <Input
        value={goalInput}
        onChange={e => setGoalInput(e.target.value)}
        placeholder="예: 살 빼고 싶어요, 토익 공부..."
        className="h-12 rounded-xl text-center text-base border-amber-300 focus:border-amber-500 focus:ring-amber-400/30 bg-white/80"
      />
      
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {['살 빼고 싶어요', '영어 공부를 시작하고 싶어요', '금연하고 싶어요', '생활을 정리하고 싶어요'].map(ex => (
          <button
            key={ex}
            onClick={() => setGoalInput(ex)}
            className="text-xs px-3 py-1.5 rounded-full bg-amber-100/80 text-amber-700 hover:bg-amber-200/80 transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>,

    // Step 2: Category
    <div key="category" className="px-6">
      <h2 className="text-xl font-bold text-center text-amber-900 mb-6">
        이 목표는 어떤 영역인가요?
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {CATEGORY_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => setCategory(opt.id)}
            className={`p-4 rounded-2xl border-2 transition-all duration-200 text-center
              ${category === opt.id
                ? 'border-amber-600 bg-amber-100/80 shadow-md scale-[1.02]'
                : 'border-border bg-card hover:border-amber-400/50'}`}
          >
            <span className="text-3xl block mb-2">{opt.emoji}</span>
            <span className="font-semibold text-sm">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>,

    // Step 3: Duration
    <div key="duration" className="px-6">
      <h2 className="text-xl font-bold text-center text-amber-900 mb-2">
        얼마 동안 도전하시겠습니까?
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-6">기간을 선택해 주세요</p>
      
      <div className="flex flex-wrap gap-3 justify-center">
        {DURATION_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setDuration(opt.value)}
            className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all
              ${duration === opt.value
                ? 'bg-amber-700 text-amber-50 shadow-md'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      
      {duration === 0 && (
        <Input
          type="number"
          value={customDuration}
          onChange={e => setCustomDuration(e.target.value)}
          placeholder="일수를 입력하세요"
          className="mt-4 h-12 rounded-xl text-center bg-white/80"
        />
      )}
    </div>,

    // Step 4: Action goal setup
    <div key="action" className="px-6">
      <h2 className="text-lg font-bold text-center text-amber-900 mb-1">
        이 목표를 위해 어떤 행동을 하시겠습니까?
      </h2>
      <p className="text-xs text-muted-foreground text-center mb-5">행동 목표를 설정해 주세요</p>

      <Input
        value={actionTitle}
        onChange={e => setActionTitle(e.target.value)}
        placeholder="예: 러닝, LC 공부, 명상..."
        className="h-11 rounded-xl text-center text-sm border-amber-300 bg-white/80 mb-4"
      />

      <p className="text-xs font-semibold text-amber-800 mb-2">행동 유형</p>
      <div className="space-y-2 mb-4">
        {ACTION_TYPE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setActionType(opt.value)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left
              ${actionType === opt.value
                ? 'border-amber-600 bg-amber-50/80'
                : 'border-border bg-card hover:border-amber-300'}`}
          >
            <span className="text-xl">{opt.emoji}</span>
            <div>
              <p className="text-sm font-semibold">{opt.label}</p>
              <p className="text-xs text-muted-foreground">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs font-semibold text-amber-800 mb-2">주 횟수</p>
      <div className="flex gap-2 mb-4">
        {FREQ_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFrequency(opt.value)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${frequency === opt.value
                ? 'bg-amber-700 text-amber-50'
                : 'bg-secondary text-secondary-foreground'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {actionType === 'timer' && (
        <>
          <p className="text-xs font-semibold text-amber-800 mb-2">1회 시간</p>
          <div className="flex gap-2">
            {[20, 30, 60].map(m => (
              <button
                key={m}
                onClick={() => setActionMinutes(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all
                  ${actionMinutes === m
                    ? 'bg-amber-700 text-amber-50'
                    : 'bg-secondary text-secondary-foreground'}`}
              >
                {m}분
              </button>
            ))}
          </div>
        </>
      )}
    </div>,

    // Step 5: Nickname
    <div key="nickname" className="flex flex-col items-center px-6">
      <div className="w-20 h-20 rounded-3xl bg-amber-200/80 border-2 border-amber-400/50 flex items-center justify-center text-4xl mb-6 shadow-lg">
        🦊
      </div>
      <h2 className="text-xl font-bold text-amber-900 mb-2">
        이 여정을 함께 걸을 이름을 정해주세요
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-6">
        루트에서 당신을 어떻게 부르면 될까요?
      </p>
      <Input
        value={nickname}
        onChange={e => setNickname(e.target.value)}
        placeholder="닉네임 입력"
        maxLength={12}
        className="h-12 rounded-xl text-center text-lg border-amber-300 bg-white/80 max-w-xs"
      />
      <p className="text-xs text-muted-foreground mt-3">
        예시: 성장의길 / 턱걸이10 / 루트워커
      </p>
      <p className="text-xs text-muted-foreground/60 mt-1">나중에 변경할 수 있어요</p>
    </div>,
  ];

  const canNext = () => {
    if (step === 0) return true;
    if (step === 1) return goalInput.trim().length > 0;
    if (step === 2) return category !== '';
    if (step === 3) return duration > 0 || customDuration;
    if (step === 4) return actionTitle.trim().length > 0;
    if (step === 5) return true;
    return true;
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto flex flex-col">
      {/* Progress */}
      <div className="flex gap-1 px-6 pt-6 pb-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300
              ${i <= step ? 'bg-amber-600' : 'bg-secondary'}`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8 flex gap-3">
        {step > 0 && (
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            className="rounded-xl h-12 px-4"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
        
        {step < steps.length - 1 ? (
          <Button
            className="flex-1 h-12 rounded-xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold text-base"
            disabled={!canNext()}
            onClick={() => setStep(step + 1)}
          >
            다음
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            className="flex-1 h-12 rounded-xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold text-base"
            disabled={isSubmitting}
            onClick={handleComplete}
          >
            {isSubmitting ? '여정을 시작하는 중...' : '여정 시작하기 🦊'}
          </Button>
        )}
      </div>
    </div>
  );
}