import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { ChevronRight, Bell, User, LogOut, Trash2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { usePullToRefreshTabbed } from '../hooks/usePullToRefreshTabbed';
import { motion } from 'framer-motion';

export default function AppSettings() {
  const queryClient = useQueryClient();
  const [showNickname, setShowNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [showLogout, setShowLogout] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { pullProgress, onTouchStart: handlePullStart } = usePullToRefreshTabbed(async () => {
    await queryClient.invalidateQueries({ queryKey: ['me'] });
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const handleNicknameChange = async () => {
    if (!newNickname.trim()) return;
    await base44.auth.updateMe({ nickname: newNickname.trim(), nickname_changed_at: new Date().toISOString() });
    queryClient.invalidateQueries({ queryKey: ['me'] });
    setShowNickname(false);
    toast.success('닉네임이 변경되었습니다.');
  };

  const handleLogout = () => {
    base44.auth.logout('/Onboarding');
  };

  const handleDeleteAccount = async () => {
    try {
      await base44.auth.deleteAccount();
      toast.success('계정이 삭제되었습니다.');
      base44.auth.logout('/Onboarding');
    } catch (error) {
      toast.error('계정 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-background" onTouchStart={handlePullStart}>
      <motion.div
        className="fixed top-12 left-0 right-0 flex justify-center pt-2 z-50 pointer-events-none"
        animate={{ opacity: pullProgress > 0 ? 1 : 0 }}
      >
        <motion.div animate={{ rotate: pullProgress * 360 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
          <RefreshCw className="w-5 h-5 text-amber-600" />
        </motion.div>
      </motion.div>

      <div className="p-6 pb-3">
        <h1 className="text-xl font-bold text-amber-900 flex items-center gap-2">
          🏠 홈
        </h1>
      </div>

      {/* Character area */}
      <div className="mx-4 mb-4 p-5 rounded-2xl bg-card border border-border/60 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-200/80 border-2 border-amber-400/50 flex items-center justify-center text-3xl">
          🦊
        </div>
        <div>
          <p className="font-bold text-lg">{user?.nickname || '용사'}님</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="mx-4 space-y-2">
        <Link to="/NotificationSettings" className="block">
          <SettingItem
            icon={<Bell className="w-5 h-5 text-amber-600" />}
            label="알림 설정"
            desc="알림 시간과 요일을 설정합니다"
          />
        </Link>
        <SettingItem
          icon={<User className="w-5 h-5 text-amber-600" />}
          label="닉네임 변경"
          desc={`현재: ${user?.nickname || '용사'}님`}
          onClick={() => { setNewNickname(user?.nickname || ''); setShowNickname(true); }}
        />
        <SettingItem
          icon={<LogOut className="w-5 h-5 text-amber-600" />}
          label="로그아웃"
          desc="이 기기에서 로그인이 해제됩니다"
          onClick={() => setShowLogout(true)}
        />
        <SettingItem
          icon={<Trash2 className="w-5 h-5 text-red-600" />}
          label="계정 삭제"
          desc="모든 데이터가 영구 삭제됩니다"
          onClick={() => setShowDelete(true)}
        />
      </div>

      {/* Nickname Drawer */}
      <Drawer open={showNickname} onOpenChange={setShowNickname}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle>🦊 닉네임 변경</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 py-2 space-y-2">
            <Input
              value={newNickname}
              onChange={e => setNewNickname(e.target.value)}
              placeholder="새 닉네임"
              maxLength={12}
              className="h-12 rounded-xl text-center"
            />
            <p className="text-xs text-muted-foreground text-center">
              닉네임은 변경 후 7일 동안 재변경 불가합니다.
            </p>
          </div>
          <DrawerFooter className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowNickname(false)} className="flex-1 rounded-xl">취소</Button>
            <Button onClick={handleNicknameChange} className="flex-1 rounded-xl bg-amber-700 hover:bg-amber-800 text-amber-50">확인</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Logout Drawer */}
      <Drawer open={showLogout} onOpenChange={setShowLogout}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle>로그아웃할까요?</DrawerTitle>
          </DrawerHeader>
          <p className="px-4 text-sm text-muted-foreground text-center">
            이 기기에서는 로그인이 해제됩니다.<br />
            기록은 계정에 안전하게 저장됩니다.
          </p>
          <DrawerFooter className="flex gap-2 pt-6">
            <Button variant="outline" onClick={() => setShowLogout(false)} className="flex-1 rounded-xl">취소</Button>
            <Button onClick={handleLogout} className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white">로그아웃</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete Account Drawer */}
      <Drawer open={showDelete} onOpenChange={setShowDelete}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle className="text-red-600">⚠️ 계정을 삭제할까요?</DrawerTitle>
          </DrawerHeader>
          <p className="px-4 text-sm text-muted-foreground text-center">
            이 작업은 되돌릴 수 없습니다.<br />
            모든 기록과 데이터가 영구적으로 삭제됩니다.
          </p>
          <DrawerFooter className="flex gap-2 pt-6">
            <Button variant="outline" onClick={() => setShowDelete(false)} className="flex-1 rounded-xl">취소</Button>
            <Button onClick={handleDeleteAccount} className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white">삭제</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function SettingItem({ icon, label, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/60 hover:bg-secondary/50 transition-colors text-left"
    >
      {icon}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );
}