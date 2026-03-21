import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/layout/Header';
import ActionGoalCard from '../components/ActionGoalCard';

const STORAGE_KEY = 'root-home-data-v2';

const CATEGORIES = ['운동', '공부', '정신', '일상'];

function createInitialData() {
  return {
    actionGoals: [],
  };
}

export default function Home() {
  const [data, setData] = useState(createInitialData());
  const [activeCategory, setActiveCategory] = useState('운동');

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('운동');

  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingCategory, setEditingCategory] = useState('운동');

  // ✅ 최초 로드
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(parsed);
      } catch (error) {
        console.error('저장 데이터 파싱 실패:', error);
      }
    }
  }, []);

  // ✅ 저장 + 이벤트
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('root-home-data-updated'));
  }, [data]);

  // ✅ 카테고리 필터
  const filteredGoals = useMemo(() => {
    return (data.actionGoals || []).filter(
      (goal) => goal.category === activeCategory
    );
  }, [data.actionGoals, activeCategory]);

  // ✅ 목표 추가
  const handleAddGoal = () => {
    const title = newGoalTitle.trim();
    if (!title) return;

    const newGoal = {
      id: Date.now(),
      title,
      category: newGoalCategory,
      createdAt: new Date().toISOString(),
      logs: [],
    };

    setData((prev) => ({
      ...prev,
      actionGoals: [newGoal, ...(prev.actionGoals || [])],
    }));

    setNewGoalTitle('');
    setNewGoalCategory(activeCategory);
  };

  // ✅ 삭제
  const handleDeleteGoal = (goalId) => {
    const ok = window.confirm('이 행동목표를 삭제할까요?');
    if (!ok) return;

    setData((prev) => ({
      ...prev,
      actionGoals: (prev.actionGoals || []).filter(
        (goal) => goal.id !== goalId
      ),
    }));
  };

  // ✅ 수정 시작
  const handleStartEdit = (goal) => {
    setEditingGoalId(goal.id);
    setEditingTitle(goal.title);
    setEditingCategory(goal.category);
  };

  const handleCancelEdit = () => {
    setEditingGoalId(null);
    setEditingTitle('');
    setEditingCategory(activeCategory);
  };

  const handleSaveEdit = () => {
    const title = editingTitle.trim();
    if (!title) return;

    setData((prev) => ({
      ...prev,
      actionGoals: (prev.actionGoals || []).map((goal) =>
        goal.id === editingGoalId
          ? {
              ...goal,
              title,
              category: editingCategory,
            }
          : goal
      ),
    }));

    handleCancelEdit();
  };

  // ✅ 완료 (사진 포함)
  const handleCompleteGoal = (goalId, payload) => {
    setData((prev) => ({
      ...prev,
      actionGoals: (prev.actionGoals || []).map((goal) => {
        if (goal.id !== goalId) return goal;

        const newLog = {
          id: Date.now(),
          completedAt: new Date().toISOString(),
          photoType: payload?.type || 'none',
          photoName: payload?.fileName || '',
        };

        return {
          ...goal,
          logs: [...(goal.logs || []), newLog],
        };
      }),
    }));
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f6f7fb',
      }}
    >
      {/* ✅ 헤더 */}
      <Header />

      <div
        style={{
          maxWidth: 760,
          margin: '0 auto',
          padding: '12px',
        }}
      >
        {/* ✅ 카테고리 버튼 (슬림) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
            marginBottom: 12,
          }}
        >
          {CATEGORIES.map((category) => {
            const isActive = activeCategory === category;

            return (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  setNewGoalCategory(category);
                }}
                style={{
                  border: isActive
                    ? '1px solid #111827'
                    : '1px solid #d7dbe4',
                  background: isActive ? '#111827' : '#fff',
                  color: isActive ? '#fff' : '#4b5563',
                  borderRadius: 999,
                  padding: '8px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* ✅ 새 목표 */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #e9e9ef',
            borderRadius: 18,
            padding: 14,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              marginBottom: 10,
            }}
          >
            새 행동목표 추가
          </div>

          <input
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
            placeholder={`${activeCategory} 목표 입력`}
            style={{
              width: '100%',
              border: '1px solid #dbe1ea',
              borderRadius: 12,
              padding: 12,
              marginBottom: 10,
            }}
          />

          <button
            onClick={handleAddGoal}
            style={{
              width: '100%',
              background: '#111827',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: 12,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            추가
          </button>
        </div>

        {/* ✅ 수정 */}
        {editingGoalId !== null && (
          <div
            style={{
              background: '#fff',
              borderRadius: 18,
              padding: 14,
              marginBottom: 12,
            }}
          >
            <input
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              style={{
                width: '100%',
                border: '1px solid #dbe1ea',
                borderRadius: 12,
                padding: 12,
                marginBottom: 10,
              }}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleSaveEdit}
                style={{
                  flex: 1,
                  background: '#111827',
                  color: '#fff',
                  borderRadius: 12,
                  padding: 12,
                  border: 'none',
                }}
              >
                저장
              </button>

              <button
                onClick={handleCancelEdit}
                style={{
                  flex: 1,
                  background: '#eee',
                  borderRadius: 12,
                  padding: 12,
                  border: 'none',
                }}
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* ✅ 리스트 */}
        <div>
          {filteredGoals.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 20,
                color: '#888',
              }}
            >
              아직 목표 없음
            </div>
          ) : (
            filteredGoals.map((goal) => (
              <ActionGoalCard
                key={goal.id}
                goal={goal}
                onEdit={handleStartEdit}
                onDelete={handleDeleteGoal}
                onComplete={handleCompleteGoal}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
