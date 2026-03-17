import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, CalendarDays } from 'lucide-react';

const CATEGORY_OPTIONS = [
  { id: 'exercise', label: '운동', emoji: '🏃' },
  { id: 'study', label: '공부', emoji: '📚' },
  { id: 'mental', label: '정신', emoji: '🧘' },
  { id: 'daily', label: '일상', emoji: '🏠' },
];

const ACTION_TYPE_OPTIONS = [
  { value: 'timer', label: '시간 기록형', desc: '시간을 기록하며 수행합니다', emoji: '⏱️' },
  { value: 'confirm', label: '확인형', desc: '했으면 확인을 누릅니다', emoji: '✅' },
  { value: 'abstain', label: '안하기', desc: '나쁜 습관을 참으며 기록합니다', emoji: '🚫' },
];

// 스텝 ID 목록 (동적으로 구성)
// welcome → goal → category → [study_dday? → study_dday_date?] → duration → action → nickname
// 공부+D-day: welcome → goal → category → study_dday → study_dday_date → action → nickname
// 공부+no D-day: welcome → goal → category → study_dday → duration → action → nickname
// 기타: welcome → goal → category → duration → action → nickname

export default function Onboarding() {
  const navigate = useNavigate();

  // step IDs
  const [stepHistory, setStepHistory] = useState(['welcome']);
  const currentStep = stepHistory[stepHistory.length - 1];

  const [goalInput, setGoalInput] = useState('');
  const [category, setCategory] = useState('');
  const [hasDDay, setHasDDay] = useState(null); // null | true | false
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

  // 총 스텝 수 (진행 바 표시용)
  const totalSteps = category === 'study' && hasDDay === true ? 7
    : category === 'study' ? 7
    : 6;
  const stepIndex = stepHistory.length - 1;

  const goNext = (nextStep) => setStepHistory(prev => [...prev, nextStep]);
  const goBack = () => setStepHistory(prev => prev.slice(0, -1));

  const calcDDayDuration = () => {
    if (!dDay) return 90;
    const diff = Math.ceil((new Date(dDay) - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const isStudyDDay = category === 'study' && hasDDay === true;
      const finalTitle = isStudyDDay ? examTitle : goalInput;
      const finalDuration = isStudyDDay ? calcDDayDuration() : (customDuration ? (parseInt(customDuration) || 4) * 7 : duration);

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

      // 로그인 상태면 유저 정보 업데이트, 아니면 localStorage에 저장
      try {
        await base44.auth.updateMe({
          nickname: nickname || '용사',
          onboarding_complete: true,
          active_category: category,
        });
      } catch {
        localStorage.setItem('guest_nickname', nickname || '용사');
        localStorage.setItem('guest_active_category', category);
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
    if (currentStep === 'duration') return duration > 0 || (customDuration && parseInt(customDuration) > 0);
    if (currentStep === 'action') return actionTitle.trim().length > 0;
    if (currentStep === 'nickname') return true;
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

  const daysLeft = dDay ? Math.ceil((new Date(dDay) - new Date()) / (1000 * 60 * 60 * 24)) : null;

  const renderContent = () => {
    if (currentStep === 'welcome') return (
      <div className="flex flex-col items-center text-center px-6">
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
        <div className="space-y-3 mt-8 w-full">
          <button
            onClick={() => base44.auth.redirectToLogin('/Onboarding')}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="mr-2">🔍</span>Google로 시작
          </button>
          <button
            onClick={() => base44.auth.redirectToLogin('/Onboarding')}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-green-500 text-white hover:bg-green-600 transition-colors"
          >
            <span className="mr-2">✓</span>Naver로 시작
          </button>
          <button
            onClick={() => base44.auth.redirectToLogin('/Onboarding')}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-yellow-400 text-gray-800 hover:bg-yellow-500 transition-colors"
          >
            <span className="mr-2">⭐</span>Kakao로 시작
          </button>
          <button
            onClick={() => goNext('goal')}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors border-2 border-dashed border-amber-300"
          >
            <span className="mr-2">🦊</span>가입없이 시작
          </button>
        </div>
      </div>
    );

    if (currentStep === 'goal') return (
      <div className="px-6">
        <h2 className="text-xl font-bold text-center text-amber-900 mb-2">어떤 여정을 시작하시겠습니까?</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">자유롭게 입력해 주세요</p>
        <Input
          value={goalInput}
          onChange={e => setGoalInput(e.target.value)}
          placeholder="예: 살 빼고 싶어요, 토익 공부..."
          className="h-12 rounded-xl text-center text-base border-amber-300 focus:border-amber-500 bg-white/80"
        />
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {['살 빼고 싶어요', '영어 공부를 시작하고 싶어요', '금연하고 싶어요', '생활을 정리하고 싶어요'].map(ex => (
            <button key={ex} onClick={() => setGoalInput(ex)}
              className="text-xs px-3 py-1.5 rounded-full bg-amber-100/80 text-amber-700 hover:bg-amber-200/80 transition-colors">
              {ex}
            </button>
          ))}
        </div>
      </div>
    );

    if (currentStep === 'category') return (
      <div className="px-6">
        <h2 className="text-xl font-bold text-center text-amber-900 mb-6">이 목표는 어떤 영역인가요?</h2>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORY_OPTIONS.map(opt => (
            <button key={opt.id} onClick={() => setCategory(opt.id)}
              className={`p-4 rounded-2xl border-2 transition-all duration-200 text-center
                ${category === opt.id ? 'border-amber-600 bg-amber-100/80 shadow-md scale-[1.02]' : 'border-border bg-card hover:border-amber-400/50'}`}>
              <span className="text-3xl block mb-2">{opt.emoji}</span>
              <span className="font-semibold text-sm">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    );

    if (currentStep === 'study_dday') return (
      <div className="px-6 space-y-4">
        <div className="text-center pt-4 pb-2">
          <p className="text-4xl mb-3">📚</p>
          <h2 className="text-xl font-bold text-amber-900">시험 D-day가 있나요?</h2>
          <p className="text-sm text-muted-foreground mt-1">목표 유형에 따라 다르게 설정돼요</p>
        </div>
        <button
          onClick={() => { setHasDDay(true); }}
          className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
            hasDDay === true ? 'border-amber-600 bg-amber-100/80' : 'border-border bg-card hover:border-amber-400/50'}`}>
          <p className="font-bold text-amber-900 text-base">📅 D-day 있음</p>
          <p className="text-sm text-amber-700/70 mt-1">시험이나 마감일이 정해져 있어요</p>
        </button>
        <button
          onClick={() => { setHasDDay(false); }}
          className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
            hasDDay === false ? 'border-amber-600 bg-amber-100/80' : 'border-border bg-card hover:border-amber-400/50'}`}>
          <p className="font-bold text-foreground text-base">📖 D-day 없음</p>
          <p className="text-sm text-muted-foreground mt-1">꾸준히 공부 습관을 만들고 싶어요</p>
        </button>
      </div>
    );

    if (currentStep === 'study_dday_date') return (
      <div className="px-6 space-y-5">
        <div className="text-center">
          <h2 className="text-xl font-bold text-amber-900 mb-1">시험 정보를 입력해 주세요</h2>
        </div>
        <div>
          <label className="text-sm font-semibold text-amber-800 mb-2 block flex items-center gap-1">
            <CalendarDays className="w-4 h-4" /> 시험 날짜 (D-day)
          </label>
          <input
            type="date"
            value={dDay}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setDDay(e.target.value)}
            className="w-full h-12 rounded-xl border border-input bg-white/80 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          />
          {daysLeft !== null && daysLeft > 0 && (
            <p className="text-xs text-amber-700 font-semibold mt-2">🎯 D-{daysLeft} · {daysLeft}일 남았습니다</p>
          )}
        </div>
        <div>
          <label className="text-sm font-semibold text-amber-800 mb-2 block">어떤 시험인가요?</label>
          <Input
            value={examTitle}
            onChange={e => setExamTitle(e.target.value)}
            placeholder="예: 토익 900점, 수능, 정보처리기사..."
            className="h-12 rounded-xl bg-white/80"
          />
        </div>
      </div>
    );

    if (currentStep === 'duration') return (
      <div className="px-6">
        <h2 className="text-xl font-bold text-center text-amber-900 mb-2">얼마 동안 도전하시겠습니까?</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">기간을 선택해 주세요</p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[4, 8, 12, 16, 20, 24].map(weeks => (
            <button key={weeks} onClick={() => { setDuration(weeks * 7); setCustomDuration(''); }}
              className={`py-3 rounded-xl font-semibold text-sm transition-all ${
                duration === weeks * 7 && !customDuration ? 'bg-amber-700 text-amber-50 shadow-md' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
              {weeks}주
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-2">
          <input type="number" min="1" max="52" value={customDuration}
            onChange={e => { setCustomDuration(e.target.value); setDuration(0); }}
            placeholder="직접 입력"
            className="flex-1 h-11 rounded-xl border border-input bg-white/80 px-4 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-400/50" />
          <span className="text-sm font-semibold text-muted-foreground">주</span>
        </div>
        {(customDuration || duration > 0) && (
          <p className="text-xs text-amber-700 font-semibold mt-2 text-center">
            총 {customDuration ? Number(customDuration) * 7 : duration}일 ({customDuration || Math.round(duration / 7)}주)
          </p>
        )}
      </div>
    );

    if (currentStep === 'action') return (
      <div className="px-6">
        <h2 className="text-lg font-bold text-center text-amber-900 mb-1">이 목표를 위해 어떤 행동을 하시겠습니까?</h2>
        <p className="text-xs text-muted-foreground text-center mb-5">행동 목표를 설정해 주세요</p>
        <Input value={actionTitle} onChange={e => setActionTitle(e.target.value)}
          placeholder="예: 러닝, LC 공부, 명상..." className="h-11 rounded-xl text-center text-sm border-amber-300 bg-white/80 mb-4" />
        <p className="text-xs font-semibold text-amber-800 mb-2">행동 유형</p>
        <div className="space-y-2 mb-4">
          {ACTION_TYPE_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setActionType(opt.value)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                actionType === opt.value ? 'border-amber-600 bg-amber-50/80' : 'border-border bg-card hover:border-amber-300'}`}>
              <span className="text-xl">{opt.emoji}</span>
              <div>
                <p className="text-sm font-semibold">
                  {opt.label}
                  {category === 'exercise' && opt.value === 'timer' && ' (GPS 측정 가능)'}
                </p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs font-semibold text-amber-800 mb-2">주 횟수</p>
        <div className="grid grid-cols-7 gap-1.5 mb-4">
          {[1, 2, 3, 4, 5, 6, 7].map(f => (
            <button key={f} onClick={() => setFrequency(f)}
              className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                frequency === f ? 'bg-amber-700 text-amber-50' : 'bg-secondary text-secondary-foreground'}`}>
              {f}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mb-4">주 {frequency}회</p>
        {actionType === 'timer' && (
          <>
            <p className="text-xs font-semibold text-amber-800 mb-2">1회 시간</p>
            <div className="flex gap-2 mb-2">
              {[20, 30, 60].map(m => (
                <button key={m} onClick={() => setActionMinutes(m)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    actionMinutes === m ? 'bg-amber-700 text-amber-50' : 'bg-secondary text-secondary-foreground'}`}>
                  {m}분
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input type="number" min="1" max="300"
                placeholder="직접 입력"
                onChange={e => setActionMinutes(Number(e.target.value))}
                className="flex-1 h-10 rounded-xl border border-input bg-white/80 px-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-400/50" />
              <span className="text-sm font-semibold text-muted-foreground">분</span>
            </div>
          </>
        )}
      </div>
    );

    if (currentStep === 'nickname') return (
      <div className="flex flex-col items-center px-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-200/80 border-2 border-amber-400/50 flex items-center justify-center text-4xl mb-6 shadow-lg">🦊</div>
        <h2 className="text-xl font-bold text-amber-900 mb-2">이 여정을 함께 걸을 이름을 정해주세요</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">루트에서 당신을 어떻게 부르면 될까요?</p>
        <Input value={nickname} onChange={e => setNickname(e.target.value)}
          placeholder="닉네임 입력" maxLength={12}
          className="h-12 rounded-xl text-center text-lg border-amber-300 bg-white/80 max-w-xs" />
        <p className="text-xs text-muted-foreground mt-3">예시: 성장의길 / 턱걸이10 / 루트워커</p>
        <p className="text-xs text-muted-foreground/60 mt-1">나중에 변경할 수 있어요</p>
      </div>
    );

    return null;
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Progress */}
      <div className="flex gap-1 px-6 pt-6 pb-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < stepIndex ? 'bg-amber-600' : i === stepIndex ? 'bg-amber-400' : 'bg-secondary'}`} />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center py-6">
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


    </div>
  );
}