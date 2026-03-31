import React from 'react';

export function VillageShopModal({ open, activeTab, onTabChange, points, onClose, onBuy, shopItems }) {
  if (!open) return null;
  const items = shopItems.filter((item) =>
    activeTab === 'character' ? item.type === 'character' : item.type === 'decoration'
  );

  return (
    <div className="fixed inset-0 z-[95] bg-black/45 px-4 py-8">
      <div className="mx-auto w-full max-w-md rounded-[28px] p-4" style={{ background: 'linear-gradient(180deg, #fff7e8 0%, #f7e9cb 100%)', border: '1px solid rgba(160,120,64,0.18)', boxShadow: '0 18px 36px rgba(0,0,0,0.18)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[17px] font-extrabold" style={{ color: '#4a2c08' }}>마을 상점</div>
            <div className="mt-1 text-[12px]" style={{ color: '#8a5a17' }}>보유 포인트 {points}</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1.5 text-[12px] font-extrabold" style={{ background: '#fff', border: '1px solid rgba(160,120,64,0.14)', color: '#4a2c08' }}>닫기</button>
        </div>

        <div className="mt-4 flex gap-2">
          {['character', 'decoration'].map((tab) => (
            <button key={tab} type="button" onClick={() => onTabChange(tab)} className="h-11 flex-1 rounded-2xl text-sm font-extrabold"
              style={{ background: activeTab === tab ? 'linear-gradient(180deg, #c49a4a 0%, #a07830 100%)' : '#fff', color: activeTab === tab ? '#fff8e8' : '#4a2c08', border: activeTab === tab ? '2px solid #6b4e15' : '1px solid rgba(160,120,64,0.14)' }}>
              {tab === 'character' ? '캐릭터' : '꾸미기'}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {items.map((item) => {
            const disabled = points < item.price;
            return (
              <div key={item.id} className="rounded-2xl p-3" style={{ background: '#fffdf8', border: '1px solid rgba(160,120,64,0.14)' }}>
                <div className="flex h-[68px] items-center justify-center">
                  <img src={item.image} alt={item.label} draggable={false} style={{ maxHeight: '64px', maxWidth: '100%', objectFit: 'contain', display: 'block', background: 'transparent', backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }} />
                </div>
                <div className="mt-2 text-[14px] font-extrabold" style={{ color: '#4a2c08' }}>{item.label}</div>
                <div className="text-[12px]" style={{ color: '#8a5a17' }}>{item.price} 포인트</div>
                <button type="button" disabled={disabled} onClick={() => onBuy(item)} className="mt-3 h-10 w-full rounded-2xl text-sm font-extrabold"
                  style={{ background: disabled ? '#ede5d2' : 'linear-gradient(180deg, #c49a4a 0%, #a07830 100%)', color: disabled ? '#9a8f7b' : '#fff8e8', border: disabled ? '1px solid #d4c8b0' : '2px solid #6b4e15' }}>
                  구매
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function VillageBagModal({ open, activeTab, onTabChange, ownedCharacters, ownedDecorations, onClose, onPlaceCharacter, onPlaceDecoration }) {
  if (!open) return null;
  const items = activeTab === 'character' ? ownedCharacters : ownedDecorations;

  return (
    <div className="fixed inset-0 z-[96] bg-black/45 px-4 py-8">
      <div className="mx-auto w-full max-w-md rounded-[28px] p-4" style={{ background: 'linear-gradient(180deg, #fff7e8 0%, #f7e9cb 100%)', border: '1px solid rgba(160,120,64,0.18)', boxShadow: '0 18px 36px rgba(0,0,0,0.18)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[17px] font-extrabold" style={{ color: '#4a2c08' }}>가방</div>
            <div className="mt-1 text-[12px]" style={{ color: '#8a5a17' }}>구매한 아이템을 마을에 배치할 수 있어요</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1.5 text-[12px] font-extrabold" style={{ background: '#fff', border: '1px solid rgba(160,120,64,0.14)', color: '#4a2c08' }}>닫기</button>
        </div>

        <div className="mt-4 flex gap-2">
          {['character', 'decoration'].map((tab) => (
            <button key={tab} type="button" onClick={() => onTabChange(tab)} className="h-11 flex-1 rounded-2xl text-sm font-extrabold"
              style={{ background: activeTab === tab ? 'linear-gradient(180deg, #c49a4a 0%, #a07830 100%)' : '#fff', color: activeTab === tab ? '#fff8e8' : '#4a2c08', border: activeTab === tab ? '2px solid #6b4e15' : '1px solid rgba(160,120,64,0.14)' }}>
              {tab === 'character' ? '내 캐릭터' : '내 꾸미기'}
            </button>
          ))}
        </div>

        <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {items.length === 0 ? (
            <div className="rounded-2xl px-4 py-6 text-center text-sm" style={{ background: '#fffaf0', border: '1px solid rgba(160,120,64,0.16)', color: '#8f6a33' }}>아직 가방에 아이템이 없어요</div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: '#fffdf8', border: '1px solid rgba(160,120,64,0.14)' }}>
                <div className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-white">
                  <img src={item.image} alt={item.label} draggable={false} style={{ maxHeight: '52px', maxWidth: '52px', objectFit: 'contain' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-extrabold" style={{ color: '#4a2c08' }}>{item.label}</div>
                  <div className="mt-1 text-[12px]" style={{ color: '#8a5a17' }}>{item.placed ? '이미 배치됨' : '가방에 보관 중'}</div>
                </div>
                <button type="button" disabled={item.placed} onClick={() => activeTab === 'character' ? onPlaceCharacter(item) : onPlaceDecoration(item)}
                  className="h-10 shrink-0 rounded-2xl px-4 text-sm font-extrabold"
                  style={{ background: item.placed ? '#ede5d2' : 'linear-gradient(180deg, #c49a4a 0%, #a07830 100%)', color: item.placed ? '#9a8f7b' : '#fff8e8', border: item.placed ? '1px solid #d4c8b0' : '2px solid #6b4e15' }}>
                  배치하기
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}