import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import guestDataPersistence from '@/lib/GuestDataPersistence';
import { toast } from 'sonner';

const TITLES = [
  { id: 'common_first_step', name: '첫 걸음을 뗀 자', description: '첫 행동목표를 완료한 용사', metric: 'total_actions', value: 1, category: 'common' },
  { id: 'common_route_walker', name: '루트를 걷는 자', description: '전체 행동목표 100회 달성', metric: 'total_actions', value: 100, category: 'common' },

  { id: 'exercise_001', name: '몸을 깨운 자', description: '운동 행동목표 10회 달성', metric: 'total_exercise_count', value: 10, category: 'exercise' },
  { id: 'exercise_002', name: '꾸준함의 전사', description: '운동 행동목표 50회 달성', metric: 'total_exercise_count', value: 50, category: 'exercise' },
  { id: 'exercise_003', name: '바람을 걷는 자', description: '러닝 거리 50km 누적', metric: 'total_running_km', value: 50, category: 'exercise' },
  { id: 'exercise_004', name: '운동의 장인', description: '운동 행동목표 200회 달성', metric: 'total_exercise_count', value: 200, category: 'exercise' },

  { id: 'study_001', name: '집중 입문자', description: '공부 10시간 누적', metric: 'total_study_minutes', value: 600, category: 'study' },
  { id: 'study_002', name: '집중 수련생', description: '공부 30시간 누적', metric: 'total_study_minutes', value: 1800, category: 'study' },
  { id: 'study_003', name: '몰입의 실천가', description: '공부 100시간 누적', metric: 'total_study_minutes', value: 6000, category: 'study' },
  { id: 'study_004', name: '집중의 장인', description: '공부 300시간 누적', metric: 'total_study_minutes', value: 18000, category: 'study' },

  { id: 'mental_001', name: '마음을 들여다본 자', description: '정신 행동목표 10회 달성', metric: 'total_mental_count', value: 10, category: 'mental' },
  { id: 'mental_002', name: '유혹 저항가', description: '금연/금주 7일 누적', metric: 'total_no_smoking_days', value: 7, category: 'mental' },
  { id: 'mental_003', name: '절제의 기사', description: '금연/금주 30일 누적', metric: 'total_no_smoking_days', value: 30, category: 'mental' },
  { id: 'mental_004', name: '내면의 관리자', description: '정신 행동목표 100회 달성', metric: 'total_mental_count', value: 100, category: 'mental' },

  { id: 'daily_001', name: '하루를 시작한 자', description: '일상 행동목표 5회 달성', metric: 'total_daily_count', value: 5, category: 'daily' },
  { id: 'daily_002', name: '생활의 입문자', description: '일상 행동목표 30회 달성', metric: 'total_daily_count', value: 30, category: 'daily' },
  { id: 'daily_003', name: '생활의 관리자', description: '일상 행동목표 100회 달성', metric: 'total_daily_count', value: 100, category: 'daily' },
  { id: 'daily_004', name: '삶을 다듬는 자', description: '일상 행동목표 200회 달성', metric: 'total_daily_count', value: 200, category: 'daily' },
];

const CATEGORY_LABELS = {
  common: '전체',
  exercise: '운동',
  study: '공부',
  mental: '정신',
  daily: '일상',
};

export default function Titles() {
  const queryClient = useQueryClient();
  const [guestData, setGuestData] = useState(() => guestDataPersistence.getData());

  useEffect(() => {
    const sync = () => {
      setGuestData(guestDataPersistence.getData());
    };

    sync();

    const unsubscribe = guestDataPersistence.subscribe((latest) => {
      setGuestData(latest);
    });

    const handleServerUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    };

    window.addEventListener('root-home-data-updated', handleServerUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('root-home-data-updated', handleServerUpdate);
    };
  }, [queryClient]);

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 0,
  });

  const isGuest = !user;

  const ownedTitleIds = useMemo(() => {
    if (isGuest) {
      return Array.isArray(guestData?.titles) ? guestData.titles : [];
    }
    return Array.isArray(user?.titles) ? user.titles : [];
  }, [isGuest, guestData, user]);

  const resolvedEquippedTitleId = useMemo(() => {
    const rawEquipped = isGuest
      ? (typeof guestData?.equipped_title === 'string' ? guestData.equipped_title : '')
      : (typeof user?.equipped_title === 'string' ? user.equipped_title : '');

    if (rawEquipped && ownedTitleIds.includes(rawEquipped)) {
      return rawEquipped;
    }

    return ownedTitleIds[0] || '';
  }, [isGuest, guestData, user, ownedTitleIds]);

  useEffect(() => {
    if (!ownedTitleIds.length) return;

    if (isGuest) {
      const current = typeof guestData?.equipped_title === 'string' ? guestData.equipped_title : '';

      if (!current || !ownedTitleIds.includes(current)) {
        const fixed = guestDataPersistence.updateData((prev) => ({
          ...prev,
          equipped_title: ownedTitleIds[0] || '',
        }));
        setGuestData(fixed);
      }
      return;
    }

    if (!user) return;

    const current = typeof user?.equipped_title === 'string' ? user.equipped_title : '';
    if (!current || !ownedTitleIds.includes(current)) {
      base44.auth
        .updateMe({ equipped_title: ownedTitleIds[0] || '' })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['me'] });
        })
        .catch((error) => {
          console.error('대표 칭호 자동 보정 실패:', error);
        });
    }
  }, [isGuest, guestData, user, ownedTitleIds, queryClient]);

  const equippedTitle = useMemo(() => {
    return TITLES.find((title) => title.id === resolvedEquippedTitleId) || null;
  }, [resolvedEquippedTitleId]);

  const grouped = useMemo(() => {
    const map = {
      common: [],
      exercise: [],
      study: [],
      mental: [],
      daily: [],
    };

    TITLES.forEach((title) => {
      map[title.category].push(title);
    });

    return map;
  }, []);

  const handleEquip = async (title) => {
    if (!ownedTitleIds.includes(title.id)) return;

    if (isGuest) {
      try {
        const next = guestDataPersistence.updateData((prev) => ({
          ...prev,
          equipped_title: title.id,
        }));
        setGuestData(next);
        toast.success(`"${title.name}" 장착`);
      } catch (error) {
        console.error(error);
        toast.error('칭호 장착에 실패했어요.');
      }
      return;
    }

    try {
      await base44.auth.updateMe({ equipped_title: title.id });
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success(`"${title.name}" 장착`);
    } catch (error) {
      console.error(error);
      toast.error('칭호 장착에 실패했어요.');
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-full px-4 py-4 space-y-4">
        <div className="h-24 rounded-2xl bg-secondary/60 animate-pulse" />
        <div className="h-40 rounded-2xl bg-secondary/60 animate-pulse" />
        <div className="h-40 rounded-2xl bg-secondary/60 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-full px-4 py-4 space-y-6">
      <div className="rounded-2xl p-4 bg-yellow-50 border">
        <div className="text-sm mb-2 font-bold">명예의 전당</div>
        <div className="text-lg font-extrabold">
          {equippedTitle?.name || '없음'}
        </div>
        {equippedTitle?.description ? (
          <div className="text-xs text-gray-600 mt-1">
            {equippedTitle.description}
          </div>
        ) : null}
        <div className="text-xs text-gray-500 mt-2">
          보유 칭호 {ownedTitleIds.length}개
        </div>
      </div>

      {Object.keys(grouped).map((category) => (
        <div key={category}>
          <div className="text-sm font-bold mb-2">{CATEGORY_LABELS[category]}</div>

          <div className="grid grid-cols-2 gap-2">
            {grouped[category].map((title) => {
              const owned = ownedTitleIds.includes(title.id);
              const equipped = resolvedEquippedTitleId === title.id;

              return (
                <div
                  key={title.id}
                  className={`p-3 rounded-xl border text-sm ${
                    owned ? 'bg-white' : 'bg-gray-100 opacity-50'
                  }`}
                >
                  <div className="font-bold">{title.name}</div>
                  <div className="text-xs mb-2">{title.description}</div>

                  {owned ? (
                    <button
                      onClick={() => handleEquip(title)}
                      className="text-xs px-2 py-1 rounded bg-yellow-400"
                    >
                      {equipped ? '장착됨' : '장착'}
                    </button>
                  ) : (
                    <div className="text-xs">🔒 잠금</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}