import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { ChevronRight, Bell, User, LogOut, Trash2, RefreshCw, Shield, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { usePullToRefreshTabbed } from '../hooks/usePullToRefreshTabbed';
import { motion } from 'framer-motion';
import DeleteAccountDialog from '@/components/settings/DeleteAccountDialog';
import { migrateGuestDataToAccount } from '@/lib/migrateGuestData';
import guestDataPersistence from '@/lib/GuestDataPersistence';

export default function AppSettings() {
  const queryClient = useQueryClient();
  const { triggerHaptic } = useHapticFeedback();
  const [showNickname, setShowNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [showLogout, setShowLogout] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);

  const nicknameUpdateMutation = useMutation({
    mutationFn: (nickname) => base44.auth.updateMe({ nickname: nickname.trim(), nickname_changed_at: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setShowNickname(false);
      toast.success('닉네임이 변경되었습니다.');
    },
    onError: () => toast.error('닉네임 변경에 실패했습니다.'),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => base44.auth.deleteAccount(),
    onSuccess: () => {
      triggerHaptic('impact', 'heavy');
      toast.success('계정이 삭제되었습니다. 감사합니다!');
      setTimeout(() => {
        setShowDelete(false);
        base44.auth.logout('/Onboarding');
      }, 500);
    },
    onError: (error) => {
      const errorMsg = error?.message || '계정 삭제 중 오류가 발생했습니다.';
      setDeleteError(errorMsg);
      toast.error(errorMsg);
    },
  });

  const { pullProgress, onTouchStart: handlePullStart } = usePullToRefreshTabbed(async () => {
    // Pull-to-refresh는 필요시에만 수행 - 자동 리페칭 제거
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const isGuest = !user;

  // 로그인 후 돌아왔을 때 게스트 데이터 마이그레이션
  useEffect(() => {
    if (!user) return;
    const guestData = guestDataPersistence.getData();
    if (!guestData?.onboardingComplete) return;

    const runMigration = async () => {
      setIsMigrating(true);
      try {
        const migrated = await migrateGuestDataToAccount();
        if (migrated) {
          queryClient.invalidateQueries();
          toast.success('기존 기록이 계정에 저장되었어요! 🦊');
        }
      } catch (e) {
        console.warn('Guest data migration failed:', e);
      } finally {
        setIsMigrating(false);
      }
    };

    runMigration();
  }, [user?.email]);

  const handleNicknameChange = () => {
    if (!newNickname.trim()) return;
    nicknameUpdateMutation.mutate(newNickname);
  };

  const handleLogout = () => {
    triggerHaptic('impact', 'heavy');
    base44.auth.logout('/Onboarding');
  };

  const handleDeleteAccount = async () => {
    return new Promise((resolve, reject) => {
      deleteAccountMutation.mutate(undefined, {
        onSuccess: () => resolve(),
        onError: (err) => reject(err),
      });
    });
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
          <p className="font-bold text-lg">{isGuest ? '게스트' : (user?.nickname || '용사')}님</p>
          <p className="text-xs text-muted-foreground">{isGuest ? '로그인하면 기록이 안전하게 저장돼요' : user?.email}</p>
        </div>
      </div>

      {/* 게스트 로그인 배너 */}
      {isGuest && (
        <div className="mx-4 mb-4 p-4 rounded-2xl border-2 border-amber-400/60 bg-amber-50 dark:bg-amber-950/30 flex items-center gap-3">
          <div className="text-2xl">🔐</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-900 dark:text-amber-100">로그인하면 기록이 유지돼요</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">지금까지의 목표와 기록이 계정에 저장됩니다</p>
          </div>
          <Button
            onClick={() => {
              triggerHaptic('impact', 'medium');
              base44.auth.redirectToLogin(window.location.href);
            }}
            className="shrink-0 h-9 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-amber-50 text-sm font-bold"
          >
            로그인
          </Button>
        </div>
      )}

      {isMigrating && (
        <div className="mx-4 mb-4 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 text-center">
          <p className="text-sm text-blue-800 dark:text-blue-200">기존 기록을 계정으로 옮기는 중...</p>
        </div>
      )}

      <div className="mx-4 space-y-1.5">
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
           desc={`현재: ${isGuest ? '게스트' : (user?.nickname || '용사')}님`}
           onClick={() => { setNewNickname(isGuest ? '' : (user?.nickname || '')); setShowNickname(true); }}
         />
         {isGuest ? (
           <SettingItem
             icon={<LogIn className="w-5 h-5 text-amber-600" />}
             label="로그인 / 회원가입"
             desc="기록을 안전하게 저장하고 여러 기기에서 사용"
             onClick={() => {
               triggerHaptic('impact', 'medium');
               base44.auth.redirectToLogin(window.location.href);
             }}
           />
         ) : (
           <SettingItem
             icon={<LogOut className="w-5 h-5 text-amber-600" />}
             label="로그아웃"
             desc="이 기기에서 로그인이 해제됩니다"
             onClick={() => {
               triggerHaptic('impact', 'light');
               setShowLogout(true);
             }}
           />
         )}
         <SettingItem
           icon={<Trash2 className="w-5 h-5 text-red-600" />}
           label="계정 삭제"
           desc="모든 데이터가 영구 삭제됩니다"
           onClick={() => {
             triggerHaptic('impact', 'light');
             setShowDelete(true);
             setDeleteError(null);
           }}
         />
         <Link to="/PrivacyPolicy" className="block">
           <SettingItem
             icon={<Shield className="w-5 h-5 text-amber-600" />}
             label="개인정보처리방침"
             desc="개인정보 수집 및 이용 안내"
           />
         </Link>
       </div>

      {/* Nickname Drawer */}
      <Drawer open={showNickname} onOpenChange={setShowNickname}>
        <DrawerContent role="dialog" aria-modal="true" aria-labelledby="nickname-title">
          <DrawerHeader className="text-center">
            <DrawerTitle id="nickname-title">🦊 닉네임 변경</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 py-2 space-y-2">
            <Input
              id="nickname-input"
              value={newNickname}
              onChange={e => setNewNickname(e.target.value)}
              placeholder="새 닉네임"
              maxLength={12}
              className="h-12 rounded-xl text-center"
              aria-describedby="nickname-helper"
            />
            <p id="nickname-helper" className="text-xs text-muted-foreground text-center">
              닉네임은 변경 후 7일 동안 재변경 불가합니다.
            </p>
          </div>
          <DrawerFooter className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowNickname(false)} className="flex-1 rounded-xl">취소</Button>
            <Button onClick={handleNicknameChange} disabled={nicknameUpdateMutation.isPending} className="flex-1 rounded-xl bg-amber-700 hover:bg-amber-800 text-amber-50">{nicknameUpdateMutation.isPending ? '변경 중...' : '확인'}</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Logout Drawer */}
      <Drawer open={showLogout} onOpenChange={setShowLogout}>
        <DrawerContent role="dialog" aria-modal="true" aria-labelledby="logout-title">
          <DrawerHeader className="text-center">
            <DrawerTitle id="logout-title">로그아웃할까요?</DrawerTitle>
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

          {/* Delete Account Dialog - Multi-step */}
          <DeleteAccountDialog
            open={showDelete}
            onOpenChange={setShowDelete}
            userEmail={user?.email || ''}
            onConfirm={handleDeleteAccount}
            isPending={deleteAccountMutation.isPending}
            onError={setDeleteError}
          />
          </div>
          );
          }

function SettingItem({ icon, label, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/60 hover:bg-secondary/50 transition-colors text-left"
      aria-label={`${label}: ${desc}`}
    >
      {icon}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
    </button>
  );
}