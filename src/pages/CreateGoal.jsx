import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

const ACTION_TYPES = [
  { value: 'timer', label: '⏱️ 시간 기록형', desc: '시간을 기록하며 수행' },
  { value: 'confirm', label: '✅ 확인형', desc: '했으면 확인을 누르기' },
  { value: 'abstain', label: '🚫 안하기', desc: '나쁜 습관 참기' },
];

export default function CreateGoal() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category') || 'exercise';
  
  const [step, setStep] = useState(0);
  const [goalTitle, setGoalTitle] = useState('');
  const [duration, setDuration] = useState(90);
  const [actionTitle, setActionTitle] = useState('');
  const [actionType, setActionType] = useState('confirm');
  const [frequency, setFrequency] = useState(5);
  const [minutes, setMinutes] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const goal = await base44.entities.Goal.create({
      category,
      goal_type: 'result',
      title: goalTitle,
      duration_days: duration,
      start_date: new Date().toISOString().split('T')[0],
      status: 'active',
    });

    await base44.entities.ActionGoal.create({
      goal_id: goal.id,
      category,
      title: actionTitle || goalTitle,
      action_type: actionType,
      weekly_frequency: frequency,
      duration_minutes: actionType === 'timer' ? minutes : 0,
      duration_days: duration,
      status: 'active',
    });

    toast.success('새로운 여정이 시작되었습니다! 🦊');
    navigate('/Home');
  };

  const categoryNames = { exercise: '운동', study: '공부', mental: '정신', daily: '일상' };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <div className="flex items-center gap-3 p-4 border-b border-border/50">
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)} className="p-1">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-lg">{categoryNames[category]} 목표 만들기</h1>
      </div>

      <div className="p-6">
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-amber-800 mb-2 block">결과 목표</label>
              <Input
                value={goalTitle}
                onChange={e => setGoalTitle(e.target.value)}
                placeholder="어떤 결과를 이루고 싶으신가요?"
                className="h-12 rounded-xl bg-white/80"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-amber-800 mb-2 block">기간</label>
              <div className="flex gap-2">
                {[30, 60, 90].map(d => (
                  <button key={d} onClick={() => setDuration(d)}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                      duration === d ? 'bg-amber-700 text-amber-50' : 'bg-secondary text-secondary-foreground'}`}>
                    {d}일
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full h-12 rounded-xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold"
              disabled={!goalTitle.trim()}
              onClick={() => setStep(1)}
            >
              다음
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-amber-800 mb-2 block">행동 목표 이름</label>
              <Input
                value={actionTitle}
                onChange={e => setActionTitle(e.target.value)}
                placeholder="예: 러닝, LC 공부, 명상..."
                className="h-12 rounded-xl bg-white/80"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-amber-800 mb-2 block">행동 유형</label>
              <div className="space-y-2">
                {ACTION_TYPES.map(t => (
                  <button key={t.value} onClick={() => setActionType(t.value)}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      actionType === t.value ? 'border-amber-600 bg-amber-50/80' : 'border-border bg-card'}`}>
                    <p className="text-sm font-semibold">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-amber-800 mb-2 block">주 횟수</label>
              <div className="flex gap-2">
                {[3, 5, 7].map(f => (
                  <button key={f} onClick={() => setFrequency(f)}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                      frequency === f ? 'bg-amber-700 text-amber-50' : 'bg-secondary text-secondary-foreground'}`}>
                    주 {f}회
                  </button>
                ))}
              </div>
            </div>

            {actionType === 'timer' && (
              <div>
                <label className="text-sm font-semibold text-amber-800 mb-2 block">1회 시간</label>
                <div className="flex gap-2">
                  {[20, 30, 60].map(m => (
                    <button key={m} onClick={() => setMinutes(m)}
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                        minutes === m ? 'bg-amber-700 text-amber-50' : 'bg-secondary text-secondary-foreground'}`}>
                      {m}분
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              className="w-full h-12 rounded-xl bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold"
              disabled={!actionTitle.trim() || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? '생성 중...' : '목표 시작하기 🦊'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}