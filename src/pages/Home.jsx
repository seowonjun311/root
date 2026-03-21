import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import GoalProgress from '../components/GoalProgress';
import ActionGoalCard from '../components/ActionGoalCard';
import PhotoConfirmModal from '../components/PhotoConfirmModal';

const STORAGE_KEY = 'root_home_goals_v4';

function pad(num) {
  return String(num).padStart(2, '0');
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}-${month}-${day}`;
}

function addDays(baseDate, amount) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + amount);
  return next;
}

function formatDateLabel(date) {
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));

    reader.readAsDataURL(file);
  });
}

function makeDefaultGoals() {
  const today = new Date();
  const yesterday = addDays(today, -1);
  const tomorrow = addDays(today, 1);

  return [
    {
      id: 1,
      title: '물 2L 마시기',
      category: '일상',
      done: false,
      photo: null,
      dateKey: getDateKey(today),
    },
    {
      id: 2,
      title: '30분 걷기',
      category: '운동',
      done: false,
      photo: null,
      dateKey: getDateKey(today),
    },
    {
      id: 3,
      title: '영어 단어 20개 외우기',
      category: '공부',
      done: true,
      photo: null,
      dateKey: getDateKey(today),
    },
    {
      id: 4,
      title: '명상 10분',
      category: '정신',
      done: false,
      photo: null,
      dateKey: getDateKey(today),
    },
    {
      id: 5,
      title: '방 정리 10분',
      category: '일상',
      done: true,
      photo: null,
      dateKey: getDateKey(yesterday),
    },
    {
      id: 6,
      title: '팔굽혀펴기 20회',
      category: '운동',
      done: false,
      photo: null,
      dateKey: getDateKey(tomorrow),
    },
  ];
}

function getSavedGoals() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return makeDefaultGoals();
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return makeDefaultGoals();
    }

    return parsed;
  } catch (error) {
    console.error('localStorage 불러오기 실패:', error);
    return makeDefaultGoals();
  }
}

export default function Home() {
  const today = new Date();
  const yesterday = addDays(today, -1);
  const tomorrow = addDays(today, 1);

  const dateTabs = [
    {
      key: getDateKey(yesterday),
      label: '어제',
      subLabel: formatDateLabel(yesterday),
    },
    {
      key: getDateKey(today),
      label: '오늘',
      subLabel: formatDateLabel(today),
    },
    {
      key: getDateKey(tomorrow),
      label: '내일',
      subLabel: formatDateLabel(tomorrow),
    },
  ];

  const [goals, setGoals] = useState(getSavedGoals);
  const [selectedDateKey, setSelectedDateKey] = useState(getDateKey(today));
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState(null);

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('일상');
  const [newGoalDateKey, setNewGoalDateKey] = useState(getDateKey(today));

  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('일상');
  const [editDateKey, setEditDateKey] = useState(getDateKey(today));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    } catch (error) {
      console.error('localStorage 저장 실패:', error);
    }
  }, [goals]);

  useEffect(() => {
    setNewGoalDateKey(selectedDateKey);
  }, [selectedDateKey]);

  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => goal.dateKey === selectedDateKey);
  }, [goals, selectedDateKey]);

  const selectedGoal = useMemo(() => {
    return goals.find((goal) => goal.id === selectedGoalId) || null;
  }, [goals, selectedGoalId]);

  const completedCount = filteredGoals.filter((goal) => goal.done).length;
  const totalCount = filteredGoals.length;
  const progressPercent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const selectedDateTab = dateTabs.find((tab) => tab.key === selectedDateKey);

  const handleGoalClick = (goal) => {
    setSelectedGoalId(goal.id);
    setPhotoModalOpen(true);
  };

  const handleCloseModal = () => {
    setPhotoModalOpen(false);
    setSelectedGoalId(null);
  };

  const handleConfirmPhoto = async (file) => {
    try {
      let photoData = null;

      if (file) {
        photoData = await fileToBase64(file);
      }

      setGoals((prevGoals) =>
        prevGoals.map((goal) =>
          goal.id === selectedGoalId
            ? {
                ...goal,
                done: true,
                photo: photoData || goal.photo || null,
              }
            : goal
        )
      );

      handleCloseModal();
    } catch (error) {
      console.error(error);
      alert('사진을 저장하는 중 문제가 발생했어요.');
    }
  };

  const handleToggleDone = (goalId) => {
    setGoals((prevGoals) =>
      prevGoals.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              done: !goal.done,
            }
          : goal
      )
    );
  };

  const handleAddGoal = () => {
    const trimmedTitle = newGoalTitle.trim();

    if (!trimmedTitle) {
      alert('행동목표 이름을 입력해주세요.');
      return;
    }

    const newGoal = {
      id: Date.now(),
      title: trimmedTitle,
      category: newGoalCategory,
      done: false,
      photo: null,
      dateKey: newGoalDateKey,
    };

    setGoals((prevGoals) => [newGoal, ...prevGoals]);
    setNewGoalTitle('');
    setNewGoalCategory('일상');
    setSelectedDateKey(newGoalDateKey);
  };

  const handleDeleteGoal = (goalId) => {
    const ok = window.confirm('이 행동목표를 삭제할까요?');
    if (!ok) return;

    setGoals((prevGoals) => prevGoals.filter((goal) => goal.id !== goalId));

    if (editingGoalId === goalId) {
      handleCancelEdit();
    }
  };

  const handleStartEdit = (goal) => {
    setEditingGoalId(goal.id);
    setEditTitle(goal.title);
    setEditCategory(goal.category);
    setEditDateKey(goal.dateKey);
  };

  const handleCancelEdit = () => {
    setEditingGoalId(null);
    setEditTitle('');
    setEditCategory('일상');
    setEditDateKey(getDateKey(new Date()));
  };

  const handleSaveEdit = () => {
    const trimmedTitle = editTitle.trim();

    if (!trimmedTitle) {
      alert('행동목표 이름을 입력해주세요.');
      return;
    }

    setGoals((prevGoals) =>
      prevGoals.map((goal) =>
        goal.id === editingGoalId
          ? {
              ...goal,
              title: trimmedTitle,
              category: editCategory,
              dateKey: editDateKey,
            }
          : goal
      )
    );

    setSelectedDateKey(editDateKey);
    handleCancelEdit();
  };

  const handleResetAllGoals = () => {
    const ok = window.confirm('전체 목표 데이터를 처음 상태로 되돌릴까요?');
    if (!ok) return;

    const defaults = makeDefaultGoals();
    setGoals(defaults);
    setSelectedDateKey(getDateKey(new Date()));
    setNewGoalTitle('');
    setNewGoalCategory('일상');
    setNewGoalDateKey(getDateKey(new Date()));
    handleCancelEdit();
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <Header
          title="루트"
          subtitle="날짜별 행동목표를 추가하고 수정하며 하나씩 완료해보세요"
        />

        <div style={styles.section}>
          <div style={styles.dateTabs}>
            {dateTabs.map((tab) => {
              const active = tab.key === selectedDateKey;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedDateKey(tab.key)}
                  style={{
                    ...styles.dateTabButton,
                    ...(active ? styles.dateTabButtonActive : {}),
                  }}
                >
                  <div
                    style={{
                      ...styles.dateTabLabel,
                      ...(active ? styles.dateTabLabelActive : {}),
                    }}
                  >
                    {tab.label}
                  </div>
                  <div
                    style={{
                      ...styles.dateTabSubLabel,
                      ...(active ? styles.dateTabSubLabelActive : {}),
                    }}
                  >
                    {tab.subLabel}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={styles.section}>
          <GoalProgress
            completed={completedCount}
            total={totalCount}
            percent={progressPercent}
          />
        </div>

        <div style={styles.section}>
          <div style={styles.addCard}>
            <div style={styles.addCardTitle}>새 행동목표 추가</div>

            <input
              type="text"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              placeholder="예: 7시 기상, 단어 20개, 30분 걷기"
              style={styles.input}
            />

            <div style={styles.formRow}>
              <select
                value={newGoalCategory}
                onChange={(e) => setNewGoalCategory(e.target.value)}
                style={styles.select}
              >
                <option value="일상">일상</option>
                <option value="운동">운동</option>
                <option value="공부">공부</option>
                <option value="정신">정신</option>
              </select>

              <select
                value={newGoalDateKey}
                onChange={(e) => setNewGoalDateKey(e.target.value)}
                style={styles.select}
              >
                {dateTabs.map((tab) => (
                  <option key={tab.key} value={tab.key}>
                    {tab.label} ({tab.subLabel})
                  </option>
                ))}
              </select>
            </div>

            <button type="button" onClick={handleAddGoal} style={styles.addButton}>
              행동목표 추가
            </button>
          </div>
        </div>

        {editingGoalId !== null && (
          <div style={styles.section}>
            <div style={styles.editCard}>
              <div style={styles.editCardTitle}>행동목표 수정</div>

              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="행동목표 이름"
                style={styles.input}
              />

              <div style={styles.formRow}>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  style={styles.select}
                >
                  <option value="일상">일상</option>
                  <option value="운동">운동</option>
                  <option value="공부">공부</option>
                  <option value="정신">정신</option>
                </select>

                <select
                  value={editDateKey}
                  onChange={(e) => setEditDateKey(e.target.value)}
                  style={styles.select}
                >
                  {dateTabs.map((tab) => (
                    <option key={tab.key} value={tab.key}>
                      {tab.label} ({tab.subLabel})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.editButtonRow}>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={styles.cancelEditButton}
                >
                  취소
                </button>

                <button
                  type="button"
                  onClick={handleSaveEdit}
                  style={styles.saveEditButton}
                >
                  수정 저장
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              {selectedDateTab ? `${selectedDateTab.label}의 행동목표` : '행동목표'}
            </h2>
            <div style={styles.sectionSubText}>
              {selectedDateTab ? selectedDateTab.subLabel : ''}
            </div>
          </div>

          <div style={styles.sectionRight}>
            <span style={styles.sectionCount}>
              {completedCount}/{totalCount} 완료
            </span>

            <button
              type="button"
              onClick={handleResetAllGoals}
              style={styles.resetButton}
            >
              전체 초기화
            </button>
          </div>
        </div>

        <div style={styles.goalList}>
          {filteredGoals.length === 0 ? (
            <div style={styles.emptyCard}>
              <div style={styles.emptyEmoji}>🗓️</div>
              <div style={styles.emptyTitle}>이 날짜에는 아직 목표가 없어요</div>
              <div style={styles.emptyText}>
                위에서 새 행동목표를 추가해보세요.
              </div>
            </div>
          ) : (
            filteredGoals.map((goal) => (
              <div key={goal.id} style={styles.goalRow}>
                <div style={styles.goalItem}>
                  <ActionGoalCard
                    title={goal.title}
                    category={goal.category}
                    done={goal.done}
                    photo={goal.photo}
                    onClick={() => handleGoalClick(goal)}
                    onToggleDone={() => handleToggleDone(goal.id)}
                  />
                </div>

                <div style={styles.sideButtons}>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(goal)}
                    style={styles.editButton}
                  >
                    수정
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteGoal(goal.id)}
                    style={styles.deleteButton}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <PhotoConfirmModal
        isOpen={photoModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmPhoto}
        title={
          selectedGoal
            ? `"${selectedGoal.title}" 기록을 완료할까요?`
            : '기록을 완료할까요?'
        }
        description="사진을 남기거나, 사진 없이 바로 완료할 수 있어요."
      />
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background:
      'linear-gradient(180deg, #140f1d 0%, #1b1430 45%, #221938 100%)',
    paddingBottom: '120px',
  },
  container: {
    width: '100%',
    maxWidth: '720px',
    margin: '0 auto',
    padding: '20px 16px 32px',
    boxSizing: 'border-box',
  },
  section: {
    marginTop: '18px',
  },
  dateTabs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  dateTabButton: {
    border: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: '18px',
    padding: '14px 10px',
    cursor: 'pointer',
    textAlign: 'center',
  },
  dateTabButtonActive: {
    background:
      'linear-gradient(135deg, rgba(139,92,246,0.35), rgba(236,72,153,0.22))',
    border: '1px solid rgba(216,180,254,0.45)',
  },
  dateTabLabel: {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 800,
    lineHeight: 1.2,
  },
  dateTabLabelActive: {
    color: '#ffffff',
  },
  dateTabSubLabel: {
    marginTop: '6px',
    color: '#cbd5e1',
    fontSize: '12px',
    fontWeight: 600,
  },
  dateTabSubLabelActive: {
    color: '#f5d0fe',
  },
  addCard: {
    background: 'linear-gradient(180deg, #261b3a 0%, #1f1730 100%)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '22px',
    padding: '18px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  },
  addCardTitle: {
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: 800,
    marginBottom: '14px',
  },
  editCard: {
    background: 'linear-gradient(180deg, #2d1d2f 0%, #231725 100%)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '22px',
    padding: '18px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  },
  editCardTitle: {
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: 800,
    marginBottom: '14px',
  },
  input: {
    width: '100%',
    height: '46px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#ffffff',
    padding: '0 14px',
    boxSizing: 'border-box',
    fontSize: '14px',
    outline: 'none',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginTop: '12px',
  },
  select: {
    width: '100%',
    height: '46px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#ffffff',
    padding: '0 12px',
    boxSizing: 'border-box',
    fontSize: '14px',
    outline: 'none',
  },
  addButton: {
    width: '100%',
    height: '48px',
    marginTop: '14px',
    borderRadius: '14px',
    border: 'none',
    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  editButtonRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginTop: '14px',
  },
  cancelEditButton: {
    height: '46px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  saveEditButton: {
    height: '46px',
    borderRadius: '14px',
    border: 'none',
    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  sectionHeader: {
    marginTop: '28px',
    marginBottom: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
  },
  sectionTitle: {
    margin: 0,
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: 700,
  },
  sectionSubText: {
    marginTop: '6px',
    color: '#cbd5e1',
    fontSize: '13px',
    fontWeight: 600,
  },
  sectionRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  sectionCount: {
    color: '#cbd5e1',
    fontSize: '14px',
    fontWeight: 600,
  },
  resetButton: {
    height: '34px',
    padding: '0 12px',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  goalList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  goalRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '10px',
    alignItems: 'stretch',
  },
  goalItem: {
    width: '100%',
  },
  sideButtons: {
    display: 'grid',
    gridTemplateRows: '1fr 1fr',
    gap: '8px',
  },
  editButton: {
    minWidth: '64px',
    border: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#c4b5fd',
    borderRadius: '16px',
    padding: '0 12px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  deleteButton: {
    minWidth: '64px',
    border: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#fca5a5',
    borderRadius: '16px',
    padding: '0 12px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  emptyCard: {
    border: '1px dashed rgba(255,255,255,0.16)',
    borderRadius: '20px',
    padding: '30px 16px',
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  emptyEmoji: {
    fontSize: '30px',
    marginBottom: '10px',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 700,
  },
  emptyText: {
    marginTop: '8px',
    color: '#cbd5e1',
    fontSize: '13px',
    lineHeight: 1.5,
  },
};
