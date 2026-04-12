import React from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

export default function TitleUnlockModal({ title, onClose, onEquip }) {
  if (!title) return null;

  return (
    <Drawer open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DrawerContent>
        <DrawerHeader className="text-center">
          <div className="text-4xl mb-2">🏅</div>
          <DrawerTitle>칭호 획득!</DrawerTitle>
          <p className="text-base font-bold mt-1" style={{ color: '#8b5a20' }}>"{title.name}"</p>
          <p className="text-sm text-muted-foreground mt-1">{title.description}</p>
        </DrawerHeader>
        <DrawerFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">닫기</Button>
          <Button onClick={onEquip} className="flex-1 rounded-xl" style={{ background: '#8b5a20', color: '#fff' }}>
            대표 칭호로 설정
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}