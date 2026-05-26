import React, { useState, useRef } from 'react';
import { Plus, X, Camera, Image as ImageIcon, Flame, Wallet } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const MEAL_TYPES = [
  { key: 'breakfast', label: '아침', emoji: '🌅' },
  { key: 'lunch', label: '점심', emoji: '☀️' },
  { key: 'dinner', label: '저녁', emoji: '🌙' },
  { key: 'snack', label: '간식', emoji: '🍪' },
];

function formatKRW(num) {
  if (!num) return '0';
  return Number(num).toLocaleString('ko-KR');
}

// 식단에서 가계부로 항목 추가하는 헬퍼
function addMealToLedger(dateKey, item) {
  if (!item.price || Number(item.price) <= 0) return;
  try {
    const saved = localStorage.getItem('daily_ledger_v1');
    const ledger = saved ? JSON.parse(saved) : {};
    const entries = ledger[dateKey] || [];
    // 이미 연동된 항목이면 중복 방지
    if (entries.find(e => e.meal_item_id === item.id)) return;
    const entry = {
      id: `meal_${item.id}`,
      meal_item_id: item.id,
      type: 'expense',
      category: '식비',
      memo: item.name || '식사',
      amount: Number(item.price),
    };
    const next = { ...ledger, [dateKey]: [...entries, entry] };
    localStorage.setItem('daily_ledger_v1', JSON.stringify(next));
  } catch {}
}

function removeMealFromLedger(dateKey, itemId) {
  try {
    const saved = localStorage.getItem('daily_ledger_v1');
    if (!saved) return;
    const ledger = JSON.parse(saved);
    const entries = ledger[dateKey] || [];
    const next = { ...ledger, [dateKey]: entries.filter(e => e.meal_item_id !== itemId) };
    localStorage.setItem('daily_ledger_v1', JSON.stringify(next));
  } catch {}
}

const EMPTY_FORM = { name: '', memo: '', price: '', calories: '', imageUrl: '' };

export default function DailyMeal({ dateKey }) {
  const [meals, setMeals] = useState(() => {
    try {
      const saved = localStorage.getItem('daily_meals_v2');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [showForm, setShowForm] = useState(null); // mealType key
  const [form, setForm] = useState(EMPTY_FORM);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const todayMeals = meals[dateKey] || {};

  const save = (next) => {
    setMeals(next);
    localStorage.setItem('daily_meals_v2', JSON.stringify(next));
  };

  const addItem = (imageUrl = '') => {
    if (!form.name.trim() && !imageUrl) return;
    const item = {
      id: `${Date.now()}_${Math.random()}`,
      name: form.name.trim(),
      memo: form.memo.trim(),
      price: form.price ? Number(form.price) : 0,
      calories: form.calories ? Number(form.calories) : 0,
      imageUrl: imageUrl || form.imageUrl,
    };
    const current = todayMeals[showForm] || [];
    const nextMeals = {
      ...meals,
      [dateKey]: { ...todayMeals, [showForm]: [...current, item] },
    };
    save(nextMeals);
    // 가격 있으면 가계부 자동 연동
    if (item.price > 0) addMealToLedger(dateKey, item);
    closeForm();
  };

  const deleteItem = (mealKey, itemId) => {
    const current = todayMeals[mealKey] || [];
    save({
      ...meals,
      [dateKey]: { ...todayMeals, [mealKey]: current.filter(i => i.id !== itemId) },
    });
    removeMealFromLedger(dateKey, itemId);
  };

  const handleFileSelected = (file) => {
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setPreviewImg({ localUrl, file });
  };

  const confirmPhoto = async () => {
    if (!previewImg) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: previewImg.file });
      setForm(f => ({ ...f, imageUrl: file_url }));
      setPreviewImg(null);
    } finally {
      setUploading(false);
    }
  };

  const closeForm = () => {
    setShowForm(null);
    setForm(EMPTY_FORM);
    setKeyboardHeight(0);
    setPreviewImg(null);
  };

  const currentMealLabel = MEAL_TYPES.find(m => m.key === showForm);

  // 오늘 전체 칼로리 합산
  const totalCalories = Object.values(todayMeals).flat().reduce((s, i) => s + (i.calories || 0), 0);
  const totalPrice = Object.values(todayMeals).flat().reduce((s, i) => s + (i.price || 0), 0);

  return (
    <div className="px-4 pb-6">
      {/* 오늘 합산 */}
      {(totalCalories > 0 || totalPrice > 0) && (
        <div className="flex gap-2 mb-3">
          {totalCalories > 0 && (
            <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/30 rounded-xl px-3 py-2">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-bold text-orange-600">{totalCalories.toLocaleString()} kcal</span>
            </div>
          )}
          {totalPrice > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl px-3 py-2">
              <Wallet className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-bold text-amber-600">{formatKRW(totalPrice)}원</span>
            </div>
          )}
        </div>
      )}

      {/* 숨겨진 파일 입력 */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => handleFileSelected(e.target.files?.[0])} />
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden"
        onChange={e => handleFileSelected(e.target.files?.[0])} />

      {/* 식사 4칸 (아침/점심/저녁/간식) */}
      <div className="space-y-2">
        {MEAL_TYPES.map(({ key, label, emoji }) => {
          const items = todayMeals[key] || [];
          const mealCalories = items.reduce((s, i) => s + (i.calories || 0), 0);
          const mealPrice = items.reduce((s, i) => s + (i.price || 0), 0);
          return (
            <div key={key} className="bg-secondary/30 rounded-xl px-3 py-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{emoji}</span>
                  <span className="text-xs font-bold text-foreground">{label}</span>
                  {mealCalories > 0 && (
                    <span className="text-[10px] text-orange-500 font-semibold">{mealCalories}kcal</span>
                  )}
                  {mealPrice > 0 && (
                    <span className="text-[10px] text-amber-600 font-semibold">{formatKRW(mealPrice)}원</span>
                  )}
                </div>
                <button
                  onClick={() => setShowForm(key)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold"
                >
                  <Plus className="w-3 h-3" />추가
                </button>
              </div>

              {items.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">아직 입력된 식단이 없습니다</p>
              ) : (
                <div className="space-y-1.5 mt-1">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-2 bg-background/60 rounded-lg px-2 py-1.5">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded-lg shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{item.name || '이름 없음'}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.memo && <span className="text-[10px] text-muted-foreground">{item.memo}</span>}
                          {item.calories > 0 && <span className="text-[10px] text-orange-500">{item.calories}kcal</span>}
                          {item.price > 0 && <span className="text-[10px] text-amber-600">{formatKRW(item.price)}원</span>}
                        </div>
                      </div>
                      <button onClick={() => deleteItem(key, item.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 사진 미리보기 모달 */}
      {previewImg && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-4 w-full max-w-sm">
            <p className="text-sm font-bold text-foreground mb-3">{currentMealLabel?.emoji} 사진 확인</p>
            <img src={previewImg.localUrl} alt="미리보기" className="w-full rounded-xl object-cover mb-4" style={{ maxHeight: '250px' }} />
            <div className="flex gap-2">
              <button onClick={confirmPhoto} disabled={uploading}
                className="flex-1 p-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-60">
                {uploading ? '업로드 중...' : '사용'}
              </button>
              <button onClick={() => setPreviewImg(null)} disabled={uploading}
                className="flex-1 p-3 rounded-lg bg-secondary text-foreground font-semibold text-sm">
                다시 선택
              </button>
              <button onClick={() => { setPreviewImg(null); }} disabled={uploading}
                className="px-3 p-3 rounded-lg bg-destructive/10 text-destructive font-semibold text-sm">
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 식단 입력 모달 */}
      {showForm && !previewImg && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={closeForm}>
          <div
            className="bg-background rounded-t-2xl p-4 w-full"
            style={{ paddingBottom: Math.max(keyboardHeight, 0) + 24 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-foreground">
                {currentMealLabel?.emoji} {currentMealLabel?.label} 추가
              </p>
              <button onClick={closeForm}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            {/* 사진 */}
            <div className="mb-3">
              {form.imageUrl ? (
                <div className="relative w-20 h-20">
                  <img src={form.imageUrl} alt="사진" className="w-full h-full object-cover rounded-xl" />
                  <button onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-foreground text-xs font-semibold">
                    <Camera className="w-4 h-4" />촬영
                  </button>
                  <button onClick={() => galleryInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-foreground text-xs font-semibold">
                    <ImageIcon className="w-4 h-4" />갤러리
                  </button>
                </div>
              )}
            </div>

            {/* 이름 */}
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onFocus={() => {
                if (window.visualViewport) setKeyboardHeight(Math.max(0, window.innerHeight - window.visualViewport.height));
              }}
              placeholder="음식 이름 (예: 마라탕)"
              className="w-full p-3 rounded-lg border border-border bg-background text-foreground text-sm mb-2 outline-none focus:ring-2 focus:ring-ring"
            />

            {/* 메모 */}
            <input
              type="text"
              value={form.memo}
              onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
              placeholder="짧은 메모 (선택, 예: 맛있었음)"
              className="w-full p-3 rounded-lg border border-border bg-background text-foreground text-sm mb-2 outline-none focus:ring-2 focus:ring-ring"
            />

            {/* 가격 + 칼로리 */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="가격 (원)"
                  className="w-full p-3 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                {form.price > 0 && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-amber-500 font-semibold pointer-events-none">
                    💰 가계부 연동
                  </span>
                )}
              </div>
              <input
                type="number"
                inputMode="numeric"
                value={form.calories}
                onChange={e => setForm(f => ({ ...f, calories: e.target.value }))}
                placeholder="칼로리 (kcal)"
                className="w-full p-3 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => addItem()}
                disabled={!form.name.trim()}
                className="flex-1 p-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40"
              >
                저장
                {form.price > 0 && <span className="ml-1 text-[11px] opacity-80">+ 가계부 기록</span>}
              </button>
              <button onClick={closeForm} className="flex-1 p-3 rounded-lg bg-secondary text-foreground font-semibold text-sm">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}