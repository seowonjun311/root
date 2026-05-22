import React, { useState, useMemo } from 'react';
import { NotebookPen, Plus, Trash2, Pencil } from 'lucide-react';

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

  const todayMemos = useMemo(() =>
    memos.filter(m => m.date === dateKey).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [memos, dateKey]
  );

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

  return (
    <div className="px-4 pb-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <NotebookPen className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">오늘의 메모</span>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          추가
        </button>
      </div>

      {/* 메모 리스트 */}
      {todayMemos.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
          오늘의 메모가 없습니다
        </div>
      ) : (
        <div className="space-y-2">
          {todayMemos.map(memo => (
            <div key={memo.id} className="flex items-start gap-3 bg-secondary/30 rounded-xl px-3 py-2.5">
              <button
                onClick={() => handleToggle(memo.id)}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs transition-colors ${
                  memo.completed ? 'border-green-500 bg-green-500 text-white' : 'border-border bg-background text-transparent'
                }`}
              >
                ✓
              </button>
              <p className={`flex-1 text-sm leading-snug break-words ${memo.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {memo.text}
              </p>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => startEdit(memo)} className="p-1 text-muted-foreground hover:text-foreground">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(memo.id)} className="p-1 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
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