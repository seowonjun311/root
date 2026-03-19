import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

const ACTION_TYPES = [
  { value: 'timer', label: '⏱️ 시간 기록형', desc: '시간을 기록하며 수행' },
  { value: 'confirm', label: '✅ 확인형', desc: '했으면 확인을 누르기' },
  { value: 'abstain', label: '🚫 안하기', desc: '나쁜 습관 참기' },
];

const categoryNames = { exercise: '운동', study: '공부', mental: '정신', daily: '일상' };

export default function CreateGoal() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { triggerHaptic } = useHapticFeedback();
  const formContainerRef = useScrollIntoViewOnFocus();
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category') || 'exercise';
  const existingGoalId = params.get('goalId'); // 기존 결과 목표에 행동 목표 추가
  const isStudy = category === 'study';
  const isAddingActionOnly = !!existingGoalId;

  // step 흐름:
  // 공부: 0(D-day 유무 선택) → 1a(D-day 날짜 입력) or 1b(일반 목표 입력) → 2(행동 목표)
  // 기타: 0(결과 목표 입력) → 1(행동 목표)
  // 행동 목표만 추가: 0(행동 목표 입력)
  const [step, setStep] = useState(0);
  const [hasDDay, setHasDDay] = useState(null); // true/false/null

  const [dDay, setDDay] = useState('');
  const [examTitle, setExamTitle] = useState('');

  const [goalTitle, setGoalTitle] = useState('');
  const [duration, setDuration] = useState(56); // 8주
  const [customWeeks, setCustomWeeks] = useState('');
  const [isCustomDuration, setIsCustomDuration] = useState(false);

  const [actionTitle, setActionTitle] = useState('');
  const [actionType, setActionType] = useState('confirm');
  const [frequency, setFrequency] = useState(7);
  const [minutes, setMinutes] = useState(60);
  const [formErrors, setFormErrors] = useState({});

  const createGoalMutation = useMutation({
    mutationFn: async (payload) => {
      // payload는 이미 생성됨 (handleSubmit에서 먼저 생성)
      return payload.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['actionGoals'] });
      toast.success(data.message);
      navigate('/Home');
    },
    onError: () => toast.error('목표 생성에 실패했습니다.'),
  });

  // D-day → duration 계산
  const calcDuration = () => {
    if (!dDay) return 90;
    const diff = Math.ceil((new Date(dDay) - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  };

  const handleBack = () => {
    triggerHaptic('impact', 'light');
    if (step === 0) { navigate(-1); return; }
    if (isStudy) {
      if (step === 2) { setStep(hasDDay ? 1 : 1); return; } // step 2 → 1
      if (step === 1) { setStep(0); return; }
    }
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    triggerHaptic('impact', 'heavy');
    if (isAddingActionOnly) {
      const actionGoal = await base44.entities.ActionGoal.create({
        goal_id: existingGoalId,
        category,
        title: actionTitle,
        action_type: actionType,
        weekly_frequency: frequency,
        duration_minutes: actionType === 'timer' ? minutes : 0,
        status: 'active',
      });
      createGoalMutation.mutate({
        addingActionOnly: true,
        data: { message: '행동 목표가 추가되었습니다! 🦊' },
      });
      return;
    }

    const finalDuration = isStudy && hasDDay ? calcDuration() : duration;
    const finalTitle = isStudy && hasDDay ? examTitle : goalTitle;
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
      title: actionTitle || finalTitle,
      action_type: actionType,
      weekly_frequency: frequency,
      duration_minutes: actionType === 'timer' ? minutes : 0,
      duration_days: finalDuration,
      status: 'active',
    });

    createGoalMutation.mutate({
      data: { message: '새로운 여정이 시작되었습니다! 🦊' },
    });
  };

  const renderStep = () => {
    // ── 행동 목표만 추가 ──
    if (isAddingActionOnly) {
      return (
        <div className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-amber-800 mb-2 block">행동 목표 이름</label>
            <Input
              id="action-title-input"
              value={actionTitle}
              onChange={e => setActionTitle(e.target.value)}
              placeholder={category === 'daily' ? "예: 팩하기, 집청소, 설거지, 부모님 연락" : category === 'mental' ? "예: 7시기상, 일기쓰기, 부모님연락하기, 금연, ..." : category === 'study' ? "예: 독해, 듣기, 회화, 전공서, 수학, ..." : category === 'exercise' ? "예: 러닝, 등산, 헬스, 야식참기, ..." : "예: 러닝, LC 공부, 명상..."}
              className="h-12 rounded-xl bg-white/80"
              aria-describedby={formErrors.actionTitle ? 'error-actionTitle' : undefined}
            />
            {formErrors.actionTitle && (
              <p id="error-actionTitle" className="text-xs text-red-600 mt-1.5">
                {formErrors.actionTitle}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-amber-800 mb-2 block">행동 유형</label>
            <div className="space-y-2">
              {ACTION_TYPES.map(t => (
                <button key={t.value} onClick={() => { setActionType(t.value); if (t.value === 'abstain') setFrequency(7); }}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    actionType === t.value ? 'border-amber-600 bg-amber-50/80' : 'border-border bg-card'}`}
                  aria-label={`${t.label} 선택: ${t.desc}`}
                  aria-pressed={actionType === t.value}
                >
                  <p className="text-sm font-semibold">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
              <label className="text-sm font-semibold text-amber-800 mb-2 block">주 횟수</label>
              <div className="grid grid-cols-7 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map(f => (
                 <button key={f} onClick={() => setFrequency(f)}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      frequency === f ? 'bg-amber-700 text-amber-50' : 'bg-secondary text-secondary-foreground'}`}
                    aria-label={`주 ${f}회 선택`}
                    aria-pressed={frequency === f}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">주 {frequency}회</p>
            </div>
          {actionType === 'timer' && (
            <div>
              <label className="text-sm font-semibold text-amber-800 mb-2 block">1회 시간</label>
              <div className="flex gap-2 mb-2">
                {[20, 30, 60].map(m => (
                 <button key={m} onClick={() => setMinutes(m)}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                      minutes === m ? 'bg-amber-700 text-amber-50' : 'bg-secondary text-secondary-foreground'}`}
                    aria-label={`${m}분 선택`}
                    aria-pressed={minutes === m}
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
                  onChange={e => setMinutes(Number(e.target.value))}
                  className="flex-1 h-11 rounded-xl border border-input bg-white/80 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  aria-label="1회 시간 분단위 입력"
                />
                <span className="text-sm font-semibold text-muted-foreground">분</span>
              </div>
            </div>
          )}
          <Button
            className="w-full h-12 rounded-xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold"
            disabled={!actionTitle.trim() || createGoalMutation.isPending}
            onClick={handleSubmit}
            aria-label="행동 목표 추가"
          >
            {createGoalMutation.isPending ? '추가 중...' : '행동 목표 추가하기 🦊'}
          </Button>
        </div>
      );
    }

    // ── 공부: D-day 유무 선택 ──
    if (isStudy && step === 0) {
      return (
        <div className="space-y-6">
          <div className="text-center pt-4 pb-2">
            <p className="text-4xl mb-3">📚</p>
            <h2 className="text-lg font-bold text-amber-900">시험 D-day가 있나요?</h2>
            <p className="text-sm text-muted-foreground mt-1">목표 유형에 따라 다르게 설정돼요</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => { setHasDDay(true); setStep(1); }}
              className="w-full p-5 rounded-2xl border-2 border-amber-300 bg-amber-50/80 text-left hover:bg-amber-100/80 transition-all"
              aria-label="D-day 있음 선택"
              aria-pressed={hasDDay === true}
            >
              <p className="font-bold text-amber-900 text-base">📅 D-day 있음</p>
              <p className="text-sm text-amber-700/70 mt-1">시험이나 마감일이 정해져 있어요</p>
            </button>
            <button
              onClick={() => { setHasDDay(false); setStep(1); }}
              className="w-full p-5 rounded-2xl border-2 border-border bg-card text-left hover:bg-secondary/50 transition-all"
              aria-label="D-day 없음 선택"
              aria-pressed={hasDDay === false}
            >
              <p className="font-bold text-foreground text-base">📖 D-day 없음</p>
              <p className="text-sm text-muted-foreground mt-1">꾸준히 공부 습관을 만들고 싶어요</p>
            </button>
          </div>
        </div>
      );
    }

    // ── 공부 + D-day 있음: 날짜 & 시험명 입력 ──
    if (isStudy && step === 1 && hasDDay) {
      const daysLeft = dDay ? Math.ceil((new Date(dDay) - new Date()) / (1000 * 60 * 60 * 24)) : null;
      return (
        <div className="space-y-6">
          <div>
            <label className="text-sm font-semibold text-amber-800 mb-2 block flex items-center gap-1">
              <CalendarDays className="w-4 h-4" /> 시험 날짜 (D-day)
            </label>
            <input
                id="dday-input"
                type="date"
                value={dDay}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setDDay(e.target.value)}
                className="w-full h-12 rounded-xl border border-input bg-white/80 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                aria-label="시험 D-day 날짜 선택"
                aria-describedby={formErrors.dDay ? 'error-dDay' : undefined}
              />
              {formErrors.dDay && (
                <p id="error-dDay" className="text-xs text-red-600 mt-1.5">
                  {formErrors.dDay}
                </p>
              )}
            {daysLeft !== null && daysLeft > 0 && (
              <p className="text-xs text-amber-700 font-semibold mt-2">
                🎯 D-{daysLeft} · {daysLeft}일 남았습니다
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-amber-800 mb-2 block">어떤 시험인가요?</label>
            <Input
              id="exam-title-input"
              value={examTitle}
              onChange={e => setExamTitle(e.target.value)}
              placeholder="예: 토익 900점, 수능, 정보처리기사..."
              className="h-12 rounded-xl bg-white/80"
              aria-describedby={formErrors.examTitle ? 'error-examTitle' : undefined}
            />
            {formErrors.examTitle && (
              <p id="error-examTitle" className="text-xs text-red-600 mt-1.5">
                {formErrors.examTitle}
              </p>
            )}
          </div>
          <Button
            className="w-full h-12 rounded-xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold"
            disabled={!dDay || !examTitle.trim()}
            onClick={() => setStep(2)}
          >
            다음
          </Button>
        </div>
      );
    }

    // ── 공부 + D-day 없음 OR 기타 카테고리: 결과 목표 입력 ──
    if ((isStudy && step === 1 && !hasDDay) || (!isStudy && step === 0)) {
      return (
        <div className="space-y-6">
          <div>
            <label className="text-sm font-semibold text-amber-800 mb-2 block">결과 목표</label>
            <Input
              id="goal-title-input"
              value={goalTitle}
              onChange={e => setGoalTitle(e.target.value)}
              placeholder={category === 'daily' ? "예) 갓생살기, 일찍일어나기, 루틴찾기" : category === 'mental' ? "예) 자기관리, 생활규칙만들기, 절제, 나 챙기기" : category === 'exercise' ? "예: 살빼기, 턱걸이 30개, 등산 100회..." : "어떤 결과를 이루고 싶으신가요?"}
              className="h-12 rounded-xl bg-white/80"
              aria-describedby={formErrors.goalTitle ? 'error-goalTitle' : undefined}
            />
            {formErrors.goalTitle && (
              <p id="error-goalTitle" className="text-xs text-red-600 mt-1.5">
                {formErrors.goalTitle}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-amber-800 mb-2 block">기간</label>
            <div className="flex gap-2 mb-2">
              {[{ label: '4주', weeks: 4 }, { label: '8주', weeks: 8 }, { label: '12주', weeks: 12 }].map(({ label, weeks }) => (
                  <button 
                    key={weeks} 
                    onClick={() => { setDuration(weeks * 7); setIsCustomDuration(false); setCustomWeeks(''); }}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                      !isCustomDuration && duration === weeks * 7 ? 'bg-amber-700 text-amber-50' : 'bg-secondary text-secondary-foreground'}`}
                    aria-label={`${label} 선택`}
                    aria-pressed={!isCustomDuration && duration === weeks * 7}
                  >
                    {label}
                  </button>
                ))}
              <button 
                onClick={() => setIsCustomDuration(true)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isCustomDuration ? 'bg-amber-700 text-amber-50' : 'bg-secondary text-secondary-foreground'}`}
                aria-label="기간 직접 입력"
                aria-pressed={isCustomDuration}
              >
                직접입력
              </button>
            </div>
            {isCustomDuration && (
              <div className="flex items-center gap-2 mt-2">
                <input
                    id="custom-weeks-input"
                    type="number"
                    min="1"
                    max="52"
                    value={customWeeks}
                    onChange={e => { setCustomWeeks(e.target.value); setDuration(Number(e.target.value) * 7); }}
                    placeholder="주 수 입력"
                    className="flex-1 h-11 rounded-xl border border-input bg-white/80 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                    aria-label="기간 주 수 직접 입력"
                    aria-describedby={formErrors.customWeeks ? 'error-customWeeks' : undefined}
                  />
                  {formErrors.customWeeks && (
                    <p id="error-customWeeks" className="text-xs text-red-600 mt-1.5">
                      {formErrors.customWeeks}
                    </p>
                  )}
                <span className="text-sm font-semibold text-muted-foreground">주</span>
              </div>
            )}
          </div>
          <Button
            className="w-full h-12 rounded-xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold"
            disabled={!goalTitle.trim()}
            onClick={() => isStudy ? setStep(2) : setStep(1)}
          >
            다음
          </Button>
        </div>
      );
    }

    // ── 행동 목표 입력 (마지막 스텝) ──
    const isLastStep = (isStudy && step === 2) || (!isStudy && step === 1);
    if (isLastStep) {
      return (
        <div className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-amber-800 mb-2 block">행동 목표 이름</label>
            <Input
              value={actionTitle}
              onChange={e => setActionTitle(e.target.value)}
              placeholder={category === 'daily' ? "예: 팩하기, 집청소, 빨래, 부모님연락" : category === 'mental' ? "예: 7시기상, 일기쓰기, 부모님연락하기, 금연, ..." : category === 'study' ? "예: 독해, 듣기, 회화, 전공서, 수학, ..." : category === 'exercise' ? "예: 러닝, 등산, 헬스, 야식참기, ..." : "예: 러닝, LC 공부, 명상..."}
              className="h-12 rounded-xl bg-white/80"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-amber-800 mb-2 block">행동 유형</label>
            <div className="space-y-2">
              {ACTION_TYPES.map(t => (
                <button key={t.value} onClick={() => { setActionType(t.value); if (t.value === 'abstain') setFrequency(7); }}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    actionType === t.value ? 'border-amber-600 bg-amber-50/80' : 'border-border bg-card'}`}
                  aria-label={`${t.label} 선택: ${t.desc}`}
                  aria-pressed={actionType === t.value}
                >
                  <p className="text-sm font-semibold">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
              <label className="text-sm font-semibold text-amber-800 mb-2 block">주 횟수</label>
              <div className="grid grid-cols-7 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map(f => (
                 <button key={f} onClick={() => setFrequency(f)}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      frequency === f ? 'bg-amber-700 text-amber-50' : 'bg-secondary text-secondary-foreground'}`}
                    aria-label={`주 ${f}회 선택`}
                    aria-pressed={frequency === f}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">주 {frequency}회</p>
            </div>
          {actionType === 'timer' && (
            <div>
              <label className="text-sm font-semibold text-amber-800 mb-2 block">1회 시간</label>
              <div className="flex gap-2 mb-2">
                {[20, 30, 60].map(m => (
                 <button key={m} onClick={() => setMinutes(m)}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                      minutes === m ? 'bg-amber-700 text-amber-50' : 'bg-secondary text-secondary-foreground'}`}
                    aria-label={`${m}분 선택`}
                    aria-pressed={minutes === m}
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
                  onChange={e => setMinutes(Number(e.target.value))}
                  className="flex-1 h-11 rounded-xl border border-input bg-white/80 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  aria-label="1회 시간 분단위 입력"
                />
                <span className="text-sm font-semibold text-muted-foreground">분</span>
              </div>
            </div>
          )}
          <Button
            className="w-full h-12 rounded-xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold"
            disabled={!actionTitle.trim() || createGoalMutation.isPending}
            onClick={handleSubmit}
            aria-label="목표 생성"
          >
            {createGoalMutation.isPending ? '생성 중...' : '목표 시작하기 🦊'}
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div ref={formContainerRef} className="min-h-screen bg-background max-w-lg mx-auto" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="p-6">
        {renderStep()}
      </div>
    </div>
  );
}