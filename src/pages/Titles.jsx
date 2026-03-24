import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { guestDataPersistence } from '@/lib/GuestDataPersistence';
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

const GUEST_TITLES_KEY = 'root_guest_titles';
const GUEST_EQUIPPED_TITLE_KEY = 'root_guest_equipped_title';

function getGuestTitlesFromLocal() {
  try {
    const parsed = JSON.parse(localStorage.getItem(GUEST_TITLES_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getGuestEquippedFromLocal() {
  return localStorage.getItem(GUEST_EQUIPPED_TITLE_KEY) || '';
}

export default function Titles() {
  const queryClient = useQueryClient();
  const [guestVersion, setGuestVersion] = useState(0);

  useEffect(() => {
    const handle = () => setGuestVersion((v) => v + 1);
    window.addEventListener('root-home-data-updated', handle);
    return () => window.removeEventListener('root-home-data-updated', handle);
  }, []);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 0,
  });

  const { data: guestData = {} } = useQuery({
    queryKey: ['guest-home-data', guestVersion],
    queryFn: () => guestDataPersistence.loadOnboardingData(),
    staleTime: 0,
  });

  const localGuestTitles = useMemo(() => {
    const fromGuestData = Array.isArray(guestData?.titles) ? guestData.titles : [];
    const fromLocal = getGuestTitlesFromLocal();
    return Array.from(new Set([...fromGuestData, ...fromLocal]));
  }, [guestData, guestVersion]);

  // 핵심: 로컬 게스트 칭호가 하나라도 있으면 그걸 최우선으로 사용
  const ownedTitles = useMemo(() => {
    if (localGuestTitles.length > 0) return localGuestTitles;
    return Array.isArray(user?.titles) ? user.titles : [];
  }, [localGuestTitles, user]);

  const equippedTitleId = useMemo(() => {
    const localEquipped = guestData?.equipped_title || getGuestEquippedFromLocal();
    if (localGuestTitles.length > 0) return localEquipped;
    return user?.equipped_title || localEquipped || '';
  }, [guestData, guestVersion, localGuestTitles, user]);

  const handleEquip = async (title) => {
    // 로컬 게스트 칭호가 있으면 무조건 로컬 장착으로 처리
    if (localGuestTitles.length > 0) {
      localStorage.setItem(GUEST_EQUIPPED_TITLE_KEY, title.id);
      guestDataPersistence.saveData('equipped_title', title.id);
      window.dispatchEvent(new Event('root-home-data-updated'));
      toast.success(`"${title.name}" 장착`);
      return;
    }

    try {
      await base44.auth.updateMe({ equipped_title: title.id });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success(`"${title.name}" 장착`);
    } catch (error) {
      console.error(error);
      toast.error('칭호 장착에 실패했어요.');
    }
  };

  const grouped = useMemo(() => {
    const map = {
      common: [],
      exercise: [],
      study: [],
      mental: [],
      daily: [],
    };

    TITLES.forEach((t) => {
      map[t.category].push(t);
    });

    return map;
  }, []);

  return (
    <div className="min-h-full px-4 py-4 space-y-6">
      <div className="rounded-2xl p-4 bg-yellow-50 border">
        <div className="text-sm mb-2 font-bold">대표 칭호</div>
        <div className="text-lg font-extrabold">
          {TITLES.find((t) => t.id === equippedTitleId)?.name || '없음'}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          보유 칭호 {ownedTitles.length}개
        </div>
      </div>

      {Object.keys(grouped).map((category) => (
        <div key={category}>
          <div className="text-sm font-bold mb-2">{CATEGORY_LABELS[category]}</div>

          <div className="grid grid-cols-2 gap-2">
            {grouped[category].map((title) => {
              const owned = ownedTitles.includes(title.id);
              const equipped = equippedTitleId === title.id;

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
