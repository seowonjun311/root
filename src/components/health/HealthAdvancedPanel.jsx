import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import WaterTracker from './WaterTracker';
import WeightTracker from './WeightTracker';
import StepsTracker from './StepsTracker';

const FEATURES = [
  { key: 'water', label: '물 섭취 기록', emoji: '💧' },
  { key: 'weight', label: '체중 기록', emoji: '⚖️' },
  { key: 'steps', label: '걸음수 기록', emoji: '👟' },
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

  const toggleFeature = (key) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    saveSettings(next);
    if (!settings[key]) setExpanded(e => ({ ...e, [key]: true }));
  };

  const toggleExpand = (key) => {
    setExpanded(e => ({ ...e, [key]: e[key] === false ? true : false }));
  };

  return (
    <div className="mx-4 mb-4 mt-2 space-y-2">
      {FEATURES.map(({ key, label, emoji }) => {
        const isOn = !!settings[key];
        const isExpanded = expanded[key] !== false;

        return (
          <div key={key} className="rounded-2xl border border-border overflow-hidden">
            {/* 헤더 행 */}
            <button
              onClick={() => toggleFeature(key)}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{emoji}</span>
                <span className="text-sm font-bold text-foreground">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${isOn ? 'bg-primary' : 'bg-border'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${isOn ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                {isOn && (
                  <button
                    onClick={e => { e.stopPropagation(); toggleExpand(key); }}
                    className="p-1"
                  >
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                )}
              </div>
            </button>

            {/* 내용 */}
            {isOn && isExpanded && (
              <div className="px-3 py-3 bg-background border-t border-border/50">
                {key === 'water' && <WaterTracker userEmail={userEmail} />}
                {key === 'weight' && <WeightTracker userEmail={userEmail} />}
                {key === 'steps' && <StepsTracker userEmail={userEmail} />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}