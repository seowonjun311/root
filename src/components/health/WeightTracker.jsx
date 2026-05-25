import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Scale, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const TODAY = format(new Date(), 'yyyy-MM-dd');

export default function WeightTracker({ userEmail }) {
  const qc = useQueryClient();
  const [weight, setWeight] = useState('');
  const [memo, setMemo] = useState('');

  const { data: logs = [] } = useQuery({
    queryKey: ['weightLogs'],
    queryFn: () => base44.entities.HealthWeightLog.list('-log_date', 30),
  });

  const addMutation = useMutation({
    mutationFn: () =>
      base44.entities.HealthWeightLog.create({
        user_email: userEmail,
        weight: parseFloat(weight),
        memo,
        log_date: TODAY,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weightLogs'] });
      setWeight('');
      setMemo('');
    },
  });

  const chartData = [...logs]
    .sort((a, b) => a.log_date?.localeCompare(b.log_date))
    .slice(-14)
    .map(l => ({ date: l.log_date?.slice(5), weight: l.weight }));

  const latest = logs[0];
  const prev = logs[1];
  const diff = latest && prev ? (latest.weight - prev.weight).toFixed(1) : null;

  return (
    <div className="space-y-3">
      {/* 최근 체중 + 변화 */}
      {latest && (
        <div className="flex items-center justify-between px-2">
          <div>
            <span className="text-2xl font-bold text-foreground">{latest.weight}</span>
            <span className="text-sm text-muted-foreground ml-1">kg</span>
          </div>
          {diff !== null && (
            <div className={`flex items-center gap-1 text-xs font-bold ${
              parseFloat(diff) < 0 ? 'text-blue-500' : parseFloat(diff) > 0 ? 'text-red-500' : 'text-muted-foreground'
            }`}>
              {parseFloat(diff) < 0 ? <TrendingDown className="w-4 h-4" /> :
               parseFloat(diff) > 0 ? <TrendingUp className="w-4 h-4" /> :
               <Minus className="w-4 h-4" />}
              {parseFloat(diff) > 0 ? '+' : ''}{diff}kg
            </div>
          )}
        </div>
      )}

      {/* 그래프 */}
      {chartData.length >= 2 && (
        <div className="h-24 px-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                formatter={(v) => [`${v}kg`, '체중']}
              />
              <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 입력 폼 */}
      <div className="flex gap-2 px-2">
        <input
          type="number"
          inputMode="decimal"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          placeholder="체중 (kg)"
          className="w-28 p-2.5 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="text"
          value={memo}
          onChange={e => setMemo(e.target.value)}
          placeholder="메모 (선택)"
          className="flex-1 p-2.5 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={() => addMutation.mutate()}
          disabled={!weight || addMutation.isPending}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40"
        >
          기록
        </button>
      </div>
    </div>
  );
}