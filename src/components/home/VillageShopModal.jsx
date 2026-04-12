import React from 'react';
import { SHOP_ITEMS } from '@/lib/villageConstants';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

export default function VillageShopModal({ open, activeTab, onTabChange, points, onClose, onBuy }) {
  const items = SHOP_ITEMS.filter((item) =>
    activeTab === 'character' ? item.type === 'character' : item.type === 'decoration'
  );

  return (
    <Drawer open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DrawerContent>
        <DrawerHeader className="text-center">
          <DrawerTitle>마을 상점</DrawerTitle>
          <p className="text-sm text-muted-foreground">보유 포인트: {points} ✦</p>
        </DrawerHeader>

        <div className="flex gap-2 px-4 mb-3">
          {['character', 'decoration'].map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold"
              style={activeTab === tab
                ? { background: '#8b5a20', color: '#fff' }
                : { background: '#f3ead7', color: '#7a5020' }}
            >
              {tab === 'character' ? '캐릭터' : '꾸미기'}
            </button>
          ))}
        </div>

        <div className="px-4 pb-8 grid grid-cols-3 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl"
              style={{ background: '#fff8ee', border: '1.5px solid #e8d5a0' }}
            >
              <img src={item.image} alt={item.label} className="w-14 h-14 object-contain" />
              <div className="text-xs font-bold text-center" style={{ color: '#4a2c08' }}>{item.label}</div>
              <button
                onClick={() => onBuy(item)}
                disabled={points < item.price}
                className="w-full py-1.5 rounded-xl text-xs font-bold"
                style={points >= item.price
                  ? { background: '#c49a4a', color: '#fff' }
                  : { background: '#e5d6b8', color: '#b0a080' }}
              >
                {item.price} ✦
              </button>
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}