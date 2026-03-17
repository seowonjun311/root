import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronRight, Bell, User, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function AppSettings() {
  const queryClient = useQueryClient();
  const [showNickname, setShowNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [showLogout, setShowLogout] = useState(false);

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

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 pb-3">
        <h1 className="text-xl font-bold text-amber-900 flex items-center gap-2">
          ⚙️ 설정
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
      </div>

      {/* Nickname Dialog */}
      <Dialog open={showNickname} onOpenChange={setShowNickname}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">🦊 닉네임 변경</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={newNickname}
              onChange={e => setNewNickname(e.target.value)}
              placeholder="새 닉네임"
              maxLength={12}
              className="h-12 rounded-xl text-center"
            />
            <p className="text-xs text-muted-foreground text-center mt-2">
              닉네임은 변경 후 7일 동안 재변경 불가합니다.
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowNickname(false)} className="flex-1 rounded-xl">취소</Button>
            <Button onClick={handleNicknameChange} className="flex-1 rounded-xl bg-amber-700 hover:bg-amber-800 text-amber-50">확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Dialog */}
      <Dialog open={showLogout} onOpenChange={setShowLogout}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">로그아웃할까요?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-center">
            이 기기에서는 로그인이 해제됩니다.<br />
            기록은 계정에 안전하게 저장됩니다.
          </p>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowLogout(false)} className="flex-1 rounded-xl">취소</Button>
            <Button onClick={handleLogout} className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white">로그아웃</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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