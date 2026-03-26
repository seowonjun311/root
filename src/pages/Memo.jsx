import React, { useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'root_memos_v1';

function loadMemos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMemos(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;

  const month = d.getMonth() + 1;
  const date = d.getDate();
  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const dayName = dayNames[d.getDay()];
  return `${month}월 ${date}일 ${dayName}`;
}

function isToday(dateStr) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return dateStr === `${yyyy}-${mm}-${dd}`;
}

function sortDateAsc(a, b) {
  return new Date(`${a}T00:00:00`) - new Date(`${b}T00:00:00`);
}

function makeId() {
  return `memo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function Memo() {
  const [memos, setMemos] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const todayStr = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [draftDate, setDraftDate] = useState(todayStr);
  const [draftText, setDraftText] = useState('');

  const [editingMemoId, setEditingMemoId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const sectionRefs = useRef({});

  useEffect(() => {
    setMemos(loadMemos());
  }, []);

  useEffect(() => {
    saveMemos(memos);
  }, [memos]);

  const grouped = useMemo(() => {
    const map = {};

    for (const memo of memos) {
      if (!memo?.date) continue;
      if (!map[memo.date]) map[memo.date] = [];
      map[memo.date].push(memo);
    }

    const sortedDates = Object.keys(map).sort(sortDateAsc);

    return sortedDates.map((date) => ({
      date,
      items: map[date].sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return aTime - bTime;
      }),
    }));
  }, [memos]);

  const memoDates = useMemo(() => grouped.map((g) => g.date), [grouped]);

  const handleCreate = () => {
    const lines = draftText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (!draftDate) {
      alert('날짜를 선택해주세요.');
      return;
    }

    if (lines.length === 0) {
      alert('메모 내용을 입력해주세요.');
      return;
    }

    const createdAt = new Date().toISOString();
    const newItems = lines.map((line) => ({
      id: makeId(),
      date: draftDate,
      text: line,
      completed: false,
      createdAt,
    }));

    setMemos((prev) => [...prev, ...newItems]);
    setDraftText('');
    setShowCreateModal(false);

    setTimeout(() => {
      const section = sectionRefs.current[draftDate];
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleToggle = (id) => {
    setMemos((prev) =>
      prev.map((memo) =>
        memo.id === id ? { ...memo, completed: !memo.completed } : memo
      )
    );
  };

  const askDelete = (id) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = () => {
    if (!deleteTargetId) return;
    setMemos((prev) => prev.filter((memo) => memo.id !== deleteTargetId));
    setDeleteTargetId(null);
  };

  const cancelDelete = () => {
    setDeleteTargetId(null);
  };

  const startEdit = (memo) => {
    setEditingMemoId(memo.id);
    setEditingText(memo.text || '');
  };

  const cancelEdit = () => {
    setEditingMemoId(null);
    setEditingText('');
  };

  const saveEdit = () => {
    const nextText = editingText.trim();
    if (!nextText) {
      alert('수정할 내용을 입력해주세요.');
      return;
    }

    setMemos((prev) =>
      prev.map((memo) =>
        memo.id === editingMemoId ? { ...memo, text: nextText } : memo
      )
    );

    setEditingMemoId(null);
    setEditingText('');
  };

  const jumpToDate = (date) => {
    setShowCalendarModal(false);
    setTimeout(() => {
      const section = sectionRefs.current[date];
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  return (
    <div className="min-h-screen bg-[#f8f6ef] text-[#2f2a24] pb-28">
      <div className="sticky top-0 z-20 border-b border-[#e7e0d2] bg-[#f8f6ef]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight">메모</h1>
            <p className="mt-1 text-sm text-[#7a6f63]">
              날짜별로 할 일을 정리해보세요
            </p>
          </div>

          <button
            onClick={() => setShowCalendarModal(true)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#ddd3c2] bg-white text-xl shadow-sm active:scale-[0.98]"
            aria-label="캘린더 열기"
            title="캘린더"
          >
            📅
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pt-4">
        {grouped.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-[#ddd3c2] bg-white px-6 py-12 text-center shadow-sm">
            <div className="text-4xl">📝</div>
            <div className="mt-3 text-lg font-semibold">아직 메모가 없어요</div>
            <div className="mt-2 text-sm text-[#7a6f63]">
              오른쪽 아래 + 버튼으로 날짜별 메모를 추가해보세요
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map((group) => (
              <section
                key={group.date}
                ref={(el) => {
                  sectionRefs.current[group.date] = el;
                }}
                className="rounded-3xl border border-[#e7e0d2] bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-lg font-bold">{formatDateLabel(group.date)}</h2>
                  {isToday(group.date) && (
                    <span className="rounded-full bg-[#fff0c2] px-2 py-1 text-xs font-semibold text-[#8a6500]">
                      오늘
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {group.items.map((memo) => {
                    const isEditing = editingMemoId === memo.id;

                    return (
                      <div
                        key={memo.id}
                        className="rounded-2xl border border-[#f0eadf] bg-[#fcfbf8] px-3 py-3"
                      >
                        {isEditing ? (
                          <div className="space-y-3">
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              rows={3}
                              className="w-full rounded-2xl border border-[#ddd3c2] bg-white px-3 py-3 text-sm outline-none focus:border-[#cbb892]"
                              placeholder="메모를 수정하세요"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={cancelEdit}
                                className="rounded-xl border border-[#ddd3c2] px-4 py-2 text-sm font-medium text-[#6e6458]"
                              >
                                취소
                              </button>
                              <button
                                onClick={saveEdit}
                                className="rounded-xl bg-[#2f2a24] px-4 py-2 text-sm font-semibold text-white"
                              >
                                저장
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handleToggle(memo.id)}
                              className={`mt-[2px] flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm ${
                                memo.completed
                                  ? 'border-[#8dbb7d] bg-[#8dbb7d] text-white'
                                  : 'border-[#cfc4b2] bg-white text-transparent'
                              }`}
                              aria-label={memo.completed ? '체크 해제' : '체크'}
                              title={memo.completed ? '체크 해제' : '체크'}
                            >
                              ✓
                            </button>

                            <div className="min-w-0 flex-1">
                              <div
                                className={`whitespace-pre-wrap break-words text-[15px] leading-6 ${
                                  memo.completed
                                    ? 'text-[#a79b8d] line-through'
                                    : 'text-[#2f2a24]'
                                }`}
                              >
                                {memo.text}
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              <button
                                onClick={() => startEdit(memo)}
                                className="rounded-xl border border-[#ddd3c2] px-3 py-1.5 text-xs font-medium text-[#6e6458]"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => askDelete(memo.id)}
                                className="rounded-xl border border-[#ead2d2] px-3 py-1.5 text-xs font-medium text-[#a14d4d]"
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => {
          setDraftDate(todayStr);
          setDraftText('');
          setShowCreateModal(true);
        }}
        className="fixed bottom-24 right-5 z-30 rounded-full bg-[#2f2a24] px-5 py-3 text-sm font-semibold text-white shadow-lg active:scale-[0.98]"
      >
        + 메모 추가
      </button>

      {showCreateModal && (
        <div className="fixed inset-0 z-[9999] bg-black/40">
          <div className="absolute inset-0 flex items-end justify-center sm:items-center">
            <div className="flex h-[100dvh] w-full flex-col bg-white sm:h-auto sm:max-h-[85vh] sm:max-w-lg sm:rounded-[28px]">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eee5d8] bg-white px-5 py-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl px-2 py-1 text-sm font-medium text-[#7a6f63]"
                >
                  취소
                </button>

                <h3 className="text-lg font-bold">메모 추가</h3>

                <button
                  onClick={handleCreate}
                  className="rounded-xl bg-[#2f2a24] px-4 py-2 text-sm font-semibold text-white"
                >
                  저장
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 pb-8">
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#5f564c]">
                      날짜
                    </label>
                    <input
                      type="date"
                      value={draftDate}
                      onChange={(e) => setDraftDate(e.target.value)}
                      className="w-full rounded-2xl border border-[#ddd3c2] bg-white px-3 py-3 outline-none focus:border-[#cbb892]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#5f564c]">
                      내용
                    </label>
                    <textarea
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      rows={10}
                      className="w-full rounded-2xl border border-[#ddd3c2] bg-white px-3 py-3 text-sm outline-none focus:border-[#cbb892]"
                      placeholder={`한 줄에 하나씩 입력하세요\n예)\n7시 수업 준비\n학부모 상담 전화`}
                    />
                    <p className="mt-2 text-xs text-[#8a7f73]">
                      여러 줄로 입력하면 한 줄마다 하나의 메모로 저장돼요
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleCreate}
                      className="w-full rounded-2xl bg-[#2f2a24] px-4 py-3 text-sm font-semibold text-white"
                    >
                      저장
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCalendarModal && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/35 sm:items-center">
          <div className="w-full max-w-md rounded-t-[28px] bg-white p-5 shadow-2xl sm:rounded-[28px]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">날짜로 보기</h3>
              <button
                onClick={() => setShowCalendarModal(false)}
                className="rounded-xl px-2 py-1 text-sm text-[#7a6f63]"
              >
                닫기
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-[#eee5d8] bg-[#fcfbf8] p-3">
                <div className="mb-2 text-sm font-semibold text-[#5f564c]">
                  날짜 선택
                </div>
                <input
                  type="date"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) return;
                    jumpToDate(value);
                  }}
                  className="w-full rounded-2xl border border-[#ddd3c2] bg-white px-3 py-3 outline-none focus:border-[#cbb892]"
                />
              </div>

              <div>
                <div className="mb-2 text-sm font-semibold text-[#5f564c]">
                  메모가 있는 날짜
                </div>

                {memoDates.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#ddd3c2] px-4 py-6 text-center text-sm text-[#8a7f73]">
                    메모가 있는 날짜가 아직 없어요
                  </div>
                ) : (
                  <div className="max-h-72 space-y-2 overflow-y-auto">
                    {memoDates.map((date) => (
                      <button
                        key={date}
                        onClick={() => jumpToDate(date)}
                        className="flex w-full items-center justify-between rounded-2xl border border-[#eee5d8] bg-[#fcfbf8] px-4 py-3 text-left"
                      >
                        <span className="font-medium">{formatDateLabel(date)}</span>
                        {isToday(date) && (
                          <span className="rounded-full bg-[#fff0c2] px-2 py-1 text-xs font-semibold text-[#8a6500]">
                            오늘
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTargetId && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-5">
          <div className="w-full max-w-sm rounded-[28px] border border-[#eadfcd] bg-[#fffaf2] p-5 shadow-2xl">
            <div className="text-center">
              <div className="text-3xl">🗑️</div>
              <h3 className="mt-3 text-lg font-bold text-[#2f2a24]">메모 삭제</h3>
              <p className="mt-2 text-sm leading-6 text-[#7a6f63]">
                이 메모를 삭제할까요?
                <br />
                삭제하면 다시 되돌릴 수 없어요.
              </p>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={cancelDelete}
                className="flex-1 rounded-2xl border border-[#ddd3c2] bg-white px-4 py-3 text-sm font-medium text-[#6e6458]"
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 rounded-2xl bg-[#8f4a32] px-4 py-3 text-sm font-semibold text-white"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
