import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* 하단 네비 */}
      <BottomNav />
    </div>
  );
}
