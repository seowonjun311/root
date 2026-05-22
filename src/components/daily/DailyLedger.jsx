import React, { useState, useRef } from 'react';
import { Plus, Trash2, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

const CATEGORIES = ['식비', '교통', '쇼핑', '의료', '문화', '교육', '기타'];

const CAT_COLORS = {
  식비: '#f59e0b',
  교통: '#3b82f6',
  쇼핑: '#ec4899',
  의료: '#ef4444',
  문화: '#8b5cf6',
  교육: '#10b981',
  기타: '#6b7280',
};

function formatKRW(num) {
  if (!num) return '0';
  return Number(num).toLocaleString('ko-KR');
}

export default function DailyLedger({ dateKey }) {
  // ledger: { [dateKey]: [{id, type:'expense'|'income', category, memo, amount}] }
  const [ledger, setLedger] = useState(() => {
    try {
      const saved = localStorage.getItem('daily_ledger_v1');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'expense', category: '식비', memo: '', amount: '' });
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const amountRef = useRef(null);

  const entries = ledger[dateKey] || [];

  const totalExpense = entries.filter(e => e.type === 'expense').reduce((s, e) => s + Number(e.amount), 0);
  const totalIncome = entries.filter(e => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0);

  const save = (next) => {
    setLedger(next);
    localStorage.setItem('daily_ledger_v1', JSON.stringify(next));
  };

  const addEntry = () => {
    if (!form.amount || !Number(form.amount)) return;
    const entry = { id: `${Date.now()}_${Math.random()}`, ...form, amount: Number(form.amount) };
    const nextEntries = [...entries, entry];
    save({ ...ledger, [dateKey]: nextEntries });
    setForm({ type: 'expense', category: '식비', memo: '', amount: '' });
    setShowForm(false);
    setKeyboardHeight(0);
  };

  const deleteEntry = (id) => {
    save({ ...ledger, [dateKey]: entries.filter(e => e.id !== id) });
  };

  const onFocusAmount = () => {
    if (window.visualViewport) {
      const h = window.innerHeight - window.visualViewport.height;
      setKeyboardHeight(Math.max(280, h));
    } else {
      setKeyboardHeight(300);
    }
  };

  return (
    <div className="px-4 pb-6">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">오늘의 가계부</span>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          추가
        </button>
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 rounded-xl p-3">
          <TrendingDown className="w-4 h-4 text-red-500 shrink-0" />
          <div>
            <p className="text-[10px] text-muted-foreground">지출</p>
            <p className="text-sm font-bold text-red-600">{formatKRW(totalExpense)}원</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 rounded-xl p-3">
          <TrendingUp className="w-4 h-4 text-green-500 shrink-0" />
          <div>
            <p className="text-[10px] text-muted-foreground">수입</p>
            <p className="text-sm font-bold text-green-600">{formatKRW(totalIncome)}원</p>
          </div>
        </div>
      </div>

      {/* 항목 리스트 */}
      {entries.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
          지출/수입 내역이 없습니다
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center gap-3 bg-secondary/30 rounded-xl px-3 py-2.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: CAT_COLORS[entry.category] || '#6b7280' }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {entry.memo || entry.category}
                </p>
                <p className="text-[10px] text-muted-foreground">{entry.category}</p>
              </div>
              <span className={`text-sm font-bold shrink-0 ${entry.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                {entry.type === 'expense' ? '-' : '+'}{formatKRW(entry.amount)}원
              </span>
              <button onClick={() => deleteEntry(entry.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 입력 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => { setShowForm(false); setKeyboardHeight(0); }}>
          <div
            className="bg-background rounded-2xl p-4 pb-6 absolute left-4 right-4"
            style={{ bottom: keyboardHeight + 16 }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm font-bold text-foreground mb-4">지출 / 수입 추가</p>

            {/* 지출 / 수입 토글 */}
            <div className="flex gap-2 mb-3">
              {['expense', 'income'].map(t => (
                <button
                  key={t}
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    form.type === t
                      ? t === 'expense' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                      : 'bg-secondary text-foreground'
                  }`}
                >
                  {t === 'expense' ? '지출' : '수입'}
                </button>
              ))}
            </div>

            {/* 카테고리 */}
            <div className="flex gap-1.5 flex-wrap mb-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setForm(f => ({ ...f, category: cat }))}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    form.category === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 메모 */}
            <input
              type="text"
              value={form.memo}
              onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
              placeholder="메모 (선택)"
              className="w-full p-3 rounded-lg border border-border bg-background text-foreground text-sm mb-2 outline-none focus:ring-2 focus:ring-ring"
            />

            {/* 금액 */}
            <input
              ref={amountRef}
              type="number"
              inputMode="numeric"
              value={form.amount}
              onFocus={onFocusAmount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') addEntry(); }}
              placeholder="금액 입력 (원)"
              className="w-full p-3 rounded-lg border border-border bg-background text-foreground text-sm mb-3 outline-none focus:ring-2 focus:ring-ring"
            />

            <div className="flex gap-2">
              <button onClick={addEntry} className="flex-1 p-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm">
                저장
              </button>
              <button onClick={() => { setShowForm(false); setKeyboardHeight(0); }} className="flex-1 p-3 rounded-lg bg-secondary text-foreground font-semibold text-sm">
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}