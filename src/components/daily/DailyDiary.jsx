import React, { useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth } from 'date-fns';

const STORAGE_KEY = 'daily_diary_v1';

function loadDiaries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveDiaries(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export default function DailyDiary({ dateKey }) {
  const [diaries, setDiaries] = useState(() => loadDiaries());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [showCalModal, setShowCalModal] = useState(false);
  const [calMonth, setCalMonth] = useState(() => new Date(dateKey + 'T00:00:00'));
  const [selectedCalDay, setSelectedCalDay] = useState(null);

  const todayEntry = diaries[dateKey] || '';

  const openEdit = () => {
    setDraft(todayEntry);
    setEditing(true);
  };

  const save = () => {
    const next = { ...diaries, [dateKey]: draft };
    setDiaries(next);
    saveDiaries(next);
    setEditing(false);
    setKeyboardHeight(0);
  };

  const calDays = (() => {
    const start = startOfWeek(startOfMonth(calMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(calMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  })();

  const datesWithDiary = new Set(Object.keys(diaries).filter(k => diaries[k]?.trim()));

  const selectedEntry = selectedCalDay ? (diaries[selectedCalDay] || '') : '';

  return (
    <div className="px-4 pb-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">오늘의 이야기</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCalMonth(new Date(dateKey + 'T00:00:00')); setSelectedCalDay(null); setShowCalModal(true); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-semibold"
          >
            달력
          </button>
          <button
            onClick={openEdit}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold"
          >
            {todayEntry ? '수정' : '작성'}
          </button>
        </div>
      </div>

      {/* 일기 내용 */}
      {todayEntry ? (
        <div
          onClick={openEdit}
          className="bg-secondary/30 rounded-xl px-4 py-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed cursor-pointer"
        >
          {todayEntry}
        </div>
      ) : (
        <div
          onClick={openEdit}
          className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border rounded-xl cursor-pointer hover:bg-secondary/20 transition-colors"
        >
          오늘의 이야기를 작성해보세요
        </div>
      )}

      {/* 작성/수정 모달 */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => { setEditing(false); setKeyboardHeight(0); }}>
          <div
            className="bg-background rounded-2xl p-4 pb-6 absolute left-4 right-4"
            style={{ bottom: keyboardHeight > 0 ? keyboardHeight : 80 }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm font-bold text-foreground mb-3">📖 오늘의 이야기</p>
            <textarea
              autoFocus
              value={draft}
              onFocus={() => {
                if (window.visualViewport) setKeyboardHeight(Math.max(280, window.innerHeight - window.visualViewport.height));
                else setKeyboardHeight(300);
              }}
              onChange={e => setDraft(e.target.value)}
              rows={6}
              placeholder="오늘의 이야기를 기록해보세요..."
              className="w-full p-3 rounded-lg border border-border bg-background text-foreground text-sm mb-3 outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <div className="flex gap-2">
              <button onClick={save} className="flex-1 p-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm">저장</button>
              <button onClick={() => { setEditing(false); setKeyboardHeight(0); }} className="flex-1 p-3 rounded-lg bg-secondary text-foreground font-semibold text-sm">취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 달력 모달 */}
      {showCalModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowCalModal(false)}>
          <div className="w-full bg-background rounded-t-2xl max-h-[85dvh] overflow-y-auto pb-16" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} className="p-2 rounded-lg hover:bg-secondary">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-base font-bold text-foreground">{format(calMonth, 'yyyy년 M월')}</span>
              <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} className="p-2 rounded-lg hover:bg-secondary">
                <ChevronRight className="w-5 h-5" />
              </button>
              <button onClick={() => setShowCalModal(false)} className="p-2 rounded-lg hover:bg-secondary ml-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 px-4">
              {['일','월','화','수','목','금','토'].map(d => (
                <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 px-4" style={{ rowGap: '1px' }}>
              {calDays.map(day => {
                const dk = format(day, 'yyyy-MM-dd');
                const inMonth = isSameMonth(day, calMonth);
                const isSelected = selectedCalDay === dk;
                const isToday = dk === format(new Date(), 'yyyy-MM-dd');
                const hasDiary = datesWithDiary.has(dk);
                return (
                  <button key={dk} onClick={() => setSelectedCalDay(isSelected ? null : dk)}
                    className={`flex flex-col items-center justify-center rounded-lg py-1.5 transition-colors
                      ${isSelected ? 'bg-primary text-primary-foreground' : isToday ? 'bg-amber-100 text-amber-800' : inMonth ? 'hover:bg-secondary text-foreground' : 'text-muted-foreground/30'}`}>
                    <span className="text-xs font-semibold leading-none">{format(day, 'd')}</span>
                    {hasDiary && (
                      <span className={`mt-0.5 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-border/50 mx-4 mt-3 mb-0" />

            <div className="px-4 pt-3 pb-4">
              {selectedCalDay ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-foreground">
                      {format(new Date(selectedCalDay + 'T00:00:00'), 'M월 d일')} 이야기
                    </p>
                    <button onClick={() => setSelectedCalDay(null)} className="text-[11px] text-primary font-semibold">전체 보기</button>
                  </div>
                  {selectedEntry ? (
                    <div className="bg-secondary/30 rounded-xl px-4 py-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {selectedEntry}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                      이 날의 이야기가 없습니다
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">달력에서 날짜를 탭하면 해당 날의 일기를 볼 수 있습니다</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}