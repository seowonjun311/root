import React, { useState } from 'react';
import { Plus, Trash2, Utensils, X } from 'lucide-react';

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

  const [showForm, setShowForm] = useState(null); // null | 'breakfast' | 'lunch' | 'dinner'
  const [inputText, setInputText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const todayMeals = meals[dateKey] || {};

  const save = (next) => {
    setMeals(next);
    localStorage.setItem('daily_meals_v1', JSON.stringify(next));
  };

  const addItem = () => {
    if (!inputText.trim() || !showForm) return;
    const current = todayMeals[showForm] || [];
    const next = {
      ...meals,
      [dateKey]: {
        ...todayMeals,
        [showForm]: [...current, { id: `${Date.now()}_${Math.random()}`, text: inputText.trim() }],
      },
    };
    save(next);
    setInputText('');
    setShowForm(null);
    setKeyboardHeight(0);
  };

  const deleteItem = (mealKey, id) => {
    const current = todayMeals[mealKey] || [];
    const next = {
      ...meals,
      [dateKey]: {
        ...todayMeals,
        [mealKey]: current.filter(item => item.id !== id),
      },
    };
    save(next);
  };

  const openForm = (mealKey) => {
    setInputText('');
    setShowForm(mealKey);
  };

  const closeForm = () => {
    setShowForm(null);
    setInputText('');
    setKeyboardHeight(0);
  };

  return (
    <div className="px-4 pb-6">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <Utensils className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-bold text-foreground">오늘의 식단</span>
      </div>

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
                  onClick={() => openForm(key)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold"
                >
                  <Plus className="w-3 h-3" />
                  추가
                </button>
              </div>
              {items.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">아직 입력된 식단이 없습니다</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-1 bg-background rounded-full px-2.5 py-1">
                      <span className="text-xs text-foreground font-medium">{item.text}</span>
                      <button onClick={() => deleteItem(key, item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 입력 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={closeForm}>
          <div
            className="bg-background rounded-2xl p-4 pb-6 absolute left-4 right-4"
            style={{ bottom: keyboardHeight + 16 }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm font-bold text-foreground mb-3">
              {MEAL_TYPES.find(m => m.key === showForm)?.emoji}{' '}
              {MEAL_TYPES.find(m => m.key === showForm)?.label} 식단 추가
            </p>
            <input
              autoFocus
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
              onKeyDown={e => { if (e.key === 'Enter') addItem(); }}
              placeholder="예: 현미밥, 된장찌개, 샐러드"
              className="w-full p-3 rounded-lg border border-border bg-background text-foreground text-sm mb-3 outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex gap-2">
              <button onClick={addItem} className="flex-1 p-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm">추가</button>
              <button onClick={closeForm} className="flex-1 p-3 rounded-lg bg-secondary text-foreground font-semibold text-sm">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}