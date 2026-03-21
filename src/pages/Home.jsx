import React, { useMemo, useState } from 'react';
import Header from '../components/Header';
import GoalProgress from '../components/GoalProgress';
import ActionGoalCard from '../components/ActionGoalCard';
import PhotoConfirmModal from '../components/PhotoConfirmModal';

export default function Home() {
  const [goals, setGoals] = useState([
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
  ]);

  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState(null);

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

  const handleConfirmPhoto = (file) => {
    setGoals((prevGoals) =>
      prevGoals.map((goal) =>
        goal.id === selectedGoalId
          ? {
              ...goal,
              done: true,
              photo: file ? URL.createObjectURL(file) : goal.photo,
            }
          : goal
      )
    );

    handleCloseModal();
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
          <span style={styles.sectionCount}>
            {completedCount}/{totalCount} 완료
          </span>
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
  },
  sectionTitle: {
    margin: 0,
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: 700,
  },
  sectionCount: {
    color: '#cbd5e1',
    fontSize: '14px',
    fontWeight: 600,
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
