import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function CreateGoalForm({ category }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);

  const [actionMode, setActionMode] = useState('routine');
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actionGoals'] });
      toast.success('퀘스트 생성 완료 🦊');
      navigate('/Home');
    },
  });

  const handleSubmit = () => {
    if (!goalTitle || !actionTitle) {
      toast.error('입력해주세요');
      return;
    }

    if (actionMode === 'single' && !scheduledDate) {
      toast.error('날짜 선택 필요');
      return;
    }

    createMutation.mutate();
  };

  // ============================
  // STEP 0 👉 루틴/단발 선택
  // ============================
  if (step === 0) {
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-xl font-bold">퀘스트 선택</h2>

        <button
          onClick={() => {
            setActionMode('routine');
            setStep(1);
          }}
          className="w-full p-5 rounded-xl border text-left"
        >
          <div className="text-lg font-bold">🔁 루틴형</div>
          <div className="text-sm text-gray-500">
            매일 또는 주 n회 반복하는 습관
          </div>
        </button>

        <button
          onClick={() => {
            setActionMode('single');
            setStep(1);
          }}
          className="w-full p-5 rounded-xl border text-left"
        >
          <div className="text-lg font-bold">🎯 단발형</div>
          <div className="text-sm text-gray-500">
            특정 날짜에 한 번 수행하는 도전
          </div>
        </button>
      </div>
    );
  }

  // ============================
  // STEP 1 👉 결과목표 or 1회 행동
  // ============================
  if (step === 1) {
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold">
          {actionMode === 'single' ? '1회 행동' : '결과 목표'}
        </h2>

        <Input
          value={goalTitle}
          onChange={(e) => setGoalTitle(e.target.value)}
          placeholder={
            actionMode === 'single'
              ? '예: 한라산 등산'
              : '예: 체력 키우기'
          }
        />

        <Button onClick={() => setStep(2)}>다음</Button>
      </div>
    );
  }

  // ============================
  // STEP 2 👉 행동목표 이름
  // ============================
  if (step === 2) {
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold">행동</h2>

        <Input
          value={actionTitle}
          onChange={(e) => setActionTitle(e.target.value)}
          placeholder="예: 러닝 / 공부 / 금연"
        />

        <Button onClick={() => setStep(3)}>다음</Button>
      </div>
    );
  }

  // ============================
  // STEP 3 👉 단발이면 날짜
  // ============================
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

  // ============================
  // STEP 4 👉 유형 선택 (설명 추가)
  // ============================
  if ((step === 3 && actionMode === 'routine') || step === 4) {
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold">유형 선택</h2>

        <div className="space-y-2">
          <button
            onClick={() => setActionType('confirm')}
            className="w-full p-3 border rounded text-left"
          >
            ✔ 확인형  
            <div className="text-xs text-gray-500">
              했는지 체크만 하면 끝
            </div>
          </button>

          <button
            onClick={() => setActionType('timer')}
            className="w-full p-3 border rounded text-left"
          >
            ⏱ 시간형  
            <div className="text-xs text-gray-500">
              시간 측정 (공부 / 운동)
            </div>
          </button>

          <button
            onClick={() => setActionType('abstain')}
            className="w-full p-3 border rounded text-left"
          >
            🚫 안하기형  
            <div className="text-xs text-gray-500">
              금연 / 야식 금지
            </div>
          </button>
        </div>

        <Button onClick={() => setStep(5)}>다음</Button>
      </div>
    );
  }

  // ============================
  // STEP 5 👉 루틴이면 횟수
  // ============================
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

  // ============================
  // STEP 6 👉 시간형
  // ============================
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
