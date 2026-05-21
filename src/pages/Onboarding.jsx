import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { motion, AnimatePresence } from 'framer-motion';
import guestDataPersistence from '@/lib/GuestDataPersistence';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { CalendarDays } from 'lucide-react';

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

// 각 섹션을 감싸는 카드
function Section({ title, subtitle, children, visible, sectionId, highlight }) {
  const ref = useRef(null);

  useEffect(() => {
    if (visible && ref.current) {
      setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [visible]);

  // 외부에서 스크롤 요청 시
  useEffect(() => {
    if (highlight && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlight]);

  if (!visible) return null;

  return (
    <motion.div
      ref={ref}
      id={sectionId}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`rounded-2xl border backdrop-blur-sm px-5 py-5 space-y-4 shadow-sm transition-all duration-300 ${
        highlight ? 'border-red-400 bg-red-50/60 ring-2 ring-red-300' : 'border-amber-200/60 bg-white/70'
      }`}
    >
      {title && (
        <h2 className={`text-base font-bold ${highlight ? 'text-red-700' : 'text-amber-900'}`}>
          {highlight && <span className="mr-1">⚠️</span>}{title}
        </h2>
      )}
      {subtitle && <p className="text-xs text-muted-foreground -mt-2">{subtitle}</p>}
      {children}
    </motion.div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { triggerHaptic } = useHapticFeedback();
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  const [goalInput, setGoalInput] = useState('');
  const [category, setCategory] = useState('');
  const [hasDDay, setHasDDay] = useState(null);
  const [dDay, setDDay] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [duration, setDuration] = useState(0);
  const [customDuration, setCustomDuration] = useState('');
  const [actionTitle, setActionTitle] = useState('');
  const [actionType, setActionType] = useState('confirm');
  const [frequency, setFrequency] = useState(7);
  const [actionMinutes, setActionMinutes] = useState(60);
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [highlightSection, setHighlightSection] = useState(null);

  // Welcome 화면
  const [started, setStarted] = useState(false);

  // 로그인 상태 확인 및 처리
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromLogin = params.get('from') === 'login';

    if (fromLogin) {
      window.history.replaceState({}, '', '/Onboarding');
    }

    base44.auth.isAuthenticated().then(async (isLoggedIn) => {
      if (!isLoggedIn) return; // 비로그인 → Welcome 화면 유지
      try {
        const existingGoals = await base44.entities.Goal.filter({ status: 'active' });
        if (existingGoals && existingGoals.length > 0) {
          await base44.auth.updateMe({ onboarding_complete: true });
          queryClient.setQueryData(['me'], (old) => ({ ...(old || {}), onboarding_complete: true }));
          navigate('/Home', { replace: true });
        } else {
          // 로그인됐지만 목표 없음 → 온보딩 바로 시작
          setStarted(true);
        }
      } catch {
        setStarted(true);
      }
    });
  }, []);

  // 단계별 노출 여부
  const showGoal = started;
  const showCategory = started && goalInput.trim().length > 0;
  const showStudyDDay = showCategory && category === 'study';
  const showStudyDDayDate = showStudyDDay && hasDDay === true;
  const showDuration = showCategory && category !== '' && (
    category !== 'study' || hasDDay === false
  );
  const showAction = (showDuration && (duration > 0 || (customDuration && parseInt(customDuration) > 0))) ||
    (showStudyDDayDate && dDay !== '' && examTitle.trim().length > 0);
  const showNickname = showAction && actionTitle.trim().length > 0;
  const showComplete = showNickname && nickname.trim().length > 0;

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

        queryClient.setQueryData(['me'], (old) => ({
          ...(old || {}),
          onboarding_complete: true,
          active_category: category,
          nickname: nickname || '용사',
        }));
      } else {
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

  const daysLeft = dDay ? Math.ceil((new Date(dDay) - new Date()) / (1000 * 60 * 60 * 24)) : null;

  // Welcome 화면
  if (!started) {
    return (
      <div
        className="bg-background flex flex-col items-center justify-center px-6 text-center"
        style={{
          position: 'fixed',
          inset: 0,
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="w-24 h-24 rounded-3xl bg-amber-200/80 border-2 border-amber-400/50 flex items-center justify-center text-5xl mb-6 shadow-lg">
          🦊
        </div>
        <h1 className="text-2xl font-bold text-amber-900 mb-3">루트에 오신 것을 환영합니다</h1>
        <p className="text-muted-foreground leading-relaxed mb-2">
          루트는 당신의 작은 의지를 기억하는 친구입니다.
        </p>
        <p className="text-sm text-muted-foreground/70 mb-8">
          채찍도, 비교도, 성과 압박도 없습니다.<br />
          "너 오늘도 조금 해냈네." 라고 말해주는 존재.
        </p>
        <div className="space-y-3 w-full max-w-xs">
          <button
            onClick={() => base44.auth.redirectToLogin('/Onboarding?from=login')}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-amber-700 text-amber-50 hover:bg-amber-800 transition-colors"
          >
            로그인하기
          </button>
          <button
            onClick={() => setStarted(true)}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors border-2 border-dashed border-amber-300"
          >
            <span className="mr-2">🦊</span>가입없이 시작
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="bg-background overflow-y-auto"
      style={{
        position: 'fixed',
        inset: 0,
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-32">

        {/* 목표 입력 */}
        <Section visible={showGoal} sectionId="section-goal" highlight={highlightSection === 'goal'} title="어떤 여정을 시작하시겠습니까?" subtitle="자유롭게 입력해 주세요">
          <Input
            value={goalInput}
            onChange={e => setGoalInput(e.target.value)}
            placeholder="예: 살 빼고 싶어요, 토익 공부..."
            className="h-12 rounded-xl text-center text-base border-amber-300 focus:border-amber-500 bg-white/80 text-amber-900 placeholder:text-amber-600"
          />
          <div className="flex flex-wrap gap-2 justify-center">
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
        </Section>

        {/* 카테고리 */}
        <Section visible={showCategory} sectionId="section-category" highlight={highlightSection === 'category'} title="이 목표는 어떤 영역인가요?">
          <div className="grid grid-cols-4 gap-2">
            {CATEGORY_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => { setCategory(opt.id); setHighlightSection(null); triggerHaptic('impact', 'light'); }}
                className={`p-3 rounded-2xl border-2 transition-all duration-200 text-center
                  ${category === opt.id ? 'border-amber-600 bg-amber-100/80 shadow-md scale-[1.02]' : 'border-border bg-card hover:border-amber-400/50'}`}
              >
                <span className="text-2xl block mb-1">{opt.emoji}</span>
                <span className="font-semibold text-xs">{opt.label}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* 공부 D-day 여부 */}
        <Section visible={showStudyDDay} sectionId="section-dday" highlight={highlightSection === 'dday'} title="시험 D-day가 있나요?" subtitle="목표 유형에 따라 다르게 설정돼요">
          <button
            onClick={() => { setHasDDay(true); triggerHaptic('impact', 'light'); }}
            className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${hasDDay === true ? 'border-amber-600 bg-amber-100/80' : 'border-border bg-card hover:border-amber-400/50'}`}
          >
            <p className="font-bold text-amber-900 text-sm">📅 D-day 있음</p>
            <p className="text-xs text-amber-700/70 mt-1">시험이나 마감일이 정해져 있어요</p>
          </button>
          <button
            onClick={() => { setHasDDay(false); triggerHaptic('impact', 'light'); }}
            className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${hasDDay === false ? 'border-amber-600 bg-amber-100/80' : 'border-border bg-card hover:border-amber-400/50'}`}
          >
            <p className="font-bold text-foreground text-sm">📖 D-day 없음</p>
            <p className="text-xs text-muted-foreground mt-1">꾸준히 공부 습관을 만들고 싶어요</p>
          </button>
        </Section>

        {/* D-day 날짜 */}
        <Section visible={showStudyDDayDate} sectionId="section-ddaydate" highlight={highlightSection === 'ddaydate'} title="시험 정보를 입력해 주세요">
          <div>
            <label className="text-xs font-semibold text-amber-800 mb-1.5 flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" /> 시험 날짜 (D-day)
            </label>
            <input
              type="date"
              value={dDay}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setDDay(e.target.value)}
              className="w-full h-12 rounded-xl border border-input bg-white/80 px-4 text-sm text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
            {daysLeft !== null && daysLeft > 0 && (
              <p className="text-xs text-amber-700 font-semibold mt-1.5">🎯 D-{daysLeft} · {daysLeft}일 남았습니다</p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-amber-800 mb-1.5 block">어떤 시험인가요?</label>
            <Input
              value={examTitle}
              onChange={e => setExamTitle(e.target.value)}
              placeholder="예: 토익 900점, 수능, 정보처리기사..."
              className="h-12 rounded-xl bg-white/80 text-amber-900 placeholder:text-amber-300"
            />
          </div>
        </Section>

        {/* 기간 */}
        <Section visible={showDuration} sectionId="section-duration" highlight={highlightSection === 'duration'} title="얼마 동안 도전하시겠습니까?" subtitle="기간을 선택해 주세요">
          <div className="grid grid-cols-3 gap-3">
            {[4, 8, 12, 16, 20, 24].map(weeks => (
              <button
                key={weeks}
                onClick={() => { setDuration(weeks * 7); setCustomDuration(''); triggerHaptic('impact', 'light'); }}
                className={`py-3 rounded-xl font-semibold text-sm transition-all ${
                  duration === weeks * 7 && !customDuration ? 'bg-amber-700 text-amber-50 shadow-md' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
              >
                {weeks}주
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="52"
              value={customDuration}
              onChange={e => { setCustomDuration(e.target.value); setDuration(0); }}
              placeholder="직접 입력"
              className="flex-1 h-11 rounded-xl border border-input bg-white/80 px-4 text-sm text-center text-amber-900 placeholder:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
            <span className="text-sm font-semibold text-muted-foreground">주</span>
          </div>
          {(customDuration || duration > 0) && (
            <p className="text-xs text-amber-700 font-semibold text-center">
              총 {customDuration ? Number(customDuration) * 7 : duration}일 ({customDuration || Math.round(duration / 7)}주)
            </p>
          )}
        </Section>

        {/* 행동 목표 */}
        <Section visible={showAction} sectionId="section-action" highlight={highlightSection === 'action'} title="이 목표를 위해 어떤 행동을 하시겠습니까?" subtitle="행동 목표를 설정해 주세요">
          <Input
            value={actionTitle}
            onChange={e => setActionTitle(e.target.value)}
            placeholder="예: 러닝, LC 공부, 명상..."
            className="h-11 rounded-xl text-center text-sm border-amber-300 bg-white/80 text-amber-900 placeholder:text-amber-300"
          />
          <div>
            <p className="text-xs font-semibold text-amber-800 mb-2">행동 유형</p>
            <div className="space-y-2">
              {ACTION_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setActionType(opt.value); triggerHaptic('impact', 'light'); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    actionType === opt.value ? 'border-amber-600 bg-amber-50/80' : 'border-border bg-card hover:border-amber-300'}`}
                >
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
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-800 mb-2">주 횟수</p>
            <div className="grid grid-cols-7 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map(f => (
                <button
                  key={f}
                  onClick={() => { setFrequency(f); triggerHaptic('impact', 'light'); }}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    frequency === f ? 'bg-amber-700 text-amber-50' : 'bg-secondary text-secondary-foreground'}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">주 {frequency}회</p>
          </div>
          {actionType === 'timer' && (
            <div>
              <p className="text-xs font-semibold text-amber-800 mb-2">1회 시간</p>
              <div className="flex gap-2 mb-2">
                {[20, 30, 60].map(m => (
                  <button
                    key={m}
                    onClick={() => { setActionMinutes(m); triggerHaptic('impact', 'light'); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      actionMinutes === m ? 'bg-amber-700 text-amber-50' : 'bg-secondary text-secondary-foreground'}`}
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
                  onChange={e => setActionMinutes(Number(e.target.value))}
                  placeholder="직접 입력"
                  className="flex-1 h-10 rounded-xl border border-input bg-white/80 px-3 text-sm text-center text-amber-900 placeholder:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
                <span className="text-sm font-semibold text-muted-foreground">분</span>
              </div>
            </div>
          )}
        </Section>

        {/* 닉네임 */}
        <Section visible={showNickname} sectionId="section-nickname" highlight={highlightSection === 'nickname'} title="이 여정을 함께 걸을 이름을 정해주세요" subtitle="루트에서 당신을 어떻게 부르면 될까요?">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-3xl bg-amber-200/80 border-2 border-amber-400/50 flex items-center justify-center text-3xl shadow">
              🦊
            </div>
          </div>
          <Input
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="닉네임 입력"
            maxLength={12}
            className="h-12 rounded-xl text-center text-lg border-amber-300 bg-white/80 text-amber-900 placeholder:text-amber-300"
          />
          <p className="text-xs text-muted-foreground text-center">예시: 성장의길 / 턱걸이10 / 루트워커</p>
          <p className="text-xs text-muted-foreground/60 text-center">나중에 변경할 수 있어요</p>
        </Section>

        {/* 완료 버튼 - 항상 표시 */}
        {started && (
          <motion.div
            ref={bottomRef}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => {
                // 미완성 항목 찾기
                if (!goalInput.trim()) {
                  setHighlightSection('goal');
                  document.getElementById('section-goal')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  return;
                }
                if (!category) {
                  setHighlightSection('category');
                  document.getElementById('section-category')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  return;
                }
                if (category === 'study' && hasDDay === null) {
                  setHighlightSection('dday');
                  document.getElementById('section-dday')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  return;
                }
                if (category === 'study' && hasDDay === true && (!dDay || !examTitle.trim())) {
                  setHighlightSection('ddaydate');
                  document.getElementById('section-ddaydate')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  return;
                }
                if (showDuration && duration === 0 && !customDuration) {
                  setHighlightSection('duration');
                  document.getElementById('section-duration')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  return;
                }
                if (!actionTitle.trim()) {
                  setHighlightSection('action');
                  document.getElementById('section-action')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  return;
                }
                if (!nickname.trim()) {
                  setHighlightSection('nickname');
                  document.getElementById('section-nickname')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  return;
                }
                handleComplete();
              }}
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl font-bold text-base bg-amber-700 text-amber-50 hover:bg-amber-800 transition-colors shadow-lg disabled:opacity-60"
            >
              {isSubmitting ? '저장 중...' : '🦊 여정 시작하기'}
            </button>
          </motion.div>
        )}

      </div>
    </div>
  );
}