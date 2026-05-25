import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Droplets, Scale, Footprints, Sparkles } from 'lucide-react';
import WaterTracker from './WaterTracker';
import WeightTracker from './WeightTracker';
import StepsTracker from './StepsTracker';

const FEATURES = [
  {
    key: 'water',
    label: '물 섭취 기록',
    emoji: '💧',
    icon: Droplets,
    desc: '하루 수분 섭취량을 꽃 성장으로 시각화',
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    key: 'weight',
    label: '체중 기록',
    emoji: '⚖️',
    icon: Scale,
    desc: '체중 변화 흐름을 부드럽게 기록',
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    key: 'steps',
    label: '걸음수 기록',
    emoji: '👟',
    icon: Footprints,
    desc: '걸음수로 포인트와 마을 활기 획득',
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
  },
];

const STORAGE_KEY = 'health_advanced_settings_v1';

function loadSettings() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : {};
  } catch { return {}; }
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export default function HealthAdvancedPanel({ userEmail }) {
  const [settings, setSettings] = useState(loadSettings);
  const [expanded, setExpanded] = useState({});
  const [panelOpen, setPanelOpen] = useState(false);

  const toggleFeature = (key) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    saveSettings(next);
    // 켜면 자동으로 펼침
    if (!settings[key]) {
      setExpanded(e => ({ ...e, [key]: true }));
    }
  };

  const toggleExpand = (key) => {
    // 기본값이 true(펼침)이므로 undefined → false로 전환
    setExpanded(e => ({ ...e, [key]: e[key] === false ? true : false }));
  };

  const activeCount = FEATURES.filter(f => settings[f.key]).length;

  return (
    <div className="mx-4 mb-4 mt-4">
      {/* 헤더 토글 */}
      <button
        onClick={() => setPanelOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">건강 고급 기능</span>
          {activeCount > 0 && (
            <span className="text-[11px] font-semibold bg-primary text-primary-foreground rounded-full px-2 py-0.5">
              {activeCount}개 활성
            </span>
          )}
        </div>
        {panelOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {/* 활성화된 기능 — 항상 표시 */}
      {FEATURES.filter(f => settings[f.key]).map(({ key, label, emoji, bg }) => {
        const isExpanded = expanded[key] !== false; // 기본값 펼침
        return (
          <div key={key} className="mt-2 rounded-2xl border border-border overflow-hidden">
            <div className={`flex items-center gap-3 px-4 py-3 ${bg}`}>
              <span className="text-lg">{emoji}</span>
              <p className="flex-1 text-sm font-bold text-foreground">{label}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFeature(key)}
                  className="relative w-11 h-6 rounded-full bg-primary transition-colors duration-200"
                >
                  <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow translate-x-5 transition-transform duration-200" />
                </button>
                <button onClick={() => toggleExpand(key)} className="p-1">
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
            </div>
            {isExpanded && (
              <div className="px-3 py-3 bg-background border-t border-border/50">
                {key === 'water' && <WaterTracker userEmail={userEmail} />}
                {key === 'weight' && <WeightTracker userEmail={userEmail} />}
                {key === 'steps' && <StepsTracker userEmail={userEmail} />}
              </div>
            )}
          </div>
        );
      })}

      {/* 패널 전체 목록 (토글 시) */}
      {panelOpen && (
        <div className="mt-2 space-y-2">
          {FEATURES.map(({ key, label, emoji, desc, bg }) => {
            const isOn = !!settings[key];
            if (isOn) return null; // 이미 위에 표시됨
            return (
              <div key={key} className="rounded-2xl border border-border overflow-hidden opacity-70">
                <div className="flex items-center gap-3 px-4 py-3 bg-secondary/20">
                  <span className="text-lg">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{label}</p>
                    <p className="text-[11px] text-muted-foreground">{desc}</p>
                  </div>
                  <button
                    onClick={() => toggleFeature(key)}
                    className="relative w-11 h-6 rounded-full bg-border transition-colors duration-200"
                  >
                    <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow translate-x-0 transition-transform duration-200" />
                  </button>
                </div>
              </div>
            );
          })}
          <p className="text-[10px] text-center text-muted-foreground pt-1 pb-2">
            ✨ 건강 행동이 마을 세계와 연결됩니다
          </p>
        </div>
      )}
    </div>
  );
}