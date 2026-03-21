import React, { useEffect, useMemo, useState } from 'react';
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('root-home-data-updated'));
  }, [data]);

  const filteredGoals = useMemo(() => {
    return (data.actionGoals || []).filter(
      (goal) => goal.category === activeCategory
    );
  }, [data.actionGoals, activeCategory]);

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

  const handleDeleteGoal = (goalId) => {
    const ok = window.confirm('이 행동목표를 삭제할까요?');
    if (!ok) return;

    setData((prev) => ({
      ...prev,
      actionGoals: (prev.actionGoals || []).filter((goal) => goal.id !== goalId),
    }));
  };

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
        padding: '12px 12px 28px',
      }}
    >
      <div
        style={{
          maxWidth: 760,
          margin: '0 auto',
        }}
      >
        {/* 상단 */}
        <div
          style={{
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: '#111827',
              marginBottom: 4,
            }}
          >
            루트
          </div>
          <div
            style={{
              fontSize: 13,
              color: '#6b7280',
            }}
          >
            카테고리별 행동목표를 간단하게 관리해보세요
          </div>
        </div>

        {/* 카테고리 버튼 - 더 슬림하게 */}
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
                type="button"
                onClick={() => {
                  setActiveCategory(category);
                  setNewGoalCategory(category);
                }}
                style={{
                  border: isActive ? '1px solid #111827' : '1px solid #d7dbe4',
                  background: isActive ? '#111827' : '#ffffff',
                  color: isActive ? '#ffffff' : '#4b5563',
                  borderRadius: 999,
                  padding: '8px 8px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  lineHeight: 1.1,
                }}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* 새 행동목표 추가 */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e9e9ef',
            borderRadius: 18,
            padding: 14,
            marginBottom: 12,
            boxShadow: '0 6px 20px rgba(20,20,43,0.05)',
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: '#111827',
              marginBottom: 10,
            }}
          >
            새 행동목표 추가
          </div>

          <div
            style={{
              display: 'grid',
              gap: 10,
            }}
          >
            <input
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              placeholder={`${activeCategory} 행동목표를 입력하세요`}
              style={{
                width: '100%',
                border: '1px solid #dbe1ea',
                borderRadius: 12,
                padding: '12px 13px',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            <select
              value={newGoalCategory}
              onChange={(e) => setNewGoalCategory(e.target.value)}
              style={{
                width: '100%',
                border: '1px solid #dbe1ea',
                borderRadius: 12,
                padding: '12px 13px',
                fontSize: 14,
                background: '#fff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleAddGoal}
              style={{
                border: 'none',
                background: '#111827',
                color: '#ffffff',
                borderRadius: 12,
                padding: '12px 14px',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              행동목표 추가
            </button>
          </div>
        </div>

        {/* 수정 영역 */}
        {editingGoalId !== null && (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e9e9ef',
              borderRadius: 18,
              padding: 14,
              marginBottom: 12,
              boxShadow: '0 6px 20px rgba(20,20,43,0.05)',
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#111827',
                marginBottom: 10,
              }}
            >
              행동목표 수정
            </div>

            <div
              style={{
                display: 'grid',
                gap: 10,
              }}
            >
              <input
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                placeholder="행동목표를 수정하세요"
                style={{
                  width: '100%',
                  border: '1px solid #dbe1ea',
                  borderRadius: 12,
                  padding: '12px 13px',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              <select
                value={editingCategory}
                onChange={(e) => setEditingCategory(e.target.value)}
                style={{
                  width: '100%',
                  border: '1px solid #dbe1ea',
                  borderRadius: 12,
                  padding: '12px 13px',
                  fontSize: 14,
                  background: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  style={{
                    border: 'none',
                    background: '#111827',
                    color: '#fff',
                    borderRadius: 12,
                    padding: '12px 14px',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  수정 저장
                </button>

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    border: 'none',
                    background: '#eef2f7',
                    color: '#374151',
                    borderRadius: 12,
                    padding: '12px 14px',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 목록 */}
        <div
          style={{
            marginTop: 4,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 900,
              color: '#111827',
              marginBottom: 10,
            }}
          >
            {activeCategory} 행동목표
          </div>

          {filteredGoals.length === 0 ? (
            <div
              style={{
                background: '#ffffff',
                border: '1px dashed #d8dee9',
                borderRadius: 16,
                padding: '18px 14px',
                color: '#6b7280',
                fontSize: 14,
                textAlign: 'center',
              }}
            >
              아직 {activeCategory} 행동목표가 없어요
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
