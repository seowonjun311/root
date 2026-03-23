import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Camera, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { guestDataPersistence } from '@/lib/GuestDataPersistence';

const CATEGORY_LABELS = {
  exercise: '운동',
  study: '공부',
  mental: '정신',
  daily: '일상',
};

const CATEGORY_EMOJIS = {
  exercise: '🏃',
  study: '📚',
  mental: '🧘',
  daily: '🏠',
};

const CATEGORY_ORDER = ['all', 'exercise', 'study', 'mental', 'daily'];

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function getWeekStartString() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(
    monday.getDate()
  ).padStart(2, '0')}`;
}

function formatMinutes(minutes = 0) {
  const total = Number(minutes) || 0;
  if (total < 60) return `${total}분 기록`;

  const hour = Math.floor(total / 60);
  const minute = total % 60;

  if (minute === 0) return `${hour}시간 기록`;
  return `${hour}시간 ${minute}분 기록`;
}

function getActionTypeLabel(actionType, durationMinutes) {
  if (actionType === 'timer') return formatMinutes(durationMinutes);
  if (actionType === 'abstain') return '오늘 지킴';
  if (actionType === 'one_time') return '1회성 목표 완료';
  return '확인형 완료';
}

function getDateGroupLabel(dateString) {
  const today = getTodayString();

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

  if (dateString === today) return '오늘';
  if (dateString === yesterday) return '어제';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${weekdays[date.getDay()]}`;
}

function sortByDateDesc(items = []) {
  return [...items].sort((a, b) => {
    const aTime = new Date(a?.created_date || a?.date || 0).getTime();
    const bTime = new Date(b?.created_date || b?.date || 0).getTime();
    return bTime - aTime;
  });
}

function buildTimelineItems(logs = [], actionGoals = []) {
  const actionGoalMap = new Map(actionGoals.map((goal) => [goal.id, goal]));

  return sortByDateDesc(logs)
    .filter((log) => log?.completed)
    .map((log) => {
      const linkedActionGoal = actionGoalMap.get(log.action_goal_id);

      const category = log.category || linkedActionGoal?.category || 'daily';
      const actionType =
        log.action_type ||
        linkedActionGoal?.action_type ||
        (log.duration_minutes > 0 ? 'timer' : 'confirm');

      const title =
        log.action_title ||
        linkedActionGoal?.title ||
        linkedActionGoal?.name ||
        '완료한 목표';

      const durationMinutes = Number(log.duration_minutes || linkedActionGoal?.duration_minutes || 0);
      const subtitle = `${CATEGORY_LABELS[category] || '기록'} · ${getActionTypeLabel(
        actionType,
        durationMinutes
      )}`;

      return {
        id: log.id,
        date: log.date,
        category,
        title,
        subtitle,
        actionType,
        durationMinutes,
        photoUrl: log.photo_url || null,
        distanceKm: log.distance_km || null,
        createdDate: log.created_date || log.date,
      };
    });
}

function groupItemsByDate(items = []) {
  const groups = new Map();

  items.forEach((item) => {
    const key = item.date || 'unknown';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });

  return Array.from(groups.entries())
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    .map(([date, records]) => ({
      date,
      label: getDateGroupLabel(date),
      items: records,
    }));
}

function getTopCategory(items = []) {
  const counts = {
    exercise: 0,
    study: 0,
    mental: 0,
    daily: 0,
  };

  items.forEach((item) => {
    if (counts[item.category] !== undefined) {
      counts[item.category] += 1;
    }
  });

  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!top || top[1] === 0) return '없음';
  return CATEGORY_LABELS[top[0]];
}

function SummaryCard({ label, value }) {
  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{
        background: 'linear-gradient(135deg, #f5e6c8 0%, #eedcb0 60%, #f0e0bc 100%)',
        border: '1px solid #d7b97b',
      }}
    >
      <div className="text-[11px] font-semibold" style={{ color: '#9a7b47' }}>
        {label}
      </div>
      <div className="text-lg font-extrabold mt-1" style={{ color: '#4b2d0d' }}>
        {value}
      </div>
    </div>
  );
}

function FilterChip({ active, label, onClick, emoji }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-2 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all"
      style={
        active
          ? {
              background: '#8b5a20',
              color: '#fff',
            }
          : {
              background: '#f3ead7',
              color: '#7a5020',
              border: '1px solid rgba(160,120,64,0.18)',
            }
      }
    >
      <span className="mr-1">{emoji}</span>
      {label}
    </button>
  );
}

function TimelineCard({ item }) {
  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{
        background: '#fffaf0',
        border: '1px solid rgba(160,120,64,0.18)',
        boxShadow: '0 2px 6px rgba(80,50,10,0.06)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background: 'rgba(210,155,56,0.14)',
          }}
        >
          <span className="text-lg">{CATEGORY_EMOJIS[item.category] || '📝'}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold truncate" style={{ color: '#3d2408' }}>
                {item.title}
              </div>
              <div className="text-xs mt-1" style={{ color: '#8f6a33' }}>
                {item.subtitle}
              </div>
            </div>

            <div
              className="px-2 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 shrink-0"
              style={{
                background: 'rgba(76,168,106,0.12)',
                color: '#2f7d4a',
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              완료
            </div>
          </div>

          {(item.photoUrl || item.distanceKm) && (
            <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: '#9a7b47' }}>
              {item.photoUrl && (
                <div className="flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5" />
                  사진 기록 있음
                </div>
              )}

              {item.distanceKm && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {item.distanceKm}km 이동
                </div>
              )}
            </div>
          )}

          {item.photoUrl && (
            <div className="mt-3">
              <img
                src={item.photoUrl}
                alt={item.title}
                className="w-full h-36 object-cover rounded-xl"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onGoHome }) {
  return (
    <div
      className="rounded-3xl px-6 py-10 text-center"
      style={{
        background: 'linear-gradient(135deg, #f5e6c8 0%, #eedcb0 60%, #f0e0bc 100%)',
        border: '1px solid #d7b97b',
      }}
    >
      <div className="text-5xl mb-4">🧭</div>
      <div className="text-lg font-extrabold" style={{ color: '#4b2d0d' }}>
        아직 남겨진 기록이 없어요
      </div>
      <div className="text-sm mt-2 leading-relaxed" style={{ color: '#8f6a33' }}>
        오늘 첫 행동을 완료하면
        <br />
        이곳에 루트가 쌓이기 시작해요
      </div>

      <button
        type="button"
        onClick={onGoHome}
        className="mt-5 h-11 px-5 rounded-2xl text-sm font-bold"
        style={{
          background: '#8b5a20',
          color: '#fff',
        }}
      >
        홈으로 가기
      </button>
    </div>
  );
}

export default function Timeline() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const isGuest = !isUserLoading && !user;

  const { data: allLogs = [], isLoading: isLogsLoading } = useQuery({
    queryKey: ['timelineLogs', isGuest],
    enabled: !isUserLoading,
    staleTime: 1000 * 15,
    queryFn: async () => {
      if (isGuest) {
        const guestData = guestDataPersistence.loadOnboardingData();
        return ensureArray(guestData?.actionLogs);
      }

      const logs = await base44.entities.ActionLog.list('-created_date', 500);
      return ensureArray(logs);
    },
  });

  const { data: allActionGoals = [], isLoading: isActionGoalsLoading } = useQuery({
    queryKey: ['timelineActionGoals', isGuest],
    enabled: !isUserLoading,
    staleTime: 1000 * 60,
    queryFn: async () => {
      if (isGuest) {
        const guestData = guestDataPersistence.loadOnboardingData();
        return ensureArray(guestData?.actionGoals);
      }

      const goals = await base44.entities.ActionGoal.list('-created_date', 500);
      return ensureArray(goals);
    },
  });

  const timelineItems = useMemo(() => {
    return buildTimelineItems(allLogs, allActionGoals);
  }, [allLogs, allActionGoals]);

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return timelineItems;
    return timelineItems.filter((item) => item.category === activeFilter);
  }, [timelineItems, activeFilter]);

  const groupedItems = useMemo(() => {
    return groupItemsByDate(filteredItems);
  }, [filteredItems]);

  const summary = useMemo(() => {
    const totalCount = timelineItems.length;
    const weekStart = getWeekStartString();
    const weeklyCount = timelineItems.filter((item) => item.date >= weekStart).length;
    const topCategory = getTopCategory(timelineItems);

    return { totalCount, weeklyCount, topCategory };
  }, [timelineItems]);

  const isLoading = isUserLoading || isLogsLoading || isActionGoalsLoading;

  return (
    <div className="bg-background min-h-screen max-w-lg mx-auto">
      <div
        className="sticky top-0 z-20 px-4 pt-3 pb-3 backdrop-blur"
        style={{ background: 'rgba(255,251,243,0.94)' }}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/Home')}
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{
              background: '#fffaf0',
              border: '1px solid rgba(160,120,64,0.18)',
              color: '#7a5020',
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="text-lg font-extrabold" style={{ color: '#3d2408' }}>
              기록 타임라인
            </div>
            <div className="text-xs" style={{ color: '#8f6a33' }}>
              지금까지 걸어온 루트를 모아봤어요
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-8">
        {isLoading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="h-20 rounded-2xl bg-secondary/60 animate-pulse" />
              <div className="h-20 rounded-2xl bg-secondary/60 animate-pulse" />
              <div className="h-20 rounded-2xl bg-secondary/60 animate-pulse" />
            </div>
            <div className="h-12 rounded-2xl bg-secondary/60 animate-pulse" />
            <div className="h-24 rounded-2xl bg-secondary/60 animate-pulse" />
            <div className="h-24 rounded-2xl bg-secondary/60 animate-pulse" />
          </div>
        ) : timelineItems.length === 0 ? (
          <EmptyState onGoHome={() => navigate('/Home')} />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <SummaryCard label="총 완료" value={`${summary.totalCount}개`} />
              <SummaryCard label="이번 주" value={`${summary.weeklyCount}개`} />
              <SummaryCard label="가장 많이 한 것" value={summary.topCategory} />
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <div className="flex gap-2 pb-1">
                {CATEGORY_ORDER.map((key) => (
                  <FilterChip
                    key={key}
                    active={activeFilter === key}
                    label={key === 'all' ? '전체' : CATEGORY_LABELS[key]}
                    emoji={key === 'all' ? '✨' : CATEGORY_EMOJIS[key]}
                    onClick={() => setActiveFilter(key)}
                  />
                ))}
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div
                className="rounded-2xl px-4 py-8 text-center"
                style={{
                  background: '#fffaf0',
                  border: '1px solid rgba(160,120,64,0.18)',
                }}
              >
                <div className="text-sm font-bold" style={{ color: '#4b2d0d' }}>
                  이 카테고리의 기록이 아직 없어요
                </div>
                <div className="text-xs mt-2" style={{ color: '#8f6a33' }}>
                  다른 카테고리를 보거나 오늘 행동을 완료해보세요
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {groupedItems.map((group) => (
                  <section key={group.date} className="space-y-2">
                    <div className="px-1 text-sm font-extrabold" style={{ color: '#7a5020' }}>
                      {group.label}
                    </div>

                    <div className="space-y-2">
                      {group.items.map((item) => (
                        <TimelineCard key={item.id} item={item} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
