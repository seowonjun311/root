import React, { useState, useMemo } from 'react';
import { NotebookPen, Plus, Trash2, Pencil, CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday as dateFnsIsToday, isAfter, startOfDay, parseISO } from 'date-fns';

const STORAGE_KEY = 'root_memos_v1';

function loadMemos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveMemos(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function makeId() {
  return `memo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function DailyMemo({ dateKey }) {
  const [memos, setMemos] = useState(() => loadMemos());
  const [showForm, setShowForm] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // 달력 모달
  const [showCalModal, setShowCalModal] = useState(false);
  const [calMonth, setCalMonth] = useState(() => new Date());
  const [selectedCalDay, setSelectedCalDay] = useState(null);

  const todayMemos = useMemo(() =>
    memos.filter(m => m.date === dateKey).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [memos, dateKey]
  );

  // 미래 할 일 (오늘 이후 날짜의 미완료 메모)
  const futureMemos = useMemo(() => {
    const today = startOfDay(new Date());
    return memos
      .filter(m => {
        try {
          const d = startOfDay(parseISO(m.date));
          return isAfter(d, today) && !m.completed;
        } catch { return false; }
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [memos]);

  // 과거 미완료 메모 (오늘 포함 이전 날짜, 미완료)
  const pastIncompleteMemos = useMemo(() => {
    const today = startOfDay(new Date());
    return memos
      .filter(m => {
        try {
          const d = startOfDay(parseISO(m.date));
          return !isAfter(d, today) && !m.completed && m.date !== format(today, 'yyyy-MM-dd');
        } catch { return false; }
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [memos]);

  // 달력 날짜 그리드
  const calDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(calMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(calMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [calMonth]);

  // 날짜별 메모 dot 표시
  const datesWithMemos = useMemo(() => {
    const set = new Set();
    memos.forEach(m => { if (m.date) set.add(m.date); });
    return set;
  }, [memos]);

  // 선택된 날의 메모
  const selectedDayMemos = useMemo(() => {
    if (!selectedCalDay) return [];
    return memos.filter(m => m.date === selectedCalDay).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [memos, selectedCalDay]);

  const update = (next) => { setMemos(next); saveMemos(next); };

  const handleCreate = () => {
    const lines = draftText.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    const now = new Date().toISOString();
    const newItems = lines.map(line => ({ id: makeId(), date: dateKey, text: line, completed: false, createdAt: now }));
    update([...memos, ...newItems]);
    setDraftText('');
    setShowForm(false);
    setKeyboardHeight(0);
  };

  const handleToggle = (id) => {
    update(memos.map(m => m.id === id ? { ...m, completed: !m.completed } : m));
  };

  const handleDelete = (id) => {
    update(memos.filter(m => m.id !== id));
  };

  const startEdit = (memo) => { setEditingId(memo.id); setEditingText(memo.text); };
  const saveEdit = () => {
    if (!editingText.trim()) return;
    update(memos.map(m => m.id === editingId ? { ...m, text: editingText.trim() } : m));
    setEditingId(null);
    setEditingText('');
  };

  const onFocus = () => {
    if (window.visualViewport) {
      setKeyboardHeight(Math.max(280, window.innerHeight - window.visualViewport.height));
    } else {
      setKeyboardHeight(300);
    }
  };

  const MemoItem = ({ memo, onToggle, onEdit, onDelete }) => (
    <div className="flex items-start gap-3 bg-secondary/30 rounded-xl px-3 py-2.5">
      <button
        onClick={() => onToggle(memo.id)}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs transition-colors ${
          memo.completed ? 'border-green-500 bg-green-500 text-white' : 'border-border bg-background text-transparent'
        }`}
      >✓</button>
      <p className={`flex-1 text-sm leading-snug break-words ${memo.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
        {memo.text}
      </p>
      <div className="flex gap-1 shrink-0">
        {onEdit && <button onClick={() => onEdit(memo)} className="p-1 text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>}
        <button onClick={() => onDelete(memo.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );

  return (
    <div className="px-4 pb-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <NotebookPen className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">오늘의 메모</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCalMonth(new Date()); setSelectedCalDay(null); setShowCalModal(true); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-semibold"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            달력
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            추가
          </button>
        </div>
      </div>

      {/* 메모 리스트 */}
      {todayMemos.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
          오늘의 메모가 없습니다
        </div>
      ) : (
        <div className="space-y-2">
          {todayMemos.map(memo => (
            <MemoItem key={memo.id} memo={memo} onToggle={handleToggle} onEdit={startEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* 달력 모달 */}
      {showCalModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowCalModal(false)}>
          <div className="w-full bg-background rounded-t-2xl max-h-[92dvh] overflow-y-auto pb-24" onClick={e => e.stopPropagation()}>

            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-base font-bold text-foreground">{format(calMonth, 'yyyy년 M월')}</span>
              <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
              <button onClick={() => setShowCalModal(false)} className="p-2 rounded-lg hover:bg-secondary transition-colors ml-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 미래 할 일 */}
            {futureMemos.length > 0 && (
              <div className="px-4 mb-3">
                <p className="text-xs font-bold text-muted-foreground mb-2">📌 예정된 할 일</p>
                <div className="space-y-1.5">
                  {futureMemos.map(memo => (
                    <div key={memo.id} className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 rounded-xl px-3 py-2">
                      <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 shrink-0 w-10">
                        {format(parseISO(memo.date), 'M/d')}
                      </span>
                      <p className="flex-1 text-xs text-foreground truncate">{memo.text}</p>
                      <button onClick={() => handleDelete(memo.id)} className="p-0.5 text-muted-foreground hover:text-destructive shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 px-4">
              {['일','월','화','수','목','금','토'].map(d => (
                <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-1">{d}</div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 px-4" style={{ rowGap: '1px' }}>
              {calDays.map(day => {
                const dk = format(day, 'yyyy-MM-dd');
                const inMonth = isSameMonth(day, calMonth);
                const isSelected = selectedCalDay === dk;
                const isToday = dateFnsIsToday(day);
                const hasMemos = datesWithMemos.has(dk);
                return (
                  <button key={dk} onClick={() => setSelectedCalDay(isSelected ? null : dk)}
                    className={`flex flex-col items-center justify-center rounded-lg py-1.5 transition-colors
                      ${isSelected ? 'bg-primary text-primary-foreground' : isToday ? 'bg-amber-100 text-amber-800' : inMonth ? 'hover:bg-secondary text-foreground' : 'text-muted-foreground/30'}`}>
                    <span className="text-xs font-semibold leading-none">{format(day, 'd')}</span>
                    {hasMemos && (
                      <span className={`mt-0.5 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* 구분선 */}
            <div className="border-t border-border/50 mx-4 mt-3 mb-0" />

            {/* 선택된 날 메모 */}
            <div className="px-4 pt-3 pb-4">
              {selectedCalDay ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-foreground">
                      {format(parseISO(selectedCalDay), 'M월 d일')} 메모
                    </p>
                    <button onClick={() => setSelectedCalDay(null)} className="text-[11px] text-primary font-semibold">전체 보기</button>
                  </div>
                  {selectedDayMemos.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border rounded-xl">메모가 없습니다</div>
                  ) : (
                    <div className="space-y-2">
                      {selectedDayMemos.map(memo => (
                        <MemoItem key={memo.id} memo={memo} onToggle={handleToggle} onEdit={null} onDelete={handleDelete} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-foreground mb-2">날짜를 선택하세요</p>
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    달력에서 날짜를 탭하면 해당 날의 메모를 볼 수 있습니다
                  </div>
                </>
              )}

              {/* 과거 미완료 메모 */}
              {pastIncompleteMemos.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-muted-foreground mb-2">⚠️ 미완료 항목</p>
                  <div className="space-y-1.5">
                    {pastIncompleteMemos.map(memo => (
                      <div key={memo.id} className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 rounded-xl px-3 py-2">
                        <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 shrink-0 w-10">
                          {format(parseISO(memo.date), 'M/d')}
                        </span>
                        <p className="flex-1 text-xs text-foreground truncate">{memo.text}</p>
                        <button onClick={() => handleToggle(memo.id)} className="text-[10px] text-green-600 font-semibold shrink-0 px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/40">완료</button>
                        <button onClick={() => handleDelete(memo.id)} className="p-0.5 text-muted-foreground hover:text-destructive shrink-0">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 추가 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => { setShowForm(false); setKeyboardHeight(0); }}>
          <div
            className="bg-background rounded-2xl p-4 pb-6 absolute left-4 right-4"
            style={{ bottom: keyboardHeight + 16 }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm font-bold text-foreground mb-3">메모 추가</p>
            <textarea
              autoFocus
              value={draftText}
              onFocus={onFocus}
              onChange={e => setDraftText(e.target.value)}
              rows={4}
              placeholder={`한 줄에 하나씩 입력하세요\n여러 줄 입력 시 각각 저장됩니다`}
              className="w-full p-3 rounded-lg border border-border bg-background text-foreground text-sm mb-3 outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <div className="flex gap-2">
              <button onClick={handleCreate} className="flex-1 p-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm">저장</button>
              <button onClick={() => { setShowForm(false); setKeyboardHeight(0); }} className="flex-1 p-3 rounded-lg bg-secondary text-foreground font-semibold text-sm">취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setEditingId(null)}>
          <div className="bg-background rounded-2xl p-4 pb-6 absolute left-4 right-4 bottom-16" onClick={e => e.stopPropagation()}>
            <p className="text-sm font-bold text-foreground mb-3">메모 수정</p>
            <textarea
              autoFocus
              value={editingText}
              onChange={e => setEditingText(e.target.value)}
              rows={4}
              className="w-full p-3 rounded-lg border border-border bg-background text-foreground text-sm mb-3 outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <div className="flex gap-2">
              <button onClick={saveEdit} className="flex-1 p-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm">저장</button>
              <button onClick={() => setEditingId(null)} className="flex-1 p-3 rounded-lg bg-secondary text-foreground font-semibold text-sm">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}