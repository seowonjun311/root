import React, { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function GoalProgress({ goal }) {
  const queryClient = useQueryClient();
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editTitle, setEditTitle] = useState(goal?.title || '');
  const [editDuration, setEditDuration] = useState(goal?.duration_days || 90);
  const [saving, setSaving] = useState(false);

  if (!goal) return null;

  const startDate = new Date(goal.start_date || goal.created_date);
  const totalDays = goal.duration_days || 90;
  const elapsedDays = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const progressPercent = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

  const handleEditOpen = () => {
    setEditTitle(goal.title);
    setEditDuration(goal.duration_days || 90);
    setShowMenu(false);
    setShowEdit(true);
  };

  const handleDeleteOpen = () => {
    setShowMenu(false);
    setShowDelete(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Goal.update(goal.id, { title: editTitle, duration_days: editDuration });
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    toast.success('목표가 수정되었습니다.');
    setShowEdit(false);
    setSaving(false);
  };

  const handleDelete = async () => {
    await base44.entities.Goal.delete(goal.id);
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    toast.success('목표가 삭제되었습니다.');
    setShowDelete(false);
  };

  return (
    <>
      <div className="mx-4 p-4 rounded-2xl bg-card border border-border/60 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚔️</span>
            <span className="text-sm font-semibold text-foreground">{goal.title}</span>
          </div>
          <button
            onClick={() => setShowMenu(true)}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Progress value={progressPercent} className="flex-1 h-2.5 bg-secondary" />
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            {elapsedDays}/{totalDays}일
          </span>
        </div>

        {goal.target_value && (
          <p className="text-xs text-muted-foreground mt-2">
            {totalDays}일 동안 {goal.target_value}{goal.target_unit || ''} 목표
          </p>
        )}
      </div>

      {/* 액션 메뉴 */}
      <Dialog open={showMenu} onOpenChange={setShowMenu}>
        <DialogContent className="max-w-xs rounded-2xl p-4">
          <DialogHeader>
            <DialogTitle className="text-center text-base">목표 관리</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-1">
            <button
              onClick={handleEditOpen}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
            >
              <Pencil className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold">목표 수정</span>
            </button>
            <button
              onClick={handleDeleteOpen}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors text-left"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold text-red-500">목표 삭제</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 수정 다이얼로그 */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">✏️ 목표 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-amber-800 mb-1.5 block">결과 목표</label>
              <Input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-amber-800 mb-1.5 block">기간</label>
              <div className="flex gap-2">
                {[30, 60, 90].map(d => (
                  <button
                    key={d}
                    onClick={() => setEditDuration(d)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      editDuration === d ? 'bg-amber-700 text-amber-50' : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {d}일
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEdit(false)} className="flex-1 rounded-xl">취소</Button>
            <Button
              onClick={handleSave}
              disabled={!editTitle.trim() || saving}
              className="flex-1 rounded-xl bg-amber-700 hover:bg-amber-800 text-amber-50"
            >
              {saving ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">목표를 삭제할까요?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-center">
            "{goal.title}" 목표와 관련 기록이 모두 삭제됩니다.
          </p>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDelete(false)} className="flex-1 rounded-xl">취소</Button>
            <Button onClick={handleDelete} className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white">삭제</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}