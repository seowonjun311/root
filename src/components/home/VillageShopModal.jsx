import React, { useState } from 'react';
import { SHOP_THEMES } from '@/lib/villageConstants';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

export default function VillageShopModal({ open, onClose, points, onBuy }) {
  const [activeTheme, setActiveTheme] = useState(SHOP_THEMES[0].id);

  const theme = SHOP_THEMES.find((t) => t.id === activeTheme) || SHOP_THEMES[0];
  const items = theme.items;

  return (
    <Drawer open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DrawerContent>
        <DrawerHeader className="text-center pb-0">
          <DrawerTitle>마을 상점</DrawerTitle>
          <p className="text-sm text-muted-foreground">보유 포인트: {points} ✦</p>
        </DrawerHeader>

        {/* 테마 탭 */}
        <div className="px-4 pt-3 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {SHOP_THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTheme(t.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap"
              style={activeTheme === t.id
                ? { background: '#8b5a20', color: '#fff' }
                : { background: '#f3ead7', color: '#7a5020' }}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* 아이템 그리드 */}
        <div className="px-4 pb-8 grid grid-cols-3 gap-3 overflow-y-auto max-h-72">
          {items.length === 0 ? (
            <div className="col-span-3 text-center py-8 text-sm" style={{ color: '#a08060' }}>
              이 테마에 해당하는 아이템이 없어요
            </div>
          ) : (
            items.map((item) => (
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
            ))
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}