import React, { useEffect, useRef, useState } from 'react';

export default function PhotoConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '기록을 완료할까요?',
  description = '사진을 남기거나, 사진 없이 완료할 수 있어요.',
}) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreviewUrl('');
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl('');

    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(selectedFile || null);
    }
    onClose?.();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeButton}>
          ×
        </button>

        <div style={styles.header}>
          <div style={styles.iconCircle}>📸</div>
          <h2 style={styles.title}>{title}</h2>
          <p style={styles.description}>{description}</p>
        </div>

        <div style={styles.content}>
          {previewUrl ? (
            <div style={styles.previewWrap}>
              <img src={previewUrl} alt="미리보기" style={styles.previewImage} />
              <button onClick={handleRemovePhoto} style={styles.removeButton}>
                사진 삭제
              </button>
            </div>
          ) : (
            <div style={styles.emptyBox}>
              <div style={styles.emptyEmoji}>🖼️</div>
              <p style={styles.emptyText}>아직 선택한 사진이 없어요</p>
            </div>
          )}

          <div style={styles.buttonGroup}>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={styles.secondaryButton}
            >
              갤러리에서 선택
            </button>

            <button
              onClick={() => cameraInputRef.current?.click()}
              style={styles.secondaryButton}
            >
              카메라로 촬영
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelButton}>
            취소
          </button>

          <button onClick={handleConfirm} style={styles.confirmButton}>
            {selectedFile ? '사진과 함께 완료' : '사진 없이 완료'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 9999,
  },
  modal: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#1f172b',
    color: '#ffffff',
    borderRadius: '24px',
    padding: '22px',
    position: 'relative',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  closeButton: {
    position: 'absolute',
    top: '14px',
    right: '14px',
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#fff',
    fontSize: '20px',
    cursor: 'pointer',
  },
  header: {
    textAlign: 'center',
    marginBottom: '18px',
  },
  iconCircle: {
    width: '60px',
    height: '60px',
    margin: '0 auto 12px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
  },
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 700,
  },
  description: {
    marginTop: '8px',
    marginBottom: 0,
    fontSize: '14px',
    color: '#d1d5db',
    lineHeight: 1.5,
  },
  content: {
    marginTop: '16px',
  },
  emptyBox: {
    border: '1px dashed rgba(255,255,255,0.18)',
    borderRadius: '18px',
    minHeight: '180px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: '14px',
  },
  emptyEmoji: {
    fontSize: '34px',
    marginBottom: '10px',
  },
  emptyText: {
    margin: 0,
    fontSize: '14px',
    color: '#cbd5e1',
  },
  previewWrap: {
    marginBottom: '14px',
  },
  previewImage: {
    width: '100%',
    height: '220px',
    objectFit: 'cover',
    borderRadius: '18px',
    display: 'block',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  removeButton: {
    marginTop: '10px',
    width: '100%',
    height: '42px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
  buttonGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  secondaryButton: {
    height: '46px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.12)',
    backgroundColor: '#2b1f3d',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
  footer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.3fr',
    gap: '10px',
    marginTop: '18px',
  },
  cancelButton: {
    height: '48px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 600,
  },
  confirmButton: {
    height: '48px',
    borderRadius: '14px',
    border: 'none',
    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 700,
  },
};
