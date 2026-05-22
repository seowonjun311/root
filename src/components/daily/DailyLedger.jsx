import React, { useState, useRef, useMemo } from 'react';
import { Plus, Trash2, TrendingDown, TrendingUp, Wallet, CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth } from 'date-fns';

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

// 카테고리별 지출 띠그래프
function SpendingBar({ entries }) {
  const expenseEntries = entries.filter(e => e.type === 'expense');
  const total = expenseEntries.reduce((s, e) => s + Number(e.amount), 0);
  if (total === 0) return null;

  const byCategory = {};
  expenseEntries.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
  });

  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  return (
    <div className="mb-3">
      <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">카테고리별 지출 분석</p>
      {/* 띠 그래프 */}
      <div className="flex rounded-lg overflow-hidden h-4 mb-2">
        {sorted.map(([cat, amt]) => (
          <div
            key={cat}
            style={{ width: `${(amt / total) * 100}%`, backgroundColor: CAT_COLORS[cat] || '#6b7280' }}
            title={`${cat}: ${formatKRW(amt)}원`}
          />
        ))}
      </div>
      {/* 범례 */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {sorted.map(([cat, amt]) => (
          <div key={cat} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CAT_COLORS[cat] || '#6b7280' }} />
            <span className="text-[10px] text-muted-foreground">{cat}</span>
            <span className="text-[10px] font-semibold text-foreground">{Math.round((amt / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DailyLedger({ dateKey }) {
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
  const keyboardListenerRef = useRef(null);

  const [showMonthModal, setShowMonthModal] = useState(false);
  const [calMonth, setCalMonth] = useState(() => new Date(dateKey + 'T00:00:00'));
  const [selectedCalDay, setSelectedCalDay] = useState(null);

  const entries = ledger[dateKey] || [];
  const totalExpense = entries.filter(e => e.type === 'expense').reduce((s, e) => s + Number(e.amount), 0);
  const totalIncome = entries.filter(e => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0);

  const calDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(calMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(calMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [calMonth]);

  const monthKey = format(calMonth, 'yyyy-MM');

  const monthEntries = useMemo(() => {
    return Object.entries(ledger)
      .filter(([dk]) => dk.startsWith(monthKey))
      .flatMap(([dk, items]) => items.map(i => ({ ...i, dateKey: dk })));
  }, [ledger, monthKey]);

  const monthExpense = monthEntries.filter(e => e.type === 'expense').reduce((s, e) => s + Number(e.amount), 0);
  const monthIncome = monthEntries.filter(e => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0);

  const dayTotals = useMemo(() => {
    const map = {};
    Object.entries(ledger).forEach(([dk, items]) => {
      if (!dk.startsWith(monthKey)) return;
      const exp = items.filter(e => e.type === 'expense').reduce((s, e) => s + Number(e.amount), 0);
      const inc = items.filter(e => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0);
      if (exp > 0 || inc > 0) map[dk] = { exp, inc };
    });
    return map;
  }, [ledger, monthKey]);

  const save = (next) => {
    setLedger(next);
    localStorage.setItem('daily_ledger_v1', JSON.stringify(next));
  };

  const addEntry = () => {
    if (!form.amount || !Number(form.amount)) return;
    const entry = { id: `${Date.now()}_${Math.random()}`, ...form, amount: Number(form.amount) };
    save({ ...ledger, [dateKey]: [...entries, entry] });
    setForm({ type: 'expense', category: '식비', memo: '', amount: '' });
    closeForm();
  };

  const deleteEntry = (id) => {
    save({ ...ledger, [dateKey]: entries.filter(e => e.id !== id) });
  };

  const deleteMonthEntry = (entryDateKey, id) => {
    const next = { ...ledger, [entryDateKey]: (ledger[entryDateKey] || []).filter(e => e.id !== id) };
    save(next);
  };

  const startKeyboardListener = () => {
    if (!window.visualViewport) { setKeyboardHeight(300); return; }
    const handler = () => {
      const h = window.innerHeight - window.visualViewport.height;
      if (h > 50) setKeyboardHeight(h);
    };
    window.visualViewport.addEventListener('resize', handler);
    keyboardListenerRef.current = () => window.visualViewport.removeEventListener('resize', handler);
    const h = window.innerHeight - window.visualViewport.height;
    if (h > 50) setKeyboardHeight(h);
  };

  const stopKeyboardListener = () => {
    if (keyboardListenerRef.current) { keyboardListenerRef.current(); keyboardListenerRef.current = null; }
    setKeyboardHeight(0);
  };

  const closeForm = () => { stopKeyboardListener(); setShowForm(false); };

  const openMonthModal = () => {
    setCalMonth(new Date(dateKey + 'T00:00:00'));
    setSelectedCalDay(null);
    setShowMonthModal(true);
  };

  const prevMonth = () => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  // 선택된 날 항목
  const selectedDayEntries = useMemo(() => {
    if (!selectedCalDay) return [];
    return (ledger[selectedCalDay] || []).map(i => ({ ...i, dateKey: selectedCalDay }));
  }, [ledger, selectedCalDay]);

  const selectedDayExpense = selectedDayEntries.filter(e => e.type === 'expense').reduce((s, e) => s + Number(e.amount), 0);
  const selectedDayIncome = selectedDayEntries.filter(e => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="px-4 pb-6">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">오늘의 가계부</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openMonthModal} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-semibold">
            <CalendarDays className="w-3.5 h-3.5" />
            월별
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
            <Plus className="w-3.5 h-3.5" />
            추가
          </button>
        </div>
      </div>

      {/* 오늘 요약 */}
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

      {/* 오늘 항목 리스트 */}
      {entries.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
          지출/수입 내역이 없습니다
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center gap-3 bg-secondary/30 rounded-xl px-3 py-2.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CAT_COLORS[entry.category] || '#6b7280' }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{entry.memo || entry.category}</p>
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
        <div className="fixed inset-0 bg-black/50 z-50" onClick={closeForm}>
          <div
            className="bg-background rounded-2xl p-4 pb-6 absolute left-4 right-4"
            style={{ bottom: Math.max(keyboardHeight, 80) + 16 }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm font-bold text-foreground mb-4">지출 / 수입 추가</p>
            <div className="flex gap-2 mb-3">
              {['expense', 'income'].map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${form.type === t ? (t === 'expense' ? 'bg-red-500 text-white' : 'bg-green-500 text-white') : 'bg-secondary text-foreground'}`}>
                  {t === 'expense' ? '지출' : '수입'}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 flex-wrap mb-3">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setForm(f => ({ ...f, category: cat }))}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${form.category === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
                  {cat}
                </button>
              ))}
            </div>
            <input type="text" value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
              placeholder="메모 (선택)" className="w-full p-3 rounded-lg border border-border bg-background text-foreground text-sm mb-2 outline-none focus:ring-2 focus:ring-ring" />
            <input ref={amountRef} type="number" inputMode="numeric" value={form.amount}
              onFocus={startKeyboardListener} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') addEntry(); }}
              placeholder="금액 입력 (원)" className="w-full p-3 rounded-lg border border-border bg-background text-foreground text-sm mb-3 outline-none focus:ring-2 focus:ring-ring" />
            <div className="flex gap-2">
              <button onClick={addEntry} className="flex-1 p-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm">저장</button>
              <button onClick={closeForm} className="flex-1 p-3 rounded-lg bg-secondary text-foreground font-semibold text-sm">취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 월별 달력 모달 */}
      {showMonthModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowMonthModal(false)}>
          <div className="w-full bg-background rounded-t-2xl max-h-[92dvh] overflow-y-auto pb-24" onClick={e => e.stopPropagation()}>

            {/* 달력 헤더 */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-base font-bold text-foreground">{format(calMonth, 'yyyy년 M월')}</span>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
              <button onClick={() => setShowMonthModal(false)} className="p-2 rounded-lg hover:bg-secondary transition-colors ml-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 월 요약 */}
            <div className="grid grid-cols-2 gap-2 px-4 mb-2 shrink-0">
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 rounded-xl p-2.5">
                <TrendingDown className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <div>
                  <p className="text-[9px] text-muted-foreground">월 지출</p>
                  <p className="text-xs font-bold text-red-600">{formatKRW(monthExpense)}원</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 rounded-xl p-2.5">
                <TrendingUp className="w-3.5 h-3.5 text-green-500 shrink-0" />
                <div>
                  <p className="text-[9px] text-muted-foreground">월 수입</p>
                  <p className="text-xs font-bold text-green-600">{formatKRW(monthIncome)}원</p>
                </div>
              </div>
            </div>

            {/* 카테고리 지출 분석 띠그래프 */}
            <div className="px-4 mb-2 shrink-0">
              <SpendingBar entries={monthEntries} />
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 px-4 shrink-0">
              {['일','월','화','수','목','금','토'].map(d => (
                <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-0.5">{d}</div>
              ))}
            </div>

            {/* 날짜 그리드 — 행 간격 줄임 */}
            <div className="grid grid-cols-7 px-4 shrink-0" style={{ rowGap: '1px' }}>
              {calDays.map(day => {
                const dk = format(day, 'yyyy-MM-dd');
                const inMonth = isSameMonth(day, calMonth);
                const isSelected = selectedCalDay === dk;
                const isToday = dk === format(new Date(), 'yyyy-MM-dd');
                const totals = dayTotals[dk];
                return (
                  <button key={dk} onClick={() => setSelectedCalDay(isSelected ? null : dk)}
                    className={`flex flex-col items-center justify-center rounded-lg py-0.5 transition-colors
                      ${isSelected ? 'bg-primary text-primary-foreground' : isToday ? 'bg-amber-100 text-amber-800' : inMonth ? 'hover:bg-secondary text-foreground' : 'text-muted-foreground/30'}`}>
                    <span className="text-xs font-semibold leading-none">{format(day, 'd')}</span>
                    {totals && (
                      <div className="flex gap-0.5 mt-0.5">
                        {totals.exp > 0 && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-red-200' : 'bg-red-400'}`} />}
                        {totals.inc > 0 && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-green-200' : 'bg-green-500'}`} />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 구분선 */}
            <div className="border-t border-border/50 mx-4 mt-2 mb-0 shrink-0" />

            {/* 하단 내역 영역 — 스크롤 가능 */}
            <div className="overflow-y-auto flex-1 px-4 pt-3 pb-8">
              {/* 선택된 날 헤더 */}
              {selectedCalDay ? (
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-foreground">
                    {format(new Date(selectedCalDay + 'T00:00:00'), 'M월 d일')} 내역
                  </p>
                  <div className="flex items-center gap-3">
                    {selectedDayExpense > 0 && (
                      <span className="text-xs font-semibold text-red-600">-{formatKRW(selectedDayExpense)}원</span>
                    )}
                    {selectedDayIncome > 0 && (
                      <span className="text-xs font-semibold text-green-600">+{formatKRW(selectedDayIncome)}원</span>
                    )}
                    <button onClick={() => setSelectedCalDay(null)} className="text-[11px] text-primary font-semibold">전체 보기</button>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-bold text-foreground mb-2">{format(calMonth, 'M월')} 전체 내역</p>
              )}

              {/* 내역 리스트 */}
              {(selectedCalDay ? selectedDayEntries : monthEntries).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                  내역이 없습니다
                </div>
              ) : (
                <div className="space-y-2">
                  {(selectedCalDay ? selectedDayEntries : monthEntries)
                    .sort((a, b) => a.dateKey?.localeCompare(b.dateKey))
                    .map((entry) => (
                      <div key={entry.id} className="flex items-center gap-3 bg-secondary/30 rounded-xl px-3 py-2.5">
                        {!selectedCalDay && (
                          <span className="text-[10px] text-muted-foreground font-semibold shrink-0 w-8">
                            {format(new Date(entry.dateKey + 'T00:00:00'), 'M/d')}
                          </span>
                        )}
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CAT_COLORS[entry.category] || '#6b7280' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{entry.memo || entry.category}</p>
                          <p className="text-[10px] text-muted-foreground">{entry.category}</p>
                        </div>
                        <span className={`text-sm font-bold shrink-0 ${entry.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                          {entry.type === 'expense' ? '-' : '+'}{formatKRW(entry.amount)}원
                        </span>
                        <button onClick={() => deleteMonthEntry(entry.dateKey, entry.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}