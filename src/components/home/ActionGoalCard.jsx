import React from 'react';

export default function ActionGoalCard({
  title = '행동목표',
  category = '일상',
  done = false,
  photo = null,
  onClick,
  onToggleDone,
}) {
  return (
    <div style={styles.card}>
      <button
        type="button"
        onClick={onClick}
        style={{
          ...styles.mainButton,
          ...(done ? styles.mainButtonDone : {}),
        }}
      >
        <div style={styles.left}>
          <div
            style={{
              ...styles.categoryBadge,
              ...getCategoryStyle(category),
            }}
          >
            {category}
          </div>

          <div style={styles.textWrap}>
            <div
              style={{
                ...styles.title,
                ...(done ? styles.titleDone : {}),
              }}
            >
              {title}
            </div>

            <div style={styles.subText}>
              {done ? '오늘 기록이 완료되었어요' : '눌러서 기록을 완료해보세요'}
            </div>
          </div>
        </div>

        <div style={styles.right}>
          {photo ? (
            <img src={photo} alt="기록 사진" style={styles.photoPreview} />
          ) : (
            <div style={styles.emojiBox}>{done ? '✅' : '📌'}</div>
          )}
        </div>
      </button>

      <button
        type="button"
        onClick={onToggleDone}
        style={{
          ...styles.toggleButton,
          ...(done ? styles.toggleButtonDone : {}),
        }}
      >
        {done ? '완료 취소' : '바로 완료'}
      </button>
    </div>
  );
}

function getCategoryStyle(category) {
  switch (category) {
    case '운동':
      return {
        backgroundColor: 'rgba(34, 197, 94, 0.16)',
        color: '#86efac',
      };
    case '공부':
      return {
        backgroundColor: 'rgba(59, 130, 246, 0.16)',
        color: '#93c5fd',
      };
    case '정신':
      return {
        backgroundColor: 'rgba(168, 85, 247, 0.16)',
        color: '#d8b4fe',
      };
    case '일상':
    default:
      return {
        backgroundColor: 'rgba(251, 191, 36, 0.16)',
        color: '#fde68a',
      };
  }
}

const styles = {
  card: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '10px',
    alignItems: 'stretch',
  },
  mainButton: {
    border: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: '#241a35',
    borderRadius: '18px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '14px',
    cursor: 'pointer',
    textAlign: 'left',
    minHeight: '92px',
  },
  mainButtonDone: {
    backgroundColor: '#1f2a2a',
    border: '1px solid rgba(74, 222, 128, 0.18)',
  },
  left: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    minWidth: 0,
    flex: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    lineHeight: 1,
  },
  textWrap: {
    minWidth: 0,
  },
  title: {
    color: '#ffffff',
    fontSize: '17px',
    fontWeight: 700,
    lineHeight: 1.35,
    wordBreak: 'keep-all',
  },
  titleDone: {
    color: '#d1fae5',
  },
  subText: {
    marginTop: '6px',
    color: '#cbd5e1',
    fontSize: '13px',
    lineHeight: 1.4,
  },
  right: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  emojiBox: {
    width: '52px',
    height: '52px',
    borderRadius: '14px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
  },
  photoPreview: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    objectFit: 'cover',
    border: '1px solid rgba(255,255,255,0.1)',
    display: 'block',
  },
  toggleButton: {
    minWidth: '88px',
    border: 'none',
    borderRadius: '16px',
    padding: '0 14px',
    background: 'linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%)',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  toggleButtonDone: {
    background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
  },
};
