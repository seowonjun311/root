import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/layout/Header';
import ActionGoalCard from '../components/home/ActionGoalCard';

const STORAGE_KEY = 'root-home-data-v3';
const CATEGORIES = ['운동', '공부', '정신', '일상'];

function createInitialData() {
  return {
    resultGoals: [
      {
        id: 1001,
        category: '운동',
        title: '체력 만들기',
        description: '꾸준히 몸을 움직이며 기초 체력을 올리기',
        targetValue: 30,
        currentValue: 8,
        unit: '회',
      },
      {
        id: 1002,
        category: '공부',
        title: '영어 공부 루틴 만들기',
        description: '매일 꾸준히 영어 학습 습관 만들기',
        targetValue: 20,
        currentValue: 5,
        unit: '일',
      },
      {
        id: 1003,
        category: '정신',
        title: '마음 안정 루틴 만들기',
        description: '명상과 기록으로 마음 정리하기',
        targetValue: 14,
        currentValue: 3,
        unit: '회',
      },
      {
        id: 1004,
        category: '일상',
        title: '생활 리듬 안정화',
        description: '정리정돈과 규칙적인 일상 만들기',
        targetValue: 21,
        currentValue: 6,
        unit: '일',
      },
    ],
    actionGoals: [
      {
        id: 2001,
        category: '운동',
        title: '팔굽혀펴기 20회',
        createdAt: new Date().toISOString(),
        logs: [],
      },
      {
        id: 2002,
        category: '운동',
        title: '30분 걷기',
        createdAt: new Date().toISOString(),
        logs: [],
      },
      {
        id: 2003,
        category: '공부',
        title: '영단어 30개 외우기',
        createdAt: new Date().toISOString(),
        logs: [],
      },
      {
        id: 2004,
        category: '정신',
        title: '10분 명상하기',
        createdAt: new Date().toISOString(),
        logs: [],
      },
    ],
  };
}

function getCategoryTheme(category) {
  switch (category) {
    case '운동':
      return {
        emoji: '🏃',
        title: '운동 루트',
        desc: '몸을 움직이며 성장하는 길',
      };
    case '공부':
      return {
        emoji: '📘',
        title: '공부 루트',
        desc: '지식을 쌓아 앞으로 나아가는 길',
      };
    case '정신':
      return {
        emoji: '🧠',
        title: '정신 루트',
        desc: '마음과 집중력을 단단하게 만드는 길',
      };
    case '일상':
      return {
        emoji: '🌿',
        title: '일상 루트',
        desc: '생활을 정돈하고 균형을 만드는 길',
      };
    default:
      return {
        emoji: '✨',
        title: '루트',
        desc: '오늘의 행동을 쌓아가는 길',
      };
  }
}

function clampPercent(value) {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function getProgressPercent(currentValue = 0, targetValue = 0) {
  if (!targetValue || targetValue <= 0) return 0;
  return clampPercent(Math.round((currentValue / targetValue) * 100));
}

export default function Home() {
  const [data, setData] = useState(createInitialData());
  const [activeCategory, setActiveCategory] = useState('운동');

  const [newResultTitle, setNewResultTitle] = useState('');
  const [newResultDescription, setNewResultDescription] = useState('');
  const [newResultTargetValue, setNewResultTargetValue] = useState('');
  const [newResultUnit, setNewResultUnit] = useState('회');

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

  const activeTheme = useMemo(() => {
    return getCategoryTheme(activeCategory);
  }, [activeCategory]);

  const filteredActionGoals = useMemo(() => {
    return (data.actionGoals || []).filter(
      (goal) => goal.category === activeCategory
    );
  }, [data.actionGoals, activeCategory]);

  const filteredResultGoals = useMemo(() => {
    return (data.resultGoals || []).filter(
      (goal) => goal.category === activeCategory
    );
  }, [data.resultGoals, activeCategory]);

  const activeStats = useMemo(() => {
    const totalActionGoals = filteredActionGoals.length;
    const totalActionLogs = filteredActionGoals.reduce((sum, goal) => {
      return sum + (goal.logs?.length || 0);
    }, 0);

    const totalResultGoals = filteredResultGoals.length;

    const avgProgress =
      totalResultGoals === 0
        ? 0
        : Math.round(
            filteredResultGoals.reduce((sum, goal) => {
              return sum + getProgressPercent(goal.currentValue, goal.targetValue);
            }, 0) / totalResultGoals
          );

    return {
      totalActionGoals,
      totalActionLogs,
      totalResultGoals,
      avgProgress,
    };
  }, [filteredActionGoals, filteredResultGoals]);

  const handleAddResultGoal = () => {
    const title = newResultTitle.trim();
    const description = newResultDescription.trim();
    const targetValue = Number(newResultTargetValue);

    if (!title) return;
    if (!targetValue || targetValue <= 0) return;

    const newResultGoal = {
      id: Date.now(),
      category: activeCategory,
      title,
      description,
      targetValue,
      currentValue: 0,
      unit: newResultUnit.trim() || '회',
    };

    setData((prev) => ({
      ...prev,
      resultGoals: [newResultGoal, ...(prev.resultGoals || [])],
    }));

    setNewResultTitle('');
    setNewResultDescription('');
    setNewResultTargetValue('');
    setNewResultUnit('회');
  };

  const handleDeleteResultGoal = (resultGoalId) => {
    const ok = window.confirm('이 결과목표를 삭제할까요?');
    if (!ok) return;

    setData((prev) => ({
      ...prev,
      resultGoals: (prev.resultGoals || []).filter(
        (goal) => goal.id !== resultGoalId
      ),
    }));
  };

  const handleIncreaseResultGoal = (resultGoalId) => {
    setData((prev) => ({
      ...prev,
      resultGoals: (prev.resultGoals || []).map((goal) =>
        goal.id === resultGoalId
          ? {
              ...goal,
              currentValue: Math.min(goal.currentValue + 1, goal.targetValue),
            }
          : goal
      ),
    }));
  };

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
      actionGoals: (prev.actionGoals || []).filter(
        (goal) => goal.id !== goalId
      ),
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
      }}
    >
      <Header />

      <div
        style={{
          maxWidth: 760,
          margin: '0 auto',
          padding: '14px 12px 32px',
          boxSizing: 'border-box',
        }}
      >
        {/* 성장 카드 */}
        <div
          style={{
            background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
            borderRadius: 24,
            padding: 18,
            color: '#fff',
            marginBottom: 14,
            boxShadow: '0 12px 30px rgba(17, 24, 39, 0.18)',
          }}
        >
          <div
            style={{
              fontSize: 13,
              opacity: 0.85,
              marginBottom: 8,
            }}
          >
            {activeTheme.emoji} {activeTheme.title}
          </div>

          <div
            style={{
              fontSize: 24,
              fontWeight: 900,
              lineHeight: 1.25,
              marginBottom: 8,
            }}
          >
            오늘도 한 걸음
            <br />
            루트를 쌓아보세요
          </div>

          <div
            style={{
              fontSize: 13,
              opacity: 0.9,
              lineHeight: 1.6,
              marginBottom: 14,
            }}
          >
            {activeTheme.desc}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
            }}
          >
            <div
              style={{
                background: 'rgba(255,255,255,0.10)',
                borderRadius: 16,
                padding: '12px 10px',
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4 }}>
                결과목표
              </div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>
                {activeStats.totalResultGoals}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.10)',
                borderRadius: 16,
                padding: '12px 10px',
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4 }}>
                행동목표
              </div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>
                {activeStats.totalActionGoals}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.10)',
                borderRadius: 16,
                padding: '12px 10px',
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4 }}>
                평균 진행률
              </div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>
                {activeStats.avgProgress}%
              </div>
            </div>
          </div>
        </div>

        {/* 카테고리 탭 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
            marginBottom: 14,
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
                  background: isActive ? '#111827' : '#fff',
                  color: isActive ? '#fff' : '#4b5563',
                  borderRadius: 999,
                  padding: '9px 8px',
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

        {/* 요약 카드 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              background: '#fff',
              border: '1px solid #e9e9ef',
              borderRadius: 18,
              padding: 14,
              boxShadow: '0 6px 20px rgba(20,20,43,0.04)',
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: '#6b7280',
                marginBottom: 6,
              }}
            >
              현재 카테고리
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#111827',
                marginBottom: 4,
              }}
            >
              {activeTheme.emoji} {activeCategory}
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#6b7280',
                lineHeight: 1.5,
              }}
            >
              {activeTheme.desc}
            </div>
          </div>

          <div
            style={{
              background: '#fff',
              border: '1px solid #e9e9ef',
              borderRadius: 18,
              padding: 14,
              boxShadow: '0 6px 20px rgba(20,20,43,0.04)',
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: '#6b7280',
                marginBottom: 6,
              }}
            >
              완료 기록
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#111827',
                marginBottom: 4,
              }}
            >
              총 {activeStats.totalActionLogs}회
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#6b7280',
                lineHeight: 1.5,
              }}
            >
              행동목표 완료를 쌓아 결과목표까지 나아가세요.
            </div>
          </div>
        </div>

        {/* 결과목표 추가 */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #e9e9ef',
            borderRadius: 20,
            padding: 14,
            marginBottom: 14,
            boxShadow: '0 6px 20px rgba(20,20,43,0.05)',
          }}
        >
          <div
            style={{
              fontSize: 17,
              fontWeight: 900,
              color: '#111827',
              marginBottom: 6,
            }}
          >
            결과목표 추가
          </div>

          <div
            style={{
              fontSize: 13,
              color: '#6b7280',
              lineHeight: 1.5,
              marginBottom: 12,
            }}
          >
            {activeCategory} 카테고리에서 이루고 싶은 큰 목표를 설정하세요.
          </div>

          <div
            style={{
              display: 'grid',
              gap: 10,
            }}
          >
            <input
              value={newResultTitle}
              onChange={(e) => setNewResultTitle(e.target.value)}
              placeholder={`${activeCategory} 결과목표 제목`}
              style={{
                width: '100%',
                border: '1px solid #dbe1ea',
                borderRadius: 12,
                padding: '12px 13px',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />

            <input
              value={newResultDescription}
              onChange={(e) => setNewResultDescription(e.target.value)}
              placeholder="결과목표 설명"
              style={{
                width: '100%',
                border: '1px solid #dbe1ea',
                borderRadius: 12,
                padding: '12px 13px',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              <input
                type="number"
                value={newResultTargetValue}
                onChange={(e) => setNewResultTargetValue(e.target.value)}
                placeholder="목표 수치"
                style={{
                  width: '100%',
                  border: '1px solid #dbe1ea',
                  borderRadius: 12,
                  padding: '12px 13px',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />

              <input
                value={newResultUnit}
                onChange={(e) => setNewResultUnit(e.target.value)}
                placeholder="단위 (회, 일, 점)"
                style={{
                  width: '100%',
                  border: '1px solid #dbe1ea',
                  borderRadius: 12,
                  padding: '12px 13px',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleAddResultGoal}
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
              결과목표 추가
            </button>
          </div>
        </div>

        {/* 결과목표 목록 */}
        <div
          style={{
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              marginBottom: 10,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                fontSize: 17,
                fontWeight: 900,
                color: '#111827',
              }}
            >
              {activeCategory} 결과목표
            </div>

            <div
              style={{
                fontSize: 12,
                color: '#6b7280',
                background: '#eef2f7',
                borderRadius: 999,
                padding: '6px 10px',
                fontWeight: 700,
              }}
            >
              총 {filteredResultGoals.length}개
            </div>
          </div>

          {filteredResultGoals.length === 0 ? (
            <div
              style={{
                background: '#fff',
                border: '1px dashed #d8dee9',
                borderRadius: 16,
                padding: '20px 16px',
                color: '#6b7280',
                fontSize: 14,
                textAlign: 'center',
                lineHeight: 1.6,
                marginBottom: 14,
              }}
            >
              아직 {activeCategory} 결과목표가 없어요.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gap: 10,
                marginBottom: 14,
              }}
            >
              {filteredResultGoals.map((goal) => {
                const percent = getProgressPercent(
                  goal.currentValue,
                  goal.targetValue
                );

                return (
                  <div
                    key={goal.id}
                    style={{
                      background: '#fff',
                      border: '1px solid #e9e9ef',
                      borderRadius: 18,
                      padding: 14,
                      boxShadow: '0 6px 20px rgba(20,20,43,0.04)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 10,
                        marginBottom: 8,
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 900,
                            color: '#111827',
                            marginBottom: 4,
                          }}
                        >
                          {goal.title}
                        </div>

                        <div
                          style={{
                            fontSize: 13,
                            color: '#6b7280',
                            lineHeight: 1.5,
                          }}
                        >
                          {goal.description || '설명 없음'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteResultGoal(goal.id)}
                        style={{
                          border: 'none',
                          background: '#fef2f2',
                          color: '#dc2626',
                          borderRadius: 10,
                          padding: '8px 10px',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        삭제
                      </button>
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#374151',
                        marginBottom: 8,
                      }}
                    >
                      {goal.currentValue} / {goal.targetValue} {goal.unit}
                    </div>

                    <div
                      style={{
                        height: 10,
                        background: '#edf2f7',
                        borderRadius: 999,
                        overflow: 'hidden',
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: '#111827',
                          borderRadius: 999,
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: '#6b7280',
                          fontWeight: 700,
                        }}
                      >
                        진행률 {percent}%
                      </div>

                      <button
                        type="button"
                        onClick={() => handleIncreaseResultGoal(goal.id)}
                        style={{
                          border: 'none',
                          background: '#111827',
                          color: '#fff',
                          borderRadius: 10,
                          padding: '9px 12px',
                          fontSize: 13,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        +1 진행
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 행동목표 추가 */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #e9e9ef',
            borderRadius: 20,
            padding: 14,
            marginBottom: 14,
            boxShadow: '0 6px 20px rgba(20,20,43,0.05)',
          }}
        >
          <div
            style={{
              fontSize: 17,
              fontWeight: 900,
              color: '#111827',
              marginBottom: 6,
            }}
          >
            행동목표 추가
          </div>

          <div
            style={{
              fontSize: 13,
              color: '#6b7280',
              lineHeight: 1.5,
              marginBottom: 12,
            }}
          >
            결과목표를 향해 가는 작은 행동들을 추가해보세요.
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
                color: '#fff',
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

        {/* 행동목표 수정 */}
        {editingGoalId !== null && (
          <div
            style={{
              background: '#fff',
              border: '1px solid #e9e9ef',
              borderRadius: 18,
              padding: 14,
              marginBottom: 14,
              boxShadow: '0 6px 20px rgba(20,20,43,0.05)',
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

        {/* 행동목표 목록 */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              marginBottom: 10,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                fontSize: 17,
                fontWeight: 900,
                color: '#111827',
              }}
            >
              {activeCategory} 행동목표
            </div>

            <div
              style={{
                fontSize: 12,
                color: '#6b7280',
                background: '#eef2f7',
                borderRadius: 999,
                padding: '6px 10px',
                fontWeight: 700,
              }}
            >
              총 {filteredActionGoals.length}개
            </div>
          </div>

          {filteredActionGoals.length === 0 ? (
            <div
              style={{
                background: '#fff',
                border: '1px dashed #d8dee9',
                borderRadius: 16,
                padding: '24px 16px',
                color: '#6b7280',
                fontSize: 14,
                textAlign: 'center',
                lineHeight: 1.6,
              }}
            >
              아직 {activeCategory} 행동목표가 없어요.
              <br />
              위에서 새로운 행동목표를 추가해보세요.
            </div>
          ) : (
            filteredActionGoals.map((goal) => (
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
