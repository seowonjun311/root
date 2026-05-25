import React, { useState, useRef } from 'react';
import { Plus, Utensils, X, Camera, Image as ImageIcon, Type } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const MEAL_TYPES = [
  { key: 'breakfast', label: '아침', emoji: '🌅' },
  { key: 'lunch', label: '점심', emoji: '☀️' },
  { key: 'dinner', label: '저녁', emoji: '🌙' },
];

export default function DailyMeal({ dateKey }) {
  const [meals, setMeals] = useState(() => {
    try {
      const saved = localStorage.getItem('daily_meals_v1');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [showForm, setShowForm] = useState(null);
  const [inputText, setInputText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [previewImg, setPreviewImg] = useState(null); // { url, file }

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const todayMeals = meals[dateKey] || {};

  const save = (next) => {
    setMeals(next);
    localStorage.setItem('daily_meals_v1', JSON.stringify(next));
  };

  const addTextItem = () => {
    if (!inputText.trim() || !showForm) return;
    const current = todayMeals[showForm] || [];
    save({
      ...meals,
      [dateKey]: {
        ...todayMeals,
        [showForm]: [...current, { id: `${Date.now()}_${Math.random()}`, text: inputText.trim() }],
      },
    });
    setInputText('');
    setShowForm(null);
    setKeyboardHeight(0);
  };

  const addPhotoItem = async (imageUrl) => {
    if (!showForm) return;
    const current = todayMeals[showForm] || [];
    save({
      ...meals,
      [dateKey]: {
        ...todayMeals,
        [showForm]: [...current, { id: `${Date.now()}_${Math.random()}`, imageUrl }],
      },
    });
    setPreviewImg(null);
    setShowForm(null);
  };

  const handleFileSelected = async (file) => {
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setPreviewImg({ localUrl, file });
  };

  const confirmPhoto = async () => {
    if (!previewImg) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: previewImg.file });
      await addPhotoItem(file_url);
    } finally {
      setUploading(false);
    }
  };

  const deleteItem = (mealKey, id) => {
    const current = todayMeals[mealKey] || [];
    save({
      ...meals,
      [dateKey]: {
        ...todayMeals,
        [mealKey]: current.filter(item => item.id !== id),
      },
    });
  };

  const closeForm = () => {
    setShowForm(null);
    setInputText('');
    setKeyboardHeight(0);
    setPreviewImg(null);
  };

  const currentMealLabel = MEAL_TYPES.find(m => m.key === showForm);

  return (
    <div className="px-4 pb-6">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <Utensils className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-bold text-foreground">오늘의 식단</span>
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => handleFileSelected(e.target.files?.[0])}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => handleFileSelected(e.target.files?.[0])}
      />

      {/* 식사 3칸 */}
      <div className="space-y-2">
        {MEAL_TYPES.map(({ key, label, emoji }) => {
          const items = todayMeals[key] || [];
          return (
            <div key={key} className="bg-secondary/30 rounded-xl px-3 py-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{emoji}</span>
                  <span className="text-xs font-bold text-foreground">{label}</span>
                </div>
                <button
                  onClick={() => setShowForm(key)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold"
                >
                  <Plus className="w-3 h-3" />
                  추가
                </button>
              </div>

              {items.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">아직 입력된 식단이 없습니다</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {items.map(item => (
                    <div key={item.id} className="relative group">
                      {item.imageUrl ? (
                        <div className="relative">
                          <img
                            src={item.imageUrl}
                            alt="식단 사진"
                            className="w-16 h-16 object-cover rounded-xl"
                          />
                          <button
                            onClick={() => deleteItem(key, item.id)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-background rounded-full px-2.5 py-1">
                          <span className="text-xs text-foreground font-medium">{item.text}</span>
                          <button onClick={() => deleteItem(key, item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 추가 방법 선택 모달 */}
      {showForm && !previewImg && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={closeForm}>
          <div
            className="bg-background rounded-2xl p-4 pb-6 absolute left-4 right-4"
            style={{ bottom: keyboardHeight + 16 }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm font-bold text-foreground mb-4">
              {currentMealLabel?.emoji} {currentMealLabel?.label} 식단 추가
            </p>

            {/* 카메라/갤러리 버튼 */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => { cameraInputRef.current?.click(); }}
                className="flex flex-col items-center gap-2 py-4 rounded-xl bg-secondary hover:bg-secondary/70 transition-colors"
              >
                <Camera className="w-6 h-6 text-primary" />
                <span className="text-xs font-semibold text-foreground">카메라로 촬영</span>
              </button>
              <button
                onClick={() => { galleryInputRef.current?.click(); }}
                className="flex flex-col items-center gap-2 py-4 rounded-xl bg-secondary hover:bg-secondary/70 transition-colors"
              >
                <ImageIcon className="w-6 h-6 text-primary" />
                <span className="text-xs font-semibold text-foreground">갤러리에서 선택</span>
              </button>
            </div>

            {/* 구분선 */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-muted-foreground">또는 직접 입력</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* 텍스트 입력 */}
            <input
              type="text"
              value={inputText}
              onFocus={() => {
                if (window.visualViewport) {
                  const h = window.innerHeight - window.visualViewport.height;
                  setKeyboardHeight(Math.max(280, h));
                } else {
                  setKeyboardHeight(300);
                }
              }}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addTextItem(); }}
              placeholder="예: 현미밥, 된장찌개, 샐러드"
              className="w-full p-3 rounded-lg border border-border bg-background text-foreground text-sm mb-3 outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex gap-2">
              <button onClick={addTextItem} disabled={!inputText.trim()} className="flex-1 p-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40">추가</button>
              <button onClick={closeForm} className="flex-1 p-3 rounded-lg bg-secondary text-foreground font-semibold text-sm">취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 사진 미리보기 확인 모달 */}
      {previewImg && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-4 w-full max-w-sm">
            <p className="text-sm font-bold text-foreground mb-3">
              {currentMealLabel?.emoji} {currentMealLabel?.label} 사진 확인
            </p>
            <img
              src={previewImg.localUrl}
              alt="미리보기"
              className="w-full rounded-xl object-cover mb-4"
              style={{ maxHeight: '300px' }}
            />
            <div className="flex gap-2">
              <button
                onClick={confirmPhoto}
                disabled={uploading}
                className="flex-1 p-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-60"
              >
                {uploading ? '업로드 중...' : '저장'}
              </button>
              <button
                onClick={() => setPreviewImg(null)}
                disabled={uploading}
                className="flex-1 p-3 rounded-lg bg-secondary text-foreground font-semibold text-sm"
              >
                다시 선택
              </button>
              <button
                onClick={closeForm}
                disabled={uploading}
                className="px-4 p-3 rounded-lg bg-destructive/10 text-destructive font-semibold text-sm"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}