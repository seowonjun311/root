import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

const categoryNames = {
  exercise: '운동',
  study: '공부',
  mental: '정신',
  daily: '일상',
};

export default function CreateGoalForm({ category }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);

  // ⭐ 핵심 상태
  const [actionMode, setActionMode] = useState('routine'); // routine | single
  const [scheduledDate, setScheduledDate] = useState('');

  const [goalTitle, setGoalTitle] = useState('');
  const [actionTitle, setActionTitle] = useState('');

  const [actionType, setActionType] = useState('confirm');
  const [frequency, setFrequency] = useState(3);
  const [minutes, setMinutes] = useState(30);

  const createMutation = useMutation({
    mutationFn: async () => {
      const goal = await base44.entities.Goal.create({
        category,
        goal_type: 'result',
        title: goalTitle,
        duration_days: 30,
        start_date: new Date().toISOString().split('T')[0],
        status: 'active',
      });

      await base44.entities.ActionGoal.create({
        goal_id: goal.id,
        category,
        title: actionTitle,

        action_mode: actionMode,
        action_type: actionType,

        weekly_frequency: actionMode === 'routine' ? frequency : null,
        scheduled_date: actionMode === 'single' ? scheduledDate : null,

        duration_minutes: actionType === 'timer' ? minutes : 0,
        status: 'active',
      });

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actionGoals'] });
      toast.success('루트가 생성되었습니다! 🦊');
      navigate(`/Home?category=${category}`);
    },
  });

  const handleSubmit = () => {
    if (!goalTitle || !actionTitle) {
      toast.error('목표를 입력해주세요');
      return;
    }

    if (actionMode === 'single' && !scheduledDate) {
      toast.error('날짜를 선택해주세요');
      return;
    }

    createMutation.mutate();
  };

  // ================= STEP UI =================

  // STEP 0 👉 루틴/단발 선택
  if (step === 0) {
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-xl font-bold">퀘스트 종류 선택</h2>

        <button
          onClick={() => {
            setActionMode('routine');
            setStep(1);
          }}
          className="w-full p-5 border rounded-xl"
        >
          🔁 루틴형 (반복)
        </button>

        <button
          onClick={() => {
            setActionMode('single');
            setStep(1);
          }}
          className="w-full p-5 border rounded-xl"
        >
          🎯 단발형 (1회)
        </button>
      </div>
    );
  }

  // STEP 1 👉 결과목표
  if (step === 1) {
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold">결과 목표</h2>

        <Input
          value={goalTitle}
          onChange={(e) => setGoalTitle(e.target.value)}
          placeholder="예: 체력 키우기"
        />

        <Button onClick={() => setStep(2)}>다음</Button>
      </div>
    );
  }

  // STEP 2 👉 행동목표 이름
  if (step === 2) {
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold">행동 목표</h2>

        <Input
          value={actionTitle}
          onChange={(e) => setActionTitle(e.target.value)}
          placeholder="예: 러닝 30분"
        />

        <Button onClick={() => setStep(3)}>다음</Button>
      </div>
    );
  }

  // STEP 3 👉 단발이면 날짜
  if (step === 3 && actionMode === 'single') {
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold">날짜 선택</h2>

        <input
          type="date"
          value={scheduledDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => setScheduledDate(e.target.value)}
          className="w-full h-10 border rounded"
        />

        <Button onClick={() => setStep(4)}>다음</Button>
      </div>
    );
  }

  // STEP 4 👉 유형 선택
  if (step === 3 || step === 4) {
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold">유형 선택</h2>

        <div className="flex gap-2">
          <Button onClick={() => setActionType('confirm')}>확인형</Button>
          <Button onClick={() => setActionType('timer')}>시간형</Button>
          <Button onClick={() => setActionType('abstain')}>안하기</Button>
        </div>

        <Button onClick={() => setStep(5)}>다음</Button>
      </div>
    );
  }

  // STEP 5 👉 루틴이면 횟수
  if (step === 5 && actionMode === 'routine') {
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold">주 횟수</h2>

        <div className="flex gap-2">
          {[1, 3, 5, 7].map((n) => (
            <Button key={n} onClick={() => setFrequency(n)}>
              {n}
            </Button>
          ))}
        </div>

        <Button onClick={handleSubmit}>완료</Button>
      </div>
    );
  }

  // STEP 6 👉 시간형
  if (step === 5 && actionType === 'timer') {
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold">시간 설정</h2>

        <Input
          type="number"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
        />

        <Button onClick={handleSubmit}>완료</Button>
      </div>
    );
  }

  return null;
}
