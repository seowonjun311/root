import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BarChart3, Clock, Target, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const CAT_LABELS = { exercise: '운동', study: '공부', mental: '정신', daily: '일상' };

export default function Records() {
  const [catFilter, setCatFilter] = useState('all');
  const [showCompletedGoals, setShowCompletedGoals] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const navigate = useNavigate();

  const { data: logs = [] } = useQuery({
    queryKey: ['allLogs'],
    queryFn: () => base44.entities.ActionLog.list('-date', 500),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['allGoals'],
    queryFn: () => base44.entities.Goal.list('-created_date', 100),
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: () => base44.entities.Badge.list('-earned_date', 100),
  });

  const { data: actionGoals = [] } = useQuery({
    queryKey: ['actionGoalsAll'],
    queryFn: () => base44.entities.ActionGoal.list('-created_date', 200),
  });

  const filteredLogs = catFilter === 'all' ? logs : logs.filter(l => l.category === catFilter);
  
  const totalMinutes = filteredLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
  const totalHours = Math.round(totalMinutes / 60);
  const totalSessions = filteredLogs.length;
  const totalDistance = Math.round(filteredLogs.reduce((sum, l) => sum + (l.gps_enabled && l.distance_km ? l.distance_km : 0), 0) * 10) / 10;
  const completedGoalsList = goals.filter(g => (g.status === 'completed' || g.status === 'failed') && (catFilter === 'all' || g.category === catFilter));
  const completedGoals = completedGoalsList.length;
  const filteredBadges = catFilter === 'all' ? badges : badges.filter(b => b.category === catFilter);

  // Category breakdown
  const catBreakdown = Object.entries(
    logs.reduce((acc, l) => {
      const cat = l.category || 'exercise';
      acc[cat] = (acc[cat] || 0) + (l.duration_minutes || 0);
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const CAT_EMOJIS = { exercise: '🏃', study: '📚', mental: '🧘', daily: '🏠' };

  return (
    <div className="min-h-screen bg-background">
      {/* 획득한 칭호 다이얼로그 */}
      <Dialog open={showBadges} onOpenChange={setShowBadges}>
        <DialogContent className="max-w-sm rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">🏅 획득한 칭호</DialogTitle>
          </DialogHeader>
          {filteredBadges.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-3xl mb-2">🦊</p>
              <p className="text-sm">아직 획득한 칭호가 없어요.</p>
            </div>
          ) : (
            <div className="space-y-4 mt-1">
              {['exercise', 'study', 'mental', 'daily', 'special'].map(cat => {
                const catBadges = filteredBadges.filter(b => b.category === cat);
                if (catBadges.length === 0) return null;
                const catInfo = {
                  exercise: { label: '운동', emoji: '🏃' },
                  study: { label: '공부', emoji: '📚' },
                  mental: { label: '정신', emoji: '🧘' },
                  daily: { label: '일상', emoji: '🏠' },
                  special: { label: '특별', emoji: '⭐' },
                }[cat];
                return (
                  <div key={cat}>
                    <p className="text-xs font-bold text-amber-800 mb-2">
                      {catInfo.emoji} {catInfo.label} ({catBadges.length}개)
                    </p>
                    <div className="space-y-2">
                      {catBadges.map(b => (
                        <div key={b.id} className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/60">
                          <p className="text-sm font-semibold text-amber-900">{b.title}</p>
                          {b.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{b.description}</p>
                          )}
                          {b.earned_date && (
                            <p className="text-[10px] text-amber-600 mt-1">{b.earned_date}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 수련 세션 다이얼로그 */}
      <Dialog open={showSessions} onOpenChange={setShowSessions}>
        <DialogContent className="max-w-sm rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">🏃 수련 내역 ({filteredLogs.length}회)</DialogTitle>
          </DialogHeader>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-3xl mb-2">🦊</p>
              <p className="text-sm">아직 수련 기록이 없어요.</p>
            </div>
          ) : (
            <div className="space-y-3 mt-1">
              {filteredLogs.map(log => {
                const actionGoal = actionGoals.find(ag => ag.id === log.action_goal_id);
                return (
                  <div key={log.id} className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/60">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold text-amber-900">{actionGoal?.title || '기록'}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 font-semibold">{log.date}</span>
                    </div>
                    {log.photo_url && (
                      <button onClick={() => setSelectedPhoto(log)} className="mb-2 rounded-lg overflow-hidden hover:opacity-80 transition-opacity">
                        <img src={log.photo_url} alt="수련 사진" className="w-full h-24 object-cover rounded-lg" />
                      </button>
                    )}
                    <div className="flex items-center gap-2">
                      {log.duration_minutes > 0 && (
                        <span className="text-xs text-muted-foreground">⏱️ {log.duration_minutes}분</span>
                      )}
                      {log.gps_enabled && (
                        <span className="text-xs text-blue-600">🗺️ {log.distance_km?.toFixed(2)}km</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 완료한 목표 다이얼로그 */}
      <Dialog open={showCompletedGoals} onOpenChange={setShowCompletedGoals}>
        <DialogContent className="max-w-sm rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">🏆 완료한 목표</DialogTitle>
          </DialogHeader>
          {completedGoalsList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-3xl mb-2">🦊</p>
              <p className="text-sm">아직 완료한 목표가 없어요.</p>
            </div>
          ) : (
            <div className="space-y-5 mt-1">
              {['exercise', 'study', 'mental', 'daily'].map(cat => {
                const catGoals = completedGoalsList.filter(g => g.category === cat);
                if (catGoals.length === 0) return null;
                const catInfo = { exercise: { label: '운동', emoji: '🏃' }, study: { label: '공부', emoji: '📚' }, mental: { label: '정신', emoji: '🧘' }, daily: { label: '일상', emoji: '🏠' } }[cat];
                return (
                  <div key={cat}>
                    <p className="text-xs font-bold text-amber-800 mb-2">{catInfo.emoji} {catInfo.label} ({catGoals.length}개)</p>
                    <div className="space-y-2">
                      {catGoals.map(g => {
                        const relatedBadge = badges.find(b => b.goal_id === g.id);
                        return (
                          <div key={g.id} className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-300/60">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-bold text-amber-900 flex-1">{g.title}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {g.duration_days}일 도전 · {g.end_date || g.updated_date?.split('T')[0]}
                            </p>
                            {relatedBadge && (
                              <p className="text-xs text-amber-700 font-semibold">🏅 {relatedBadge.title}</p>
                            )}
                            {g.result_note && (
                              <p className="text-xs text-amber-800 italic mt-1">"{g.result_note}"</p>
                            )}
                            <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              g.achievement_success ? 'bg-green-100 text-green-700' : 'bg-secondary text-muted-foreground'
                            }`}>
                              {g.achievement_success ? '✅ 달성' : '종료'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <div className="p-6 pb-3">
        <h1 className="text-xl font-bold text-amber-900 flex items-center gap-2">
          📜 기록의 여정
        </h1>
      </div>

      <Tabs defaultValue="stats" className="px-4">
        <TabsList className="w-full bg-secondary/60 rounded-xl h-10">
          <TabsTrigger value="stats" className="flex-1 rounded-lg text-xs">통계</TabsTrigger>
          <TabsTrigger value="timeline" className="flex-1 rounded-lg text-xs">타임라인</TabsTrigger>
          <TabsTrigger value="album" className="flex-1 rounded-lg text-xs">여정 앨범</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-4 space-y-4">
          {/* Category filter */}
          <div className="flex gap-1.5">
            {['all', 'exercise', 'study', 'mental', 'daily'].map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  catFilter === cat
                    ? 'bg-amber-700 text-amber-50'
                    : 'bg-secondary text-muted-foreground'}`}
              >
                {cat === 'all' ? '전체' : CAT_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* Stats cards */}
          <div className={`grid gap-3 ${(catFilter === 'all' || catFilter === 'exercise') ? 'grid-cols-2' : 'grid-cols-2'}`}>
            <StatCard icon={<Clock className="w-5 h-5 text-amber-600" />} label="총 수련 시간" value={`${totalHours}시간`} />
            <StatCard icon={<Target className="w-5 h-5 text-amber-600" />} label="완료한 목표" value={`${completedGoals}개`} onClick={() => setShowCompletedGoals(true)} clickable />
            <StatCard icon={<Flame className="w-5 h-5 text-amber-600" />} label="총 수련 횟수" value={`${totalSessions}회`} onClick={() => setShowSessions(true)} clickable />
            {(catFilter === 'all' || catFilter === 'exercise') && (
              <StatCard icon={<BarChart3 className="w-5 h-5 text-amber-600" />} label="총 이동거리" value={`${totalDistance}km`} />
            )}
            <StatCard icon={<BarChart3 className="w-5 h-5 text-amber-600" />} label="획득한 칭호" value={`${filteredBadges.length}개`} onClick={() => setShowBadges(true)} clickable />
          </div>

          {/* Category breakdown */}
          {catFilter === 'all' && catBreakdown.length > 0 && (
            <div className="p-4 rounded-2xl bg-card border border-border/60">
              <h3 className="font-semibold text-sm mb-3">카테고리별 수련 내역</h3>
              <div className="space-y-3">
                {catBreakdown.map(([cat, min]) => {
                  const percent = totalMinutes > 0 ? Math.round((min / totalMinutes) * 100) : 0;
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-sm w-12">{CAT_LABELS[cat] || cat}</span>
                      <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-amber-600 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-16 text-right">
                        {Math.round(min / 60)}시간 {percent}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="mt-4 space-y-3 pb-4">
          {/* Category filter */}
          <div className="flex gap-1.5 flex-wrap">
            {['all', 'exercise', 'study', 'mental', 'daily'].map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  catFilter === cat
                    ? 'bg-amber-700 text-amber-50'
                    : 'bg-secondary text-muted-foreground'}`}
              >
                {cat === 'all' ? '전체' : CAT_LABELS[cat]}
              </button>
            ))}
          </div>
          {/* 완료 목표 (칭호 + 소감) */}
          {(() => {
            const completedGoals = goals.filter(g =>
              g.status === 'completed' && g.achievement_success &&
              (catFilter === 'all' || g.category === catFilter)
            );
            return completedGoals.map(g => {
              const relatedBadge = badges.find(b => b.goal_id === g.id);
              return (
                <div key={`goal-${g.id}`} className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-300/60">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">🏆</span>
                    <p className="text-sm font-bold text-amber-900">{g.title}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 ml-auto">{g.end_date || g.updated_date?.split('T')[0]}</span>
                  </div>
                  {relatedBadge && (
                    <p className="text-xs text-amber-700 font-semibold mb-1">🏅 칭호: {relatedBadge.title}</p>
                  )}
                  {g.result_note && (
                    <p className="text-xs text-amber-800 italic">"{g.result_note}"</p>
                  )}
                </div>
              );
            });
          })()}

          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-3xl mb-3">🦊</p>
              <p>아직 기록이 없습니다.</p>
              <p className="text-sm">첫 번째 수련을 시작해 보세요.</p>
            </div>
          ) : (
            filteredLogs.map(log => {
              const actionGoal = actionGoals.find(ag => ag.id === log.action_goal_id);
              return (
                <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40">
                  <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{actionGoal?.title || log.date}</p>
                    <p className="text-xs text-muted-foreground">{log.date}{log.duration_minutes > 0 ? ` · ${log.duration_minutes}분` : ''}</p>
                    {log.memo && (
                      <p className="text-xs text-muted-foreground italic">"{log.memo}"</p>
                    )}
                  </div>
                  {log.photo_url && (
                    <button onClick={() => setSelectedPhoto(log)} className="shrink-0">
                      <img src={log.photo_url} alt="수련 사진" className="w-12 h-12 rounded-lg object-cover" />
                    </button>
                  )}
                  <span className="text-xs px-2 py-1 rounded-lg bg-amber-100/80 text-amber-700 shrink-0">
                    {CAT_LABELS[log.category] || '기타'}
                  </span>
                </div>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="album" className="mt-4 pb-4">
          <AlbumTab logs={logs} goals={goals} catFilter={catFilter} onCatFilterChange={setCatFilter} />
        </TabsContent>
      </Tabs>

      {/* 타임라인 사진 확대 다이얼로그 */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-sm rounded-2xl p-4">
          <DialogHeader>
            <DialogTitle className="text-center text-sm">
              {CAT_EMOJIS[selectedPhoto?.category]} {selectedPhoto?.date}
            </DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="space-y-3">
              <img src={selectedPhoto.photo_url} alt={selectedPhoto.date} className="w-full rounded-xl object-cover max-h-80" />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-1 rounded-lg bg-amber-100 text-amber-700 font-semibold">
                  {CAT_LABELS[selectedPhoto.category] || '기타'}
                </span>
                {selectedPhoto.duration_minutes > 0 && (
                  <span className="text-xs text-muted-foreground">{selectedPhoto.duration_minutes}분 수련</span>
                )}
              </div>
              {selectedPhoto.memo && (
                <p className="text-sm text-amber-800 italic bg-amber-50/80 p-3 rounded-xl">"{selectedPhoto.memo}"</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AlbumTab({ logs, goals, catFilter, onCatFilterChange }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const CAT_EMOJIS = { exercise: '🏃', study: '📚', mental: '🧘', daily: '🏠' };

  // 사진 있는 로그
  const photoLogs = logs.filter(l => l.photo_url && (catFilter === 'all' || l.category === catFilter));

  // 완료한 목표 (달성)
  const completedGoals = goals.filter(g =>
    g.status === 'completed' && g.achievement_success &&
    (catFilter === 'all' || g.category === catFilter)
  );

  return (
    <div className="space-y-5">
      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap">
        {['all', 'exercise', 'study', 'mental', 'daily'].map(cat => (
          <button
            key={cat}
            onClick={() => onCatFilterChange(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              catFilter === cat
                ? 'bg-amber-700 text-amber-50'
                : 'bg-secondary text-muted-foreground'}`}
          >
            {cat === 'all' ? '전체' : CAT_LABELS[cat]}
          </button>
        ))}
      </div>

      {photoLogs.length === 0 && completedGoals.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">🖼️</p>
          <p className="text-sm font-semibold">아직 앨범이 비어있어요.</p>
          <p className="text-xs mt-1">수련 완료 시 사진을 찍으면 여기에 쌓여요!</p>
        </div>
      ) : (
        <>
          {/* 달성 목표 하이라이트 */}
          {completedGoals.length > 0 && (
            <div>
          <p className="text-xs font-bold text-amber-800 mb-2">🏆 달성한 목표</p>
          <div className="space-y-2">
            {completedGoals.map(g => (
              <div key={g.id} className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-300/60 flex items-center gap-3">
                <span className="text-2xl">{CAT_EMOJIS[g.category] || '🎯'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-amber-900 truncate">{g.title}</p>
                  <p className="text-xs text-muted-foreground">{g.duration_days}일 도전 완료 · {g.end_date || g.updated_date?.split('T')[0]}</p>
                  {g.result_note && <p className="text-xs text-amber-700 italic mt-0.5">"{g.result_note}"</p>}
                </div>
                <span className="text-lg">✨</span>
              </div>
            ))}
          </div>
          </div>
          )}

          {/* 사진 그리드 */}
          {photoLogs.length > 0 && (
            <div>
              <p className="text-xs font-bold text-amber-800 mb-2">📸 수련 사진 ({photoLogs.length}장)</p>
              <div className="grid grid-cols-3 gap-1.5">
                {photoLogs.map(log => (
                  <button
                    key={log.id}
                    onClick={() => setSelectedPhoto(log)}
                    className="aspect-square rounded-xl overflow-hidden relative group"
                  >
                    <img src={log.photo_url} alt={log.date} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                      <span className="text-[10px] text-white font-semibold">{log.date}</span>
                    </div>
                    <span className="absolute top-1 right-1 text-xs">{CAT_EMOJIS[log.category] || '📝'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 사진 상세 다이얼로그 */}
          <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
            <DialogContent className="max-w-sm rounded-2xl p-4">
              <DialogHeader>
                <DialogTitle className="text-center text-sm">
                  {CAT_EMOJIS[selectedPhoto?.category]} {selectedPhoto?.date}
                </DialogTitle>
              </DialogHeader>
              {selectedPhoto && (
                <div className="space-y-3">
                  <img src={selectedPhoto.photo_url} alt={selectedPhoto.date} className="w-full rounded-xl object-cover max-h-72" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-lg bg-amber-100 text-amber-700 font-semibold">
                      {CAT_LABELS[selectedPhoto.category] || '기타'}
                    </span>
                    {selectedPhoto.duration_minutes > 0 && (
                      <span className="text-xs text-muted-foreground">{selectedPhoto.duration_minutes}분 수련</span>
                    )}
                  </div>
                  {selectedPhoto.memo && (
                    <p className="text-sm text-amber-800 italic bg-amber-50/80 p-3 rounded-xl">"{selectedPhoto.memo}"</p>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, onClick, clickable }) {
  return (
    <div
      className={`p-4 rounded-2xl bg-card border border-border/60 ${clickable ? 'cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="mb-2">{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-amber-900">{value}</p>
      {clickable && <p className="text-[10px] text-amber-500 mt-1">탭하여 보기 →</p>}
    </div>
  );
}