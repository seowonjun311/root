import React, { useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth } from 'date-fns';

const STORAGE_KEY = 'daily_diary_v1';

const WEATHER_OPTIONS = ['☀️', '⛅', '🌥️', '🌧️', '⛈️', '❄️', '🌫️', '🌈'];
const MOOD_OPTIONS = ['😄', '😊', '😐', '😔', '😢', '😤', '😰', '🥰'];

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
  const [draftWeather, setDraftWeather] = useState('');
  const [draftMood, setDraftMood] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [showCalModal, setShowCalModal] = useState(false);
  const [calMonth, setCalMonth] = useState(() => new Date(dateKey + 'T00:00:00'));
  const [selectedCalDay, setSelectedCalDay] = useState(null);

  const todayEntry = diaries[dateKey] || {};
  const todayText = typeof todayEntry === 'string' ? todayEntry : (todayEntry.text || '');
  const todayWeather = typeof todayEntry === 'string' ? '' : (todayEntry.weather || '');
  const todayMood = typeof todayEntry === 'string' ? '' : (todayEntry.mood || '');

  const openEdit = () => {
    setDraft(todayText);
    setDraftWeather(todayWeather);
    setDraftMood(todayMood);
    setEditing(true);
  };

  const save = () => {
    const next = { ...diaries, [dateKey]: { text: draft, weather: draftWeather, mood: draftMood } };
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

  const datesWithDiary = new Set(
    Object.keys(diaries).filter(k => {
      const e = diaries[k];
      return typeof e === 'string' ? e.trim() : e?.text?.trim();
    })
  );

  const getEntry = (dk) => {
    const e = diaries[dk];
    if (!e) return { text: '', weather: '', mood: '' };
    if (typeof e === 'string') return { text: e, weather: '', mood: '' };
    return e;
  };

  const selectedEntry = selectedCalDay ? getEntry(selectedCalDay) : null;

  const dateLabel = (() => {
    try {
      const d = new Date(dateKey + 'T00:00:00');
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      return `${format(d, 'yyyy년 M월 d일')} (${dayNames[d.getDay()]})`;
    } catch { return dateKey; }
  })();

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
            {todayText ? '수정' : '작성'}
          </button>
        </div>
      </div>

      {/* 일기 내용 */}
      {todayText ? (
        <div
          onClick={openEdit}
          className="rounded-xl px-4 py-3 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #f5e6c8 0%, #eedcb0 40%, #e8d4a0 70%, #f0e0bc 100%)',
            border: '1.5px solid #c4a55a',
            boxShadow: 'inset 0 1px 3px rgba(255,240,180,0.6), 0 2px 6px rgba(80,50,10,0.15)',
          }}
        >
          {(todayWeather || todayMood) && (
            <div className="flex items-center gap-2 mb-2">
              {todayWeather && <span className="text-lg">{todayWeather}</span>}
              {todayMood && <span className="text-lg">{todayMood}</span>}
            </div>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#4a2c08' }}>{todayText}</p>
        </div>
      ) : (
        <div
          onClick={openEdit}
          className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border rounded-xl cursor-pointer hover:bg-secondary/20 transition-colors"
        >
          오늘의 이야기를 작성해보세요
        </div>
      )}

      {/* 작성/수정 모달 — 양피지 스타일 */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-3" onClick={() => { setEditing(false); setKeyboardHeight(0); }}>
          <div
            className="w-full rounded-2xl overflow-hidden max-h-[80dvh] overflow-y-auto"
            style={{
              marginBottom: keyboardHeight > 0 ? keyboardHeight : 0,
              background: 'linear-gradient(160deg, #f5e6c8 0%, #eedcb0 35%, #e8d0a0 70%, #f0e0bc 100%)',
              border: '2px solid #a07840',
              boxShadow: 'inset 0 1px 4px rgba(255,240,180,0.7), inset 0 -1px 3px rgba(120,80,20,0.2), 0 6px 20px rgba(60,30,5,0.35)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* 양피지 상단 장식 */}
            <div className="px-4 pt-4 pb-2 border-b" style={{ borderColor: '#c4a55a' }}>
              <p className="text-xs font-bold mb-0.5" style={{ color: '#7a4e1a' }}>{dateLabel}</p>
              <p className="text-base font-bold" style={{ color: '#4a2c08' }}>📖 오늘의 이야기</p>
            </div>

            <div className="px-4 py-3">
              {/* 날씨 선택 */}
              <div className="mb-3">
                <p className="text-[11px] font-bold mb-1.5" style={{ color: '#7a4e1a' }}>오늘 날씨</p>
                <div className="flex gap-1.5 flex-wrap">
                  {WEATHER_OPTIONS.map(w => (
                    <button
                      key={w}
                      onClick={() => setDraftWeather(draftWeather === w ? '' : w)}
                      className="text-xl rounded-lg p-1.5 transition-all"
                      style={{
                        background: draftWeather === w ? 'rgba(160,100,40,0.25)' : 'rgba(255,255,255,0.4)',
                        border: draftWeather === w ? '1.5px solid #a07840' : '1.5px solid transparent',
                      }}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* 감정 선택 */}
              <div className="mb-3">
                <p className="text-[11px] font-bold mb-1.5" style={{ color: '#7a4e1a' }}>오늘 기분</p>
                <div className="flex gap-1.5 flex-wrap">
                  {MOOD_OPTIONS.map(m => (
                    <button
                      key={m}
                      onClick={() => setDraftMood(draftMood === m ? '' : m)}
                      className="text-xl rounded-lg p-1.5 transition-all"
                      style={{
                        background: draftMood === m ? 'rgba(160,100,40,0.25)' : 'rgba(255,255,255,0.4)',
                        border: draftMood === m ? '1.5px solid #a07840' : '1.5px solid transparent',
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* 텍스트 입력 — 줄 배경으로 노트 느낌 */}
              <textarea
                autoFocus
                value={draft}
                onFocus={() => {
                  if (window.visualViewport) setKeyboardHeight(Math.max(280, window.innerHeight - window.visualViewport.height));
                  else setKeyboardHeight(300);
                }}
                onChange={e => setDraft(e.target.value)}
                rows={5}
                placeholder="오늘 하루를 자유롭게 기록해보세요..."
                className="w-full p-3 rounded-lg text-sm outline-none resize-none mb-3"
                style={{
                  background: 'rgba(255,255,255,0.45)',
                  border: '1px solid #c4a55a',
                  color: '#3a2008',
                  lineHeight: '1.8',
                  backgroundImage: 'repeating-linear-gradient(transparent, transparent calc(1.8em - 1px), rgba(160,120,60,0.2) calc(1.8em - 1px), rgba(160,120,60,0.2) 1.8em)',
                }}
              />

              <div className="flex gap-2">
                <button
                  onClick={save}
                  className="flex-1 p-3 rounded-lg font-bold text-sm"
                  style={{ background: 'linear-gradient(180deg, #c49a4a 0%, #a07830 100%)', color: '#fff8e8', border: '1.5px solid #6b4e15' }}
                >
                  저장
                </button>
                <button
                  onClick={() => { setEditing(false); setKeyboardHeight(0); }}
                  className="flex-1 p-3 rounded-lg font-semibold text-sm"
                  style={{ background: 'rgba(255,255,255,0.5)', color: '#4a2c08', border: '1.5px solid #c4a55a' }}
                >
                  취소
                </button>
              </div>
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
                const entry = getEntry(dk);
                return (
                  <button key={dk} onClick={() => setSelectedCalDay(isSelected ? null : dk)}
                    className={`flex flex-col items-center justify-center rounded-lg py-1.5 transition-colors
                      ${isSelected ? 'bg-primary text-primary-foreground' : isToday ? 'bg-amber-100 text-amber-800' : inMonth ? 'hover:bg-secondary text-foreground' : 'text-muted-foreground/30'}`}>
                    <span className="text-xs font-semibold leading-none">{format(day, 'd')}</span>
                    {hasDiary && entry.mood ? (
                      <span className="text-[10px] leading-none mt-0.5">{entry.mood}</span>
                    ) : hasDiary ? (
                      <span className={`mt-0.5 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />
                    ) : null}
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
                  {selectedEntry?.text ? (
                    <div
                      className="rounded-xl px-4 py-3"
                      style={{
                        background: 'linear-gradient(135deg, #f5e6c8 0%, #eedcb0 60%, #f0e0bc 100%)',
                        border: '1.5px solid #c4a55a',
                      }}
                    >
                      {(selectedEntry.weather || selectedEntry.mood) && (
                        <div className="flex items-center gap-2 mb-2">
                          {selectedEntry.weather && <span className="text-lg">{selectedEntry.weather}</span>}
                          {selectedEntry.mood && <span className="text-lg">{selectedEntry.mood}</span>}
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: '#4a2c08' }}>{selectedEntry.text}</p>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                      이 날의 이야기가 없습니다
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">달력에서 날짜를 탭하면 해당 날의 이야기를 볼 수 있습니다</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}