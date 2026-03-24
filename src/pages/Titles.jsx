import React, { useEffect, useMemo, useState } from 'react';
import guestDataPersistence from '../lib/GuestDataPersistence';

function resolveHallOfFameTitle(data) {
  const titles = Array.isArray(data?.titles) ? data.titles : [];
  const equipped =
    typeof data?.equipped_title === 'string' ? data.equipped_title : '';

  if (equipped && titles.includes(equipped)) {
    return equipped;
  }

  return titles[0] || '';
}

export default function Titles() {
  const [guestData, setGuestData] = useState(() => guestDataPersistence.getData());

  useEffect(() => {
    const sync = () => {
      const latest = guestDataPersistence.getData();
      setGuestData(latest);
    };

    sync();

    const unsubscribe = guestDataPersistence.subscribe((latest) => {
      setGuestData(latest);
    });

    return unsubscribe;
  }, []);

  const ownedTitles = useMemo(() => {
    return Array.isArray(guestData?.titles) ? guestData.titles : [];
  }, [guestData]);

  const hallOfFameTitle = useMemo(() => {
    return resolveHallOfFameTitle(guestData);
  }, [guestData]);

  useEffect(() => {
    if (!ownedTitles.length) return;

    const equipped =
      typeof guestData?.equipped_title === 'string'
        ? guestData.equipped_title
        : '';

    if (!equipped || !ownedTitles.includes(equipped)) {
      const fixed = guestDataPersistence.ensureEquippedTitle();
      setGuestData(fixed);
    }
  }, [ownedTitles, guestData]);

  const handleEquip = (title) => {
    const next = guestDataPersistence.equipTitle(title);
    setGuestData(next);
  };

  return (
    <div className="min-h-screen bg-[#f8f6f0] px-4 py-5">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="rounded-3xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-100 p-5 shadow-sm">
          <div className="mb-2 text-xs font-semibold tracking-wider text-amber-700">
            명예의 전당
          </div>

          {hallOfFameTitle ? (
            <>
              <div className="text-2xl font-extrabold text-gray-900">
                {hallOfFameTitle}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                현재 장착된 대표 칭호입니다.
              </div>
            </>
          ) : (
            <>
              <div className="text-xl font-bold text-gray-500">없음</div>
              <div className="mt-2 text-sm text-gray-500">
                아직 획득한 칭호가 없습니다.
              </div>
            </>
          )}
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">내 칭호</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              총 {ownedTitles.length}개
            </span>
          </div>

          {ownedTitles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              아직 획득한 칭호가 없어요.
            </div>
          ) : (
            <div className="space-y-3">
              {ownedTitles.map((title) => {
                const isEquipped = hallOfFameTitle === title;

                return (
                  <div
                    key={title}
                    className={`rounded-2xl border px-4 py-4 transition ${
                      isEquipped
                        ? 'border-amber-300 bg-amber-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-base font-bold text-gray-900">
                          {title}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {isEquipped ? '현재 대표 칭호' : '획득한 칭호'}
                        </div>
                      </div>

                      <button
                        onClick={() => handleEquip(title)}
                        className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                          isEquipped
                            ? 'bg-amber-500 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {isEquipped ? '장착중' : '대표로 설정'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
