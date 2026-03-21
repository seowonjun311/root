import React, { useRef, useState } from 'react';

export default function PhotoConfirmModal({
  open,
  onClose,
  onConfirm,
  goalTitle,
}) {
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [selectedFileName, setSelectedFileName] = useState('');

  if (!open) return null;

  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleFileSelected = (event, source) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);

    onConfirm?.({
      type: source,
      file,
      fileName: file.name,
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 380,
          background: '#fff',
          borderRadius: 20,
          padding: 18,
          boxShadow: '0 18px 50px rgba(15, 23, 42, 0.20)',
        }}
      >
        <div
          style={{
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: '#111827',
              marginBottom: 6,
            }}
          >
            완료 기록
          </div>

          <div
            style={{
              fontSize: 14,
              color: '#6b7280',
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: '#374151' }}>{goalTitle}</strong>
            {' '}기록을 어떻게 남길까요?
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={handleGalleryClick}
            style={{
              width: '100%',
              border: '1px solid #e5e7eb',
              background: '#fff',
              borderRadius: 14,
              padding: '14px 16px',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            갤러리에서 사진 선택
          </button>

          <button
            type="button"
            onClick={handleCameraClick}
            style={{
              width: '100%',
              border: '1px solid #e5e7eb',
              background: '#fff',
              borderRadius: 14,
              padding: '14px 16px',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            카메라로 찍기
          </button>

          <button
            type="button"
            onClick={() =>
              onConfirm?.({
                type: 'none',
                file: null,
                fileName: '',
              })
            }
            style={{
              width: '100%',
              border: 'none',
              background: '#111827',
              color: '#fff',
              borderRadius: 14,
              padding: '14px 16px',
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            저장
          </button>
        </div>

        {selectedFileName ? (
          <div
            style={{
              marginTop: 12,
              fontSize: 12,
              color: '#6b7280',
            }}
          >
            선택된 파일: {selectedFileName}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 14,
            width: '100%',
            border: 'none',
            background: '#f3f4f6',
            color: '#374151',
            borderRadius: 12,
            padding: '12px 14px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          닫기
        </button>

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFileSelected(e, 'gallery')}
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={(e) => handleFileSelected(e, 'camera')}
        />
      </div>
    </div>
  );
}
