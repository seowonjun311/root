import React, { useMemo, useState } from 'react';
import PhotoConfirmModal from './PhotoConfirmModal';

function formatLastCompleted(goal) {
  if (!goal?.logs || goal.logs.length === 0) return '아직 기록 없음';

  const lastLog = [...goal.logs].sort(
    (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
  )[0];

  if (!lastLog?.completedAt) return '아직 기록 없음';

  const d = new Date(lastLog.completedAt);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');

  return `최근 완료 ${yyyy}.${mm}.${dd}`;
}

function categoryLabel(category) {
  switch (category) {
    case '운동':
      return '운동';
    case '공부':
      return '공부';
    case '정신':
      return '정신';
    case '일상':
      return '일상';
    default:
      return '미분류';
  }
}

export default function ActionGoalCard({
  goal,
  onEdit,
  onDelete,
  onComplete,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  const completedCount = useMemo(() => {
    return goal?.logs?.length || 0;
  }, [goal]);

  const lastCompletedText = useMemo(() => {
    return formatLastCompleted(goal);
  }, [goal]);

  return (
    <>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e9e9ef',
          borderRadius: 16,
          padding: '12px 14px',
          marginBottom: 10,
          boxShadow: '0 6px 20px rgba(20,20,43,0.05)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: '#f4f6fb',
                  color: '#4c5670',
                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {categoryLabel(goal.category)}
              </span>

              <span
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: '#1f2430',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
                title={goal.title}
              >
                {goal.title}
              </span>
            </div>

            <div
              style={{
                fontSize: 12,
                color: '#6b7280',
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <span>{lastCompletedText}</span>
              <span>총 {completedCount}회</span>
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => setPhotoModalOpen(true)}
              style={{
                border: 'none',
                background: '#111827',
                color: '#ffffff',
                borderRadius: 10,
                padding: '9px 12px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              완료
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                background: '#fff',
                cursor: 'pointer',
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="수정 메뉴"
              title="수정 메뉴"
            >
              ✏️
            </button>

            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 42,
                  right: 0,
                  width: 120,
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  overflow: 'hidden',
                  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
                  zIndex: 20,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit?.(goal);
                  }}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: '#fff',
                    padding: '12px 14px',
                    textAlign: 'left',
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  수정
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete?.(goal.id);
                  }}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: '#fff',
                    padding: '12px 14px',
                    textAlign: 'left',
                    fontSize: 14,
                    color: '#dc2626',
                    cursor: 'pointer',
                    borderTop: '1px solid #f1f5f9',
                  }}
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <PhotoConfirmModal
        open={photoModalOpen}
        goalTitle={goal.title}
        onClose={() => setPhotoModalOpen(false)}
        onConfirm={(payload) => {
          onComplete?.(goal.id, payload);
          setPhotoModalOpen(false);
        }}
      />
    </>
  );
}
