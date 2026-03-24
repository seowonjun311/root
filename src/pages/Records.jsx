import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import  guestDataPersistence  from '@/lib/GuestDataPersistence';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BarChart3, Clock, Target, Flame, RefreshCw } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import GPSMapPreview from '@/components/home/GPSMapPreview';
import ImageWithBlurUp from '@/components/ImageWithBlurUp';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useLazyLoadImage } from '../hooks/useLazyLoadImage';
import { motion } from 'framer-motion';

const CAT_LABELS = {
  exercise: '운동',
  study: '공부',
  mental: '정신',
  daily: '일상',
};

const CAT_EMOJIS = {
  exercise: '🏃',
  study: '📚',
  mental: '🧘',
  daily: '🏠',
};

const TITLE_META_MAP = {
  common_first_step: {
    title: '첫 걸음을 뗀 자',
    description: '첫 행동목표 완료',
    category: 'common',
  },
  common_route_walker: {
    title: '루트를 걷는 자',
    description: '행동 100회',
    category: 'common',
  },

  exercise_001: {
    title: '몸을 깨운 자',
    description: '운동 10회',
    category: 'exercise',
  },
  exercise_002: {
    title: '꾸준함의 전사',
    description: '운동 50회',
    category: 'exercise',
  },
  exercise_003: {
    title: '바람을 걷는 자',
    description: '러닝 거리 50km 누적',
    category: 'exercise',
  },
  exercise_004: {
    title: '운동의 장인',
    description: '운동 행동목표 200회 달성',
    category: 'exercise',
  },

  study_001: {
    title: '집중 입문자',
    description: '공부 10시간 누적',
    category: 'study',
  },
  study_002: {
    title: '집중 수련생',
    description: '공부 30시간 누적',
    category: 'study',
  },
  study_003: {
    title: '몰입의 실천가',
    description: '공부 100시간 누적',
    category: 'study',
  },
  study_004: {
    title: '집중의 장인',
    description: '공부 300시간 누적',
    category: 'study',
  },

  mental_001: {
    title: '마음을 들여다본 자',
    description: '정신 행동목표 10회 달성',
    category: 'mental',
  },
  mental_002: {
    title: '유혹 저항가',
    description: '금연/금주 7일 누적',
    category: 'mental',
  },
  mental_003: {
    title: '절제의 기사',
    description: '금연/금주 30일 누적',
    category: 'mental',
  },
  mental_004: {
    title: '내면의 관리자',
    description: '정신 행동목표 100회 달성',
    category: 'mental',
  },

  daily_001: {
    title: '하루를 시작한 자',
    description: '일상 행동목표 5회 달성',
    category: 'daily',
  },
  daily_002: {
    title: '생활의 입문자',
    description: '일상 행동목표 30회 달성',
    category: 'daily',
  },
  daily_003: {
    title: '생활의 관리자',
    description: '일상 행동목표 100회 달성',
    category: 'daily',
  },
  daily_004: {
    title: '삶을 다듬는 자',
    description: '일상 행동목표 200회 달성',
    category: 'daily',
  },
};

function safeParseArray(value, fallback = []) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function CategoryFilter({ value, onChange }) {
  const items = [
    { id: 'all', label: '전체', emoji: '✨' },
    { id: 'exercise', label: '운동', emoji: '🏃' },
    { id: 'study', label: '공부', emoji: '📚' },
    { id: 'mental', label: '정신', emoji: '🧘' },
    { id: 'daily', label: '일상', emoji: '🏠' },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`shrink-0 px-3 py-2 rounded-xl text-sm font-semibold border transition ${
              active
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-amber-900 border-amber-200'
            }`}
          >
            <span className="mr-1">{item.emoji}</span>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function StatCard({ icon, label, value, onClick, clickable = false }) {
  return (
    <button
      type="button"
      className={`text-left p-4 rounded-2xl bg-card border border-border/60 shadow-sm ${
        clickable
          ? 'cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 active:bg-amber-100/80 active:scale-[0.98] transition-all'
          : ''
      }`}
      onClick={onClick}
    >
      <div className="mb-2">{icon}</div>
      <p className="text-[0.75rem] text-muted-foreground">{label}</p>
      <p className="text-[1.25rem] font-bold text-amber-900">{value}</p>
      {clickable ? <p className="text-[0.625rem] text-amber-500 mt-1">탭하여 보기 →</p> : null}
    </button>
  );
}

function TimelineLogItem({ log, ag, onSelectPhoto }) {
  const { containerRef, isVisible, onLoad } = useLazyLoadImage('1');

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40">
      <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[0.875rem] font-semibold truncate">
          {ag?.title || log.title || log.date}
        </p>
        <p className="text-[0.75rem] text-muted-foreground">
          {log.date}
          {Number(log.duration_minutes) > 0 ? ` · ${log.duration_minutes}분` : ''}
        </p>
        {log.memo ? (
          <p className="text-[0.75rem] text-muted-foreground italic">"{log.memo}"</p>
        ) : null}
      </div>

      {log.photo_url ? (
        <button
          ref={containerRef}
          onClick={() => onSelectPhoto(log)}
          className="shrink-0 active:opacity-70 rounded-lg w-12 h-12 flex items-center justify-center overflow-hidden"
        >
          {isVisible ? (
            <ImageWithBlurUp
              src={log.photo_url}
              alt="수련 사진"
              containerClassName="w-12 h-12"
              className="w-12 h-12 rounded-lg object-cover"
              onLoad={onLoad}
            />
          ) : null}
        </button>
      ) : null}

      <span className="text-xs px-2 py-1 rounded-lg bg-amber-100/80 text-amber-700 shrink-0">
        {CAT_LABELS[log.category] || '기타'}
      </span>
    </div>
  );
}

function AlbumPhotoItem({ log, onSelectPhoto }) {
  const { containerRef, isVisible, onLoad } = useLazyLoadImage('1');

  return (
    <button
      ref={containerRef}
      onClick={() => onSelectPhoto(log)}
      className="aspect-square rounded-xl overflow-hidden relative group active:opacity-80 transition-opacity flex items-center justify-center"
      aria-label={`${log.date} 사진 보기`}
    >
      {isVisible ? (
        <>
          <ImageWithBlurUp
            src={log.photo_url}
            alt={log.date}
            containerClassName="w-full h-full"
            className="w-full h-full object-cover"
            onLoad={onLoad}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
            <span className="text-[10px] text-white font-semibold">{log.date}</span>
          </div>
        </>
      ) : null}
      <span className="absolute top-1 right-1 text-sm" aria-hidden="true">
        {CAT_EMOJIS[log.category] || '✨'}
      </span>
    </button>
  );
}

function AlbumTab({ logs, goals, catFilter, onCatFilterChange, onSelectPhoto }) {
  const filteredLogs = (catFilter === 'all'
    ? logs
    : logs.filter((l) => l.category === catFilter)
  ).filter((l) => l.photo_url);

  const completedGoals = (catFilter === 'all'
    ? goals
    : goals.filter((g) => g.category === catFilter)
  ).filter((g) => g.status === 'completed' && g.achievement_success);

  return (
    <div className="space-y-4">
      <CategoryFilter value={catFilter} onChange={onCatFilterChange} />

      {completedGoals.length > 0 ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/70 border border-amber-200">
          <h3 className="text-sm font-bold text-amber-900 mb-2">🏆 달성한 목표</h3>
          <div className="space-y-2">
            {completedGoals.map((goal) => (
              <div key={goal.id} className="rounded-xl bg-white/70 border border-amber-200 px-3 py-2">
                <p className="text-sm font-semibold text-amber-900">{goal.title}</p>
                <p className="text-xs text-muted-foreground">
                  {goal.end_date || goal.updated_date?.split('T')[0] || '기록됨'}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {filteredLogs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-[1.875rem] mb-3">🖼️</p>
          <p>아직 저장된 사진이 없어요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {filteredLogs.map((log) => (
            <AlbumPhotoItem key={log.id} log={log} onSelectPhoto={onSelectPhoto} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Records() {
  const [catFilter, setCatFilter] = useState('all');
  const [showCompletedGoals, setShowCompletedGoals] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [showDistance, setShowDistance] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [guestVersion, setGuestVersion] = useState(0);

  const queryClient = useQueryClient();

  useEffect(() => {
    const handle = () => setGuestVersion((v) => v + 1);
    window.addEventListener('root-home-data-updated', handle);
    return () => window.removeEventListener('root-home-data-updated', handle);
  }, []);

  const { pullProgress, onTouchStart: handlePullStart } = usePullToRefresh(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['guest-records-data'] }),
      queryClient.invalidateQueries({ queryKey: ['allLogs'] }),
      queryClient.invalidateQueries({ queryKey: ['allGoals'] }),
      queryClient.invalidateQueries({ queryKey: ['actionGoalsAll'] }),
    ]);
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 0,
  });

  const isGuest = !user;

  const { data: guestData = {} } = useQuery({
    queryKey: ['guest-records-data', guestVersion],
    queryFn: () => guestDataPersistence.loadOnboardingData(),
    staleTime: 0,
  });

  const { data: logsFromServer = [] } = useQuery({
    queryKey: ['allLogs'],
    queryFn: () => base44.entities.ActionLog.list('-date', 500).catch(() => []),
  });

  const { data: goalsFromServer = [] } = useQuery({
    queryKey: ['allGoals'],
    queryFn: () => base44.entities.Goal.list('-created_date', 100).catch(() => []),
  });

  const { data: actionGoalsFromServer = [] } = useQuery({
    queryKey: ['actionGoalsAll'],
    queryFn: () => base44.entities.ActionGoal.list('-created_date', 200).catch(() => []),
  });

  const guestLogs = Array.isArray(guestData?.actionLogs) ? guestData.actionLogs : [];
  const guestGoals = Array.isArray(guestData?.goals) ? guestData.goals : [];
  const guestActionGoals = Array.isArray(guestData?.actionGoals) ? guestData.actionGoals : [];
  const guestTitles = Array.isArray(guestData?.titles) ? guestData.titles : [];

  const logs = isGuest ? guestLogs : logsFromServer;
  const goals = isGuest ? guestGoals : goalsFromServer;
  const actionGoals = isGuest ? guestActionGoals : actionGoalsFromServer;

  const filteredLogs =
    catFilter === 'all' ? logs : logs.filter((l) => l.category === catFilter);

  const totalMinutes = filteredLogs.reduce(
    (sum, l) => sum + (Number(l.duration_minutes) || 0),
    0
  );
  const totalHours = Math.round(totalMinutes / 60);
  const totalSessions = filteredLogs.length;
  const totalDistance =
    Math.round(
      filteredLogs.reduce((sum, l) => {
        if (l.gps_enabled && l.distance_km) return sum + Number(l.distance_km);
        return sum;
      }, 0) * 10
    ) / 10;

  const completedGoalsList = goals.filter(
    (g) =>
      (g.status === 'completed' || g.status === 'failed') &&
      (catFilter === 'all' || g.category === catFilter)
  );

  const badges = isGuest
    ? guestTitles.map((id) => ({
        id,
        earned_date: '',
        ...(TITLE_META_MAP[id] || {
          title: id,
          description: '',
          category: 'special',
        }),
      }))
    : (Array.isArray(user?.titles) ? user.titles : []).map((id) => ({
        id,
        earned_date: '',
        ...(TITLE_META_MAP[id] || {
          title: id,
          description: '',
          category: 'special',
        }),
      }));

  const filteredBadges =
    catFilter === 'all'
      ? badges
      : badges.filter((b) => b.category === catFilter);

  const catBreakdown = Object.entries(
    logs.reduce((acc, l) => {
      const cat = l.category || 'exercise';
      acc[cat] = (acc[cat] || 0) + (Number(l.duration_minutes) || 0);
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-full bg-background" onTouchStart={handlePullStart}>
      <motion.div
        className="fixed top-12 left-0 right-0 flex justify-center pt-2 z-50 pointer-events-none"
        animate={{ opacity: pullProgress > 0 ? 1 : 0 }}
      >
        <motion.div
          animate={{ rotate: pullProgress * 360 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <RefreshCw className="w-5 h-5 text-amber-600" />
        </motion.div>
      </motion.div>

      <Drawer open={showBadges} onOpenChange={setShowBadges}>
        <DrawerContent className="max-h-[80vh] overflow-y-auto">
          <DrawerHeader className="text-center">
            <DrawerTitle>🏅 획득한 칭호</DrawerTitle>
          </DrawerHeader>

          {filteredBadges.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-[1.875rem] mb-2">🦊</p>
              <p className="text-[0.875rem]">아직 획득한 칭호가 없어요.</p>
            </div>
          ) : (
            <div className="space-y-4 mt-1 px-4 pb-6">
              {['common', 'exercise', 'study', 'mental', 'daily', 'special'].map((cat) => {
                const catBadges = filteredBadges.filter((b) => b.category === cat);
                if (!catBadges.length) return null;

                const info = {
                  common: { label: '전체', emoji: '✨' },
                  exercise: { label: '운동', emoji: '🏃' },
                  study: { label: '공부', emoji: '📚' },
                  mental: { label: '정신', emoji: '🧘' },
                  daily: { label: '일상', emoji: '🏠' },
                  special: { label: '특별', emoji: '⭐' },
                }[cat];

                return (
                  <div key={cat}>
                    <p className="text-xs font-bold text-amber-800 mb-2">
                      {info.emoji} {info.label} ({catBadges.length}개)
                    </p>
                    <div className="space-y-2">
                      {catBadges.map((b) => (
                        <div
                          key={b.id}
                          className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/60"
                        >
                          <p className="text-[0.875rem] font-semibold text-amber-900">
                            {b.title}
                          </p>
                          {b.description ? (
                            <p className="text-[0.75rem] text-muted-foreground mt-0.5">
                              {b.description}
                            </p>
                          ) : null}
                          {b.earned_date ? (
                            <p className="text-[0.625rem] text-amber-600 mt-1">
                              {b.earned_date}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DrawerContent>
      </Drawer>

      <Drawer open={showSessions} onOpenChange={setShowSessions}>
        <DrawerContent className="max-h-[80vh] overflow-y-auto">
          <DrawerHeader className="text-center">
            <DrawerTitle>🏃 수련 내역 ({filteredLogs.length}회)</DrawerTitle>
          </DrawerHeader>

          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-[1.875rem] mb-2">🦊</p>
              <p className="text-[0.875rem]">아직 수련 기록이 없어요.</p>
            </div>
          ) : (
            <div className="space-y-3 mt-1 px-4 pb-6">
              {filteredLogs.map((log) => {
                const ag = actionGoals.find((a) => a.id === log.action_goal_id);

                return (
                  <button
                    key={log.id}
                    onClick={() => setSelectedPhoto(log)}
                    className="w-full p-3 rounded-xl bg-amber-50/80 border border-amber-200/60 text-left active:bg-amber-200/80 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-[0.875rem] font-semibold text-amber-900">
                        {ag?.title || log.title || '기록'}
                      </p>
                      <span className="text-[0.625rem] px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 font-semibold">
                        {log.date}
                      </span>
                    </div>

                    {log.photo_url ? (
                      <div className="mb-2 rounded-lg overflow-hidden">
                        <ImageWithBlurUp
                          src={log.photo_url}
                          alt="수련 사진"
                          containerClassName="w-full"
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      </div>
                    ) : null}

                    {log.gps_enabled && log.route_coordinates ? (
                      <div className="mb-2 rounded-lg overflow-hidden bg-blue-50 border border-blue-200 h-20">
                        <GPSMapPreview coords={safeParseArray(log.route_coordinates, [])} />
                      </div>
                    ) : null}

                    <div className="flex items-center gap-2">
                      {Number(log.duration_minutes) > 0 ? (
                        <span className="text-[0.75rem] text-muted-foreground">
                          ⏱️ {log.duration_minutes}분
                        </span>
                      ) : null}
                      {log.gps_enabled ? (
                        <span className="text-[0.75rem] text-blue-600">
                          🗺️ {Number(log.distance_km || 0).toFixed(2)}km
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </DrawerContent>
      </Drawer>

      <Drawer open={showCompletedGoals} onOpenChange={setShowCompletedGoals}>
        <DrawerContent className="max-h-[80vh] overflow-y-auto">
          <DrawerHeader className="text-center">
            <DrawerTitle>🏆 완료한 목표</DrawerTitle>
          </DrawerHeader>

          {completedGoalsList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-[1.875rem] mb-2">🦊</p>
              <p className="text-[0.875rem]">아직 완료한 목표가 없어요.</p>
            </div>
          ) : (
            <div className="space-y-5 mt-1 px-4 pb-6">
              {['exercise', 'study', 'mental', 'daily'].map((cat) => {
                const catGoals = completedGoalsList.filter((g) => g.category === cat);
                if (!catGoals.length) return null;

                const info = {
                  exercise: { label: '운동', emoji: '🏃' },
                  study: { label: '공부', emoji: '📚' },
                  mental: { label: '정신', emoji: '🧘' },
                  daily: { label: '일상', emoji: '🏠' },
                }[cat];

                return (
                  <div key={cat}>
                    <p className="text-[0.75rem] font-bold text-amber-800 mb-2">
                      {info.emoji} {info.label} ({catGoals.length}개)
                    </p>
                    <div className="space-y-2">
                      {catGoals.map((g) => (
                        <div
                          key={g.id}
                          className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-300/60"
                        >
                          <p className="text-[0.875rem] font-bold text-amber-900 mb-1">
                            {g.title}
                          </p>
                          <p className="text-[0.75rem] text-muted-foreground mb-1">
                            {g.duration_days}일 도전 · {g.end_date || g.updated_date?.split('T')[0]}
                          </p>
                          {g.result_note ? (
                            <p className="text-[0.75rem] text-amber-800 italic mt-1">
                              "{g.result_note}"
                            </p>
                          ) : null}
                          <span
                            className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              g.achievement_success
                                ? 'bg-green-100 text-green-700'
                                : 'bg-secondary text-muted-foreground'
                            }`}
                          >
                            {g.achievement_success ? '✅ 달성' : '종료'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DrawerContent>
      </Drawer>

      <Drawer open={showDistance} onOpenChange={setShowDistance}>
        <DrawerContent className="max-h-[80vh] overflow-y-auto">
          <DrawerHeader>
            <DrawerTitle className="text-center">🗺️ 이동거리 상세</DrawerTitle>
          </DrawerHeader>

          <div className="space-y-4 mt-2 px-4 pb-6">
            {(() => {
              const distanceLogs = filteredLogs.filter((l) => l.gps_enabled && l.distance_km);

              if (!distanceLogs.length) {
                return (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-[1.875rem] mb-2">🗺️</p>
                    <p className="text-[0.875rem]">저장된 GPS 기록이 없어요.</p>
                  </div>
                );
              }

              const byCategory = {};
              distanceLogs.forEach((log) => {
                const cat = log.category || 'exercise';
                if (!byCategory[cat]) byCategory[cat] = [];
                byCategory[cat].push(log);
              });

              return Object.entries(byCategory).map(([cat, catLogs]) => {
                const catDistance =
                  Math.round(
                    catLogs.reduce((sum, l) => sum + (Number(l.distance_km) || 0), 0) * 10
                  ) / 10;

                return (
                  <div key={cat}>
                    <p className="text-[0.75rem] font-bold text-amber-800 mb-2">
                      {CAT_EMOJIS[cat]} {CAT_LABELS[cat]} - {catDistance}km
                    </p>
                    <div className="space-y-2">
                      {catLogs.map((log) => {
                        const ag = actionGoals.find((a) => a.id === log.action_goal_id);

                        return (
                          <button
                            key={log.id}
                            onClick={() => setSelectedPhoto(log)}
                            className="w-full p-3 rounded-xl bg-amber-50/80 border border-amber-200/60 text-left active:bg-amber-200/80 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="text-[0.875rem] font-semibold text-amber-900">
                                {ag?.title || log.title || '기록'}
                              </p>
                              <span className="text-[0.625rem] px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 font-semibold">
                                {Number(log.distance_km || 0).toFixed(2)}km
                              </span>
                            </div>
                            <span className="text-[0.625rem] text-muted-foreground">
                              {log.date}
                            </span>
                            {log.route_coordinates ? (
                              <div className="mt-2 rounded-lg overflow-hidden bg-blue-50 border border-blue-200 h-16">
                                <GPSMapPreview coords={safeParseArray(log.route_coordinates, [])} />
                              </div>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DrawerContent className="max-h-[90vh] overflow-y-auto">
          <DrawerHeader>
            <DrawerTitle className="text-center text-[0.875rem]">
              {CAT_EMOJIS[selectedPhoto?.category]} {selectedPhoto?.date}
            </DrawerTitle>
          </DrawerHeader>

          {selectedPhoto ? (
            <div className="space-y-3 px-4 pb-6">
              {selectedPhoto.photo_url ? (
                <ImageWithBlurUp
                  src={selectedPhoto.photo_url}
                  alt={selectedPhoto.date}
                  containerClassName="w-full rounded-xl overflow-hidden"
                  className="w-full rounded-xl object-cover max-h-80"
                />
              ) : null}

              {selectedPhoto.gps_enabled && selectedPhoto.route_coordinates ? (
                <div className="rounded-xl overflow-hidden bg-blue-50 border-2 border-blue-200 h-32">
                  <GPSMapPreview coords={safeParseArray(selectedPhoto.route_coordinates, [])} />
                </div>
              ) : null}

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-1 rounded-lg bg-amber-100 text-amber-700 font-semibold">
                  {CAT_LABELS[selectedPhoto.category] || '기타'}
                </span>
                {Number(selectedPhoto.duration_minutes) > 0 ? (
                  <span className="text-xs text-muted-foreground">
                    ⏱️ {selectedPhoto.duration_minutes}분
                  </span>
                ) : null}
                {selectedPhoto.gps_enabled ? (
                  <span className="text-xs text-blue-600">
                    🗺️ {Number(selectedPhoto.distance_km || 0).toFixed(2)}km
                  </span>
                ) : null}
              </div>

              {selectedPhoto.memo ? (
                <p className="text-sm text-amber-800 italic bg-amber-50/80 p-3 rounded-xl">
                  "{selectedPhoto.memo}"
                </p>
              ) : null}
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>

      <div className="p-6 pb-3">
        <h1 className="text-[1.25rem] font-bold text-amber-900">📜 기록의 여정</h1>
      </div>

      <Tabs defaultValue="stats" className="px-4">
        <TabsList className="w-full bg-secondary/60 rounded-xl h-10">
          <TabsTrigger value="stats" className="flex-1 rounded-lg text-[0.75rem]">
            통계
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex-1 rounded-lg text-[0.75rem]">
            타임라인
          </TabsTrigger>
          <TabsTrigger value="album" className="flex-1 rounded-lg text-[0.75rem]">
            여정 앨범
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-4 space-y-4 pb-4">
          <CategoryFilter value={catFilter} onChange={setCatFilter} />

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Clock className="w-5 h-5 text-amber-600" />}
              label="총 수련 시간"
              value={`${totalHours}시간`}
            />
            <StatCard
              icon={<Target className="w-5 h-5 text-amber-600" />}
              label="완료한 목표"
              value={`${completedGoalsList.length}개`}
              onClick={() => setShowCompletedGoals(true)}
              clickable
            />
            <StatCard
              icon={<Flame className="w-5 h-5 text-amber-600" />}
              label="총 수련 횟수"
              value={`${totalSessions}회`}
              onClick={() => setShowSessions(true)}
              clickable
            />
            {(catFilter === 'all' || catFilter === 'exercise') ? (
              <StatCard
                icon={<BarChart3 className="w-5 h-5 text-amber-600" />}
                label="총 이동거리"
                value={`${totalDistance}km`}
                onClick={() => setShowDistance(true)}
                clickable
              />
            ) : null}
            <StatCard
              icon={<BarChart3 className="w-5 h-5 text-amber-600" />}
              label="획득한 칭호"
              value={`${filteredBadges.length}개`}
              onClick={() => setShowBadges(true)}
              clickable
            />
          </div>

          {catFilter === 'all' && catBreakdown.length > 0 ? (
            <div className="p-4 rounded-2xl bg-card border border-border/60">
              <h3 className="font-semibold text-[0.875rem] mb-3">카테고리별 수련 내역</h3>
              <div className="space-y-3">
                {catBreakdown.map(([cat, min]) => {
                  const percent = totalMinutes > 0 ? Math.round((min / totalMinutes) * 100) : 0;
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-[0.875rem] w-12">{CAT_LABELS[cat] || cat}</span>
                      <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-600 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-[0.75rem] text-muted-foreground w-16 text-right">
                        {Math.round(min / 60)}시간 {percent}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="timeline" className="mt-4 space-y-3 pb-4">
          <CategoryFilter value={catFilter} onChange={setCatFilter} />

          {goals
            .filter(
              (g) =>
                g.status === 'completed' &&
                g.achievement_success &&
                (catFilter === 'all' || g.category === catFilter)
            )
            .map((g) => (
              <div
                key={`goal-${g.id}`}
                className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-300/60"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[1rem]" aria-hidden="true">
                    🏆
                  </span>
                  <p className="text-[0.875rem] font-bold text-amber-900">{g.title}</p>
                  <span className="text-[0.75rem] px-2 py-0.5 rounded-full bg-amber-800 text-amber-50 ml-auto font-semibold">
                    {g.end_date || g.updated_date?.split('T')[0]}
                  </span>
                </div>
                {g.result_note ? (
                  <p className="text-[0.75rem] text-amber-900 italic">"{g.result_note}"</p>
                ) : null}
              </div>
            ))}

          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-[1.875rem] mb-3">🦊</p>
              <p>아직 기록이 없습니다.</p>
              <p className="text-[0.875rem]">첫 번째 수련을 시작해 보세요.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const ag = actionGoals.find((a) => a.id === log.action_goal_id);
              return (
                <TimelineLogItem
                  key={log.id}
                  log={log}
                  ag={ag}
                  onSelectPhoto={setSelectedPhoto}
                />
              );
            })
          )}
        </TabsContent>

        <TabsContent value="album" className="mt-4 pb-4">
          <AlbumTab
            logs={logs}
            goals={goals}
            catFilter={catFilter}
            onCatFilterChange={setCatFilter}
            onSelectPhoto={setSelectedPhoto}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
