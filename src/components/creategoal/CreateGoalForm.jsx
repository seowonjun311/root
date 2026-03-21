import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CreateGoalForm({ category }) {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [goalTitle, setGoalTitle] = useState('');
  const [duration, setDuration] = useState(28);

  const [actionTitle, setActionTitle] = useState('');
  const [frequency, setFrequency] = useState(5);
  const [minutes, setMinutes] = useState(30);

  // ✅ 뒤로가기
  const handleBack = () => {
    if (step === 0) {
      navigate('/Home');
      return;
    }
    setStep(step - 1);
  };

  // ✅ 다음 단계
  const handleNext = () => {
    if (step === 0 && !goalTitle.trim()) {
      toast.error('목표를 입력해주세요!');
      return;
    }

    if (step === 1 && !actionTitle.trim()) {
      toast.error('행동 목표를 입력해주세요!');
      return;
    }

    setStep(step + 1);
  };

  // ✅ 저장
  const handleSubmit = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // 1️⃣ 결과 목표 생성
      const goal = await base44.entities.Goal.create({
        category,
        goal_type: 'result',
        title: goalTitle,
        duration_days: duration,
        start_date: today,
        status: 'active',
      });

      // 2️⃣ 행동 목표 생성
      await base44.entities.ActionGoal.create({
        goal_id: goal.id,
        category,
        title: actionTitle,
        action_type: 'timer',
        weekly_frequency: frequency,
        duration_minutes: minutes,
        duration_days: duration,
        status: 'active',
      });

      toast.success('목표가 생성되었습니다! 🦊');

      navigate('/Home');
    } catch (error) {
      console.error(error);
      toast.error('저장 중 오류가 발생했습니다.');
    }
  };

  // ======================
  // 🎯 STEP UI
  // ======================

  return (
    <div className="p-6">
      {/* ✅ 뒤로가기 버튼 */}
      <button
        onClick={handleBack}
        className="mb-4 p-2 rounded-lg hover:bg-secondary transition-colors"
      >
        <ChevronLeft className="w-5 h-5 text-amber-800" />
      </button>

      {/* STEP 0 */}
      {step === 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4">🎯 목표를 입력하세요</h2>

          <input
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            placeholder="예: 10kg 감량하기"
            className="w-full p-3 border rounded-lg mb-4"
          />

          <div className="flex gap-2">
            {[28, 56, 84].map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`flex-1 p-2 rounded-lg ${
                  duration === d ? 'bg-amber-700 text-white' : 'bg-gray-200'
                }`}
              >
                {d / 7}주
              </button>
            ))}
          </div>

          <button
            onClick={handleNext}
            className="mt-6 w-full p-3 bg-amber-700 text-white rounded-lg"
          >
            다음
          </button>
        </div>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <div>
          <h2 className="text-lg font-bold mb-4">🔥 행동 목표</h2>

          <input
            value={actionTitle}
            onChange={(e) => setActionTitle(e.target.value)}
            placeholder="예: 매일 30분 걷기"
            className="w-full p-3 border rounded-lg mb-4"
          />

          <p className="text-sm mb-2">주 몇 회?</p>
          <div className="flex gap-2 mb-4">
            {[3, 4, 5, 6, 7].map((f) => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                className={`flex-1 p-2 rounded-lg ${
                  frequency === f ? 'bg-amber-700 text-white' : 'bg-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <p className="text-sm mb-2">1회 시간</p>
          <div className="flex gap-2">
            {[20, 30, 60].map((m) => (
              <button
                key={m}
                onClick={() => setMinutes(m)}
                className={`flex-1 p-2 rounded-lg ${
                  minutes === m ? 'bg-amber-700 text-white' : 'bg-gray-200'
                }`}
              >
                {m}분
              </button>
            ))}
          </div>

          <button
            onClick={handleNext}
            className="mt-6 w-full p-3 bg-amber-700 text-white rounded-lg"
          >
            다음
          </button>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div>
          <h2 className="text-lg font-bold mb-4">🚀 시작할 준비 완료!</h2>

          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <p>목표: {goalTitle}</p>
            <p>기간: {duration}일</p>
            <p>행동: {actionTitle}</p>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full p-3 bg-green-600 text-white rounded-lg"
          >
            시작하기
          </button>
        </div>
      )}
    </div>
  );
}
