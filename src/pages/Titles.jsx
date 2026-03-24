import React, { useEffect, useMemo, useState } from 'react';
import guestDataPersistence from '@/lib/GuestDataPersistence';
import { toast } from 'sonner';

const TITLES = [
  { id: 'common_first_step', name: '첫 걸음을 뗀 자', description: '첫 행동목표를 완료한 용사', category: 'common' },
  { id: 'common_route_walker', name: '루트를 걷는 자', description: '전체 행동목표 100회 달성', category: 'common' },

  { id: 'exercise_001', name: '몸을 깨운 자', description: '운동 행동목표 10회 달성', category: 'exercise' },
  { id: 'exercise_002', name: '꾸준함의 전사', description: '운동 행동목표 50회 달성', category: 'exercise' },
  { id: 'exercise_003', name: '바람을 걷는 자', description: '러닝 거리 50km 누적', category: 'exercise' },
  { id: 'exercise_004', name: '운동의 장인', description: '운동 행동목표 200회 달성', category: 'exercise' },

  { id: 'study_001', name: '집중 입문자', description: '공부 10시간 누적', category: 'study' },
  { id: 'study_002', name: '집중 수련생', description: '공부 30시간 누적', category: 'study' },
  { id: 'study_003', name: '몰입의 실천가', description: '공부 100시간 누적', category: 'study' },
  { id: 'study_004', name: '집중의 장인', description: '공부 300시간 누적', category: 'study' },

  { id: 'mental_001', name: '마음을 들여다본 자', description: '정신 행동목표 10회 달성', category: 'mental' },
  { id: 'mental_002', name: '유혹 저항가', description: '금연/금주 7일 누적', category: 'mental' },
  { id: 'mental_003', name: '절제의 기사', description: '금연/금주 30일 누적', category: 'mental' },
  { id: 'mental_004', name: '내면의 관리자', description: '정신 행동목표 100회 달성', category: 'mental' },

  { id: 'daily_001', name: '하루를 시작한 자', description: '일상 행동목표 5회 달성', category: 'daily' },
  { id: 'daily_002', name: '생활의 입문자', description: '일상 행동목표 30회 달성', category: 'daily' },
  { id: 'daily_003', name: '생활의 관리자', description: '일상 행동목표 100회 달성', category: 'daily' },
  { id: 'daily_004', name: '삶을 다듬는 자', description: '일상 행동목표 200회 달성', category: 'daily' },
];

const CATEGORY_LABELS = {
  common: '전체',
  exercise: '운동',
  study: '공부',
  mental: '정신',
  daily: '일상',
};

export default function Titles() {
  const [guestData, setGuestData] = useState(() => guestDataPersistence.getData());

  useEffect(() => {
    const sync = () => {
      setGuestData(guestDataPersistence.getData());
    };

    sync();

    const unsubscribe = guestDataPersistence.subscribe((latest) => {
      setGuestData(latest);
    });

    return unsubscribe;
  }, []);

  const ownedTitleIds = useMemo(() => {
    return Array.isArray(guestData?.titles) ? guestData.titles : [];
  }, [guestData]);

  const resolvedEquippedTitleId = useMemo(() => {
    const equipped = typeof guestData?.equipped_title === 'string'
      ? guestData.equipped_title
      : '';

    if (equipped && ownedTitleIds.includes(equipped)) {
      return equipped;
    }

    return ownedTitleIds[0] || '';
  }, [guestData, ownedTitleIds]);

  useEffect(() => {
    if (!ownedTitleIds.length) return;

    const equipped = typeof guestData?.equipped_title === 'string'
      ? guestData.equipped_title
      : '';

    if (!equipped || !ownedTitleIds.includes(equipped)) {
      const fixed = guestDataPersistence.updateData((prev) => ({
        ...prev,
        equipped_title: ownedTitleIds[0] || '',
      }));
      setGuestData(fixed);
    }
  }, [guestData, ownedTitleIds]);

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

  const handleEquip = (title) => {
    if (!ownedTitleIds.includes(title.id)) return;

    const next = guestDataPersistence.updateData((prev) => ({
      ...prev,
      equipped_title: title.id,
    }));

    setGuestData(next);
    toast.success(`"${title.name}" 장착`);
  };

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
