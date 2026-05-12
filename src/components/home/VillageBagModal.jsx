import React, { useState, useRef } from 'react';

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { getCharacterImage, getDecorationImage } from '@/lib/villageUtils';
import { SHOP_ITEMS } from '@/lib/villageConstants';

function getRefundPrice(subtype) {
  const shopItem = SHOP_ITEMS.find((i) => i.subtype === subtype);
  return shopItem ? Math.floor(shopItem.price / 2) : 1;
}

export default function VillageBagModal({ open, activeTab, onTabChange, inventoryCharacters, inventoryDecorations, onClose, onPlaceItem, onSellItem }) {
  const items = activeTab === 'character' ? inventoryCharacters : inventoryDecorations;

  const grouped = Object.entries(
    items.reduce((acc, item) => {
      const key = item.subtype;
      if (!acc[key]) acc[key] = { ...item, count: 0, allItems: [] };
      acc[key].count += 1;
      acc[key].allItems.push(item);
      return acc;
    }, {})
  );

  const handleSell = (itemId, refund) => {
    onSellItem(itemId, refund);
  };

  return (
    <>
      <Drawer open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle>내 가방</DrawerTitle>
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

          <div className="px-4 pb-8 overflow-y-auto max-h-96">
            {grouped.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">가방이 비어 있어요.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {grouped.map(([key, item]) => {
                  const img = item.type === 'character'
                    ? getCharacterImage(item.subtype)
                    : getDecorationImage(item.subtype);
                  const refund = getRefundPrice(item.subtype);
                  return (
                    <div
                      key={key}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-2xl relative"
                      style={{ background: '#fff8ee', border: '1.5px solid #e8d5a0' }}
                    >
                      {item.count > 1 && (
                        <div
                          className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                          style={{ background: '#c49a4a', color: '#fff' }}
                        >
                          {item.count}
                        </div>
                      )}
                      <img src={img} alt={item.label} className="w-14 h-14 object-contain" />
                      <div className="text-xs font-bold text-center" style={{ color: '#4a2c08' }}>{item.label}</div>
                      <button
                        onClick={() => onPlaceItem(item)}
                        className="w-full py-1 rounded-xl text-xs font-bold"
                        style={{ background: '#c49a4a', color: '#fff' }}
                      >
                        꺼내기
                      </button>
                      <button
                        onClick={() => handleSell(item.allItems[0].id, refund)}
                        className="w-full py-1 rounded-xl text-xs font-semibold"
                        style={{ background: '#f3ead7', color: '#7a5020', border: '1px solid #d4b870' }}
                      >
                        🪙 {refund}P 환급
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>


    </>
  );
}