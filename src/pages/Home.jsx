import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import GoalProgress from '../components/GoalProgress';
import ActionGoalCard from '../components/ActionGoalCard';
import PhotoConfirmModal from '../components/PhotoConfirmModal';

const STORAGE_KEY = 'root_home_goals_v2';

const DEFAULT_GOALS = [
  {
    id: 1,
    title: '물 2L 마시기',
    category: '일상',
    done: false,
    photo: null,
  },
  {
    id: 2,
    title: '30분 걷기',
    category: '운동',
    done: false,
    photo: null,
  },
  {
    id: 3,
    title: '영어 단어 20개 외우기',
    category: '공부',
    done: true,
    photo: null,
  },
  {
    id: 4,
    title: '명상 10분',
    category: '정신',
    done: false,
    photo: null,
  },
];

function getSavedGoals() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return DEFAULT_GOALS;
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return DEFAULT_GOALS;
    }

    return parsed;
  } catch (error) {
    console.error('localStorage 불러오기 실패:', error);
    return DEFAULT_GOALS;
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
    };

    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [goals, setGoals] = useState(getSavedGoals);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    } catch (error) {
      console.error('localStorage 저장 실패:', error);
    }
  }, [goals]);

  const selectedGoal = useMemo(() => {
    return goals.find((goal) => goal.id === selectedGoalId) || null;
  }, [goals, selectedGoalId]);

  const completedCount = goals.filter((goal) => goal.done).length;
  const totalCount = goals.length;
  const progressPercent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

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

  const handleResetGoals = () => {
    const ok = window.confirm('목표 상태를 처음 상태로 되돌릴까요?');
    if (!ok) return;

    setGoals(DEFAULT_GOALS);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <Header
          title="루트"
          subtitle="오늘의 행동목표를 하나씩 완료해보세요"
        />

        <div style={styles.section}>
          <GoalProgress
            completed={completedCount}
            total={totalCount}
            percent={progressPercent}
          />
        </div>

        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>오늘의 행동목표</h2>

          <div style={styles.sectionRight}>
            <span style={styles.sectionCount}>
              {completedCount}/{totalCount} 완료
            </span>

            <button
              type="button"
              onClick={handleResetGoals}
              style={styles.resetButton}
            >
              초기화
            </button>
          </div>
        </div>

        <div style={styles.goalList}>
          {goals.map((goal) => (
            <div key={goal.id} style={styles.goalItem}>
              <ActionGoalCard
                title={goal.title}
                category={goal.category}
                done={goal.done}
                photo={goal.photo}
                onClick={() => handleGoalClick(goal)}
                onToggleDone={() => handleToggleDone(goal.id)}
              />
            </div>
          ))}
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
  goalItem: {
    width: '100%',
  },
};
