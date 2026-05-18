import React from 'react';
import { Pencil, FlipHorizontal, Save, X, Archive, Trash2 } from 'lucide-react';

export default function EditToolbar({ isEditMode, selectedObject, onToggleEditMode, onFlip, onSave, onCancel, onStoreSelected, onDeleteSelected, onClearAll, canSave }) {
  const isBuilding = selectedObject?.type === 'building';
  const isCharOrDeco = selectedObject?.type === 'character' || selectedObject?.type === 'decoration';

  return (
    <div className="absolute bottom-2 right-2 z-10 flex flex-col items-center gap-1.5">
      {isEditMode && !selectedObject && (
        <button
          onClick={onClearAll}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,100,80,0.88)', backdropFilter: 'blur(4px)' }}
          aria-label="전체제거"
          title="모든 꾸미기 제거"
        >
          <Trash2 className="w-4 h-4 text-white" />
        </button>
      )}
      <div className="flex items-center gap-1.5">
        {isEditMode && selectedObject && (
          <>
            <button
              onClick={onFlip}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,248,232,0.92)', backdropFilter: 'blur(4px)' }}
              aria-label="좌우 반전"
            >
              <FlipHorizontal className="w-4 h-4" style={{ color: '#8b5a20' }} />
            </button>
            {isCharOrDeco && (
              <>
                <button
                  onClick={onStoreSelected}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,248,232,0.92)', backdropFilter: 'blur(4px)' }}
                  aria-label="가방에 넣기"
                >
                  <Archive className="w-4 h-4" style={{ color: '#8b5a20' }} />
                </button>
                <button
                  onClick={onDeleteSelected}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,100,80,0.88)', backdropFilter: 'blur(4px)' }}
                  aria-label="삭제"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </>
            )}
          </>
        )}
      </div>

      {isEditMode && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,100,80,0.88)', backdropFilter: 'blur(4px)' }}
            aria-label="취소"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={onSave}
            disabled={!canSave}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: canSave ? 'rgba(100,180,100,0.92)' : 'rgba(180,180,180,0.7)', backdropFilter: 'blur(4px)' }}
            aria-label="저장"
          >
            <Save className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

            <button
            onClick={onToggleEditMode}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
            background: isEditMode ? 'rgba(139,90,32,0.92)' : 'rgba(255,248,232,0.88)',
            backdropFilter: 'blur(4px)',
            }}
            aria-label={isEditMode ? '편집 저장' : '편집'}
            >
            <Pencil className="w-4 h-4" style={{ color: isEditMode ? '#fff' : '#8b5a20' }} />
            </button>
            </div>
            );
            }