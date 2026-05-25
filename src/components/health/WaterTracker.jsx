import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Droplets, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import WaterFlowerViz from './WaterFlowerViz';

const TODAY = format(new Date(), 'yyyy-MM-dd');
const GOAL_ML = 2000;
const QUICK_AMOUNTS = [200, 500];

export default function WaterTracker({ userEmail }) {
  const qc = useQueryClient();
  const [customAmount, setCustomAmount] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const { data: logs = [] } = useQuery({
    queryKey: ['waterLogs', TODAY],
    queryFn: () => base44.entities.HealthWaterLog.filter({ log_date: TODAY }),
  });

  const totalMl = logs.reduce((sum, l) => sum + (l.amount_ml || 0), 0);

  const addMutation = useMutation({
    mutationFn: (amount_ml) =>
      base44.entities.HealthWaterLog.create({
        user_email: userEmail,
        amount_ml,
        log_date: TODAY,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['waterLogs', TODAY] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HealthWaterLog.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['waterLogs', TODAY] }),
  });

  const handleCustomAdd = () => {
    const val = parseInt(customAmount);
    if (!val || val <= 0) return;
    addMutation.mutate(val);
    setCustomAmount('');
    setShowCustom(false);
  };

  return (
    <div className="space-y-3">
      {/* 꽃 시각화 */}
      <WaterFlowerViz totalMl={totalMl} goalMl={GOAL_ML} />

      {/* 빠른 추가 버튼 */}
      <div className="flex items-center gap-2 justify-center flex-wrap">
        {QUICK_AMOUNTS.map(amt => (
          <button
            key={amt}
            onClick={() => addMutation.mutate(amt)}
            disabled={addMutation.isPending}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold hover:opacity-80 transition-opacity"
          >
            <Droplets className="w-3.5 h-3.5" />
            +{amt}ml
          </button>
        ))}
        <button
          onClick={() => setShowCustom(v => !v)}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold hover:opacity-80 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" />
          직접 입력
        </button>
      </div>

      {/* 직접 입력 */}
      {showCustom && (
        <div className="flex gap-2 px-2">
          <input
            type="number"
            inputMode="numeric"
            value={customAmount}
            onChange={e => setCustomAmount(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCustomAdd()}
            placeholder="ml 입력"
            className="flex-1 p-2.5 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleCustomAdd}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
          >
            추가
          </button>
        </div>
      )}

      {/* 오늘 기록 리스트 */}
      {logs.length > 0 && (
        <div className="space-y-1 px-2">
          {logs.map(log => (
            <div key={log.id} className="flex items-center justify-between py-1">
              <span className="text-xs text-muted-foreground">
                💧 {log.amount_ml}ml
              </span>
              <button
                onClick={() => deleteMutation.mutate(log.id)}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}