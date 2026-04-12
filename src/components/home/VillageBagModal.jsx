import React from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { getCharacterImage, getDecorationImage } from '@/lib/villageUtils';

export default function VillageBagModal({ open, activeTab, onTabChange, inventoryCharacters, inventoryDecorations, onClose, onPlaceItem }) {
  const items = activeTab === 'character' ? inventoryCharacters : inventoryDecorations;

  return (
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

        <div className="px-4 pb-8">
          {items.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">가방이 비어 있어요.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {items.map((item) => {
                const img = item.type === 'character'
                  ? getCharacterImage(item.subtype)
                  : getDecorationImage(item.subtype);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl"
                    style={{ background: '#fff8ee', border: '1.5px solid #e8d5a0' }}
                  >
                    <img src={img} alt={item.label} className="w-14 h-14 object-contain" />
                    <div className="text-xs font-bold text-center" style={{ color: '#4a2c08' }}>{item.label}</div>
                    <button
                      onClick={() => onPlaceItem(item)}
                      className="w-full py-1.5 rounded-xl text-xs font-bold"
                      style={{ background: '#c49a4a', color: '#fff' }}
                    >
                      꺼내기
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}