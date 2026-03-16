import React from 'react';
import { motion } from 'framer-motion';

function getSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

const seasonConfig = {
  spring: { skyTop: '#fce4ec', skyBot: '#fff8e7', ground: '#a5d6a7', groundDark: '#81c784', accent: '#f48fb1' },
  summer: { skyTop: '#b3e5fc', skyBot: '#e0f7fa', ground: '#66bb6a', groundDark: '#43a047', accent: '#fff176' },
  autumn: { skyTop: '#ffe0b2', skyBot: '#fff8e1', ground: '#d4a256', groundDark: '#b8860b', accent: '#ef9a9a' },
  winter: { skyTop: '#e3f2fd', skyBot: '#f8fbff', ground: '#e0e0e0', groundDark: '#bdbdbd', accent: '#b3c6e0' },
};

// 여우 SVG 캐릭터
function FoxCharacter() {
  return (
    <g>
      {/* 꼬리 - 흔들기 애니메이션 */}
      <motion.g
        animate={{ rotate: [-20, -5, -20, -30, -20] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ originX: '30px', originY: '50px' }}
      >
        <ellipse cx="18" cy="44" rx="10" ry="6" fill="#f97316" transform="rotate(-20 18 44)" />
        <ellipse cx="14" cy="42" rx="5" ry="3" fill="#fff7ed" transform="rotate(-20 14 42)" />
      </motion.g>
      {/* 몸통 */}
      <ellipse cx="30" cy="42" rx="12" ry="10" fill="#f97316" />
      {/* 배 */}
      <ellipse cx="30" cy="44" rx="7" ry="6" fill="#fff7ed" />
      {/* 머리 */}
      <circle cx="30" cy="26" r="11" fill="#f97316" />
      {/* 귀 - 쫑긋 애니메이션 */}
      <motion.g
        animate={{ y: [0, -2, 0, -1, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        <polygon points="22,18 18,8 26,16" fill="#f97316" />
        <polygon points="38,18 42,8 34,16" fill="#f97316" />
        <polygon points="23,17 20,11 27,16" fill="#fca5a5" />
        <polygon points="37,17 40,11 33,16" fill="#fca5a5" />
      </motion.g>
      {/* 얼굴 */}
      <ellipse cx="27" cy="28" rx="2.2" ry="2.5" fill="#1e1b4b" />
      <ellipse cx="33" cy="28" rx="2.2" ry="2.5" fill="#1e1b4b" />
      <circle cx="27.8" cy="27.2" r="0.8" fill="white" />
      <circle cx="33.8" cy="27.2" r="0.8" fill="white" />
      {/* 코 */}
      <ellipse cx="30" cy="31" rx="1.5" ry="1" fill="#7c3aed" />
      {/* 볼 */}
      <circle cx="24" cy="30" r="2.5" fill="#fca5a5" opacity="0.6" />
      <circle cx="36" cy="30" r="2.5" fill="#fca5a5" opacity="0.6" />
      {/* 미소 */}
      <path d="M27 33 Q30 35.5 33 33" stroke="#7c3aed" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* 다리 */}
      <rect x="24" y="50" width="5" height="7" rx="2.5" fill="#ea580c" />
      <rect x="31" y="50" width="5" height="7" rx="2.5" fill="#ea580c" />
      {/* 발 */}
      <ellipse cx="26.5" cy="57" rx="4" ry="2.5" fill="#c2410c" />
      <ellipse cx="33.5" cy="57" rx="4" ry="2.5" fill="#c2410c" />
      {/* 검 */}
      <rect x="42" y="20" width="3" height="18" rx="1.5" fill="#94a3b8" />
      <rect x="39" y="27" width="9" height="2.5" rx="1.2" fill="#64748b" />
      <rect x="42.5" y="18" width="2" height="4" rx="1" fill="#fbbf24" />
    </g>
  );
}

// 마왕성 SVG
function DemonCastle({ x }) {
  return (
    <g transform={`translate(${x}, 0)`}>
      {/* 안개 */}
      <ellipse cx="60" cy="72" rx="50" ry="8" fill="#7c3aed" opacity="0.15" />
      {/* 메인 타워 */}
      <rect x="42" y="30" width="36" height="45" fill="#4c1d95" />
      {/* 메인 지붕 */}
      <polygon points="42,30 60,8 78,30" fill="#6d28d9" />
      {/* 왼쪽 작은 탑 */}
      <rect x="28" y="44" width="18" height="31" fill="#5b21b6" />
      <polygon points="28,44 37,28 46,44" fill="#7c3aed" />
      {/* 오른쪽 작은 탑 */}
      <rect x="74" y="44" width="18" height="31" fill="#5b21b6" />
      <polygon points="74,44 83,28 92,44" fill="#7c3aed" />
      {/* 깃발 */}
      <line x1="60" y1="8" x2="60" y2="0" stroke="#dc2626" strokeWidth="1.5" />
      <polygon points="60,0 70,4 60,8" fill="#dc2626" />
      <line x1="37" y1="28" x2="37" y2="20" stroke="#dc2626" strokeWidth="1.2" />
      <polygon points="37,20 45,24 37,28" fill="#dc2626" />
      <line x1="83" y1="28" x2="83" y2="20" stroke="#dc2626" strokeWidth="1.2" />
      <polygon points="83,20 91,24 83,28" fill="#dc2626" />
      {/* 창문들 */}
      <rect x="52" y="38" width="8" height="10" rx="4" fill="#fbbf24" opacity="0.8" />
      <rect x="64" y="38" width="8" height="10" rx="4" fill="#fbbf24" opacity="0.8" />
      <rect x="52" y="55" width="8" height="10" rx="4" fill="#fbbf24" opacity="0.6" />
      <rect x="64" y="55" width="8" height="10" rx="4" fill="#fbbf24" opacity="0.6" />
      <rect x="33" y="52" width="6" height="8" rx="3" fill="#fbbf24" opacity="0.7" />
      <rect x="81" y="52" width="6" height="8" rx="3" fill="#fbbf24" opacity="0.7" />
      {/* 문 */}
      <rect x="53" y="62" width="14" height="13" rx="7" fill="#1e1b4b" />
      {/* 해골 장식 */}
      <circle cx="60" cy="24" r="4" fill="#e2e8f0" />
      <circle cx="58" cy="23" r="1" fill="#1e1b4b" />
      <circle cx="62" cy="23" r="1" fill="#1e1b4b" />
      <path d="M58 26 Q60 28 62 26" stroke="#1e1b4b" strokeWidth="0.8" fill="none" />
    </g>
  );
}

// 길 + 돌 + 나무
function PathScene({ colors }) {
  return (
    <>
      {/* 하늘 그라데이션 */}
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.skyTop} />
          <stop offset="100%" stopColor={colors.skyBot} />
        </linearGradient>
        <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.ground} />
          <stop offset="100%" stopColor={colors.groundDark} />
        </linearGradient>
      </defs>

      <rect width="400" height="120" fill="url(#skyGrad)" />

      {/* 구름 */}
      <g opacity="0.7">
        <ellipse cx="60" cy="22" rx="22" ry="10" fill="white" />
        <ellipse cx="45" cy="26" rx="14" ry="8" fill="white" />
        <ellipse cx="76" cy="25" rx="14" ry="8" fill="white" />
        <ellipse cx="200" cy="16" rx="18" ry="8" fill="white" />
        <ellipse cx="187" cy="19" rx="12" ry="7" fill="white" />
        <ellipse cx="215" cy="18" rx="12" ry="7" fill="white" />
      </g>

      {/* 땅 */}
      <rect x="0" y="78" width="400" height="42" fill="url(#groundGrad)" />

      {/* 원근감 있는 흙길 */}
      <polygon points="155,78 245,78 310,120 90,120" fill="#c8a97a" />
      <polygon points="175,78 225,78 265,120 135,120" fill="#b8956a" />
      {/* 길 중앙선 */}
      <line x1="200" y1="78" x2="200" y2="120" stroke="#d4b896" strokeWidth="2" strokeDasharray="6,5" opacity="0.6" />

      {/* 길가 돌멩이들 */}
      <ellipse cx="140" cy="85" rx="5" ry="3" fill="#9e9e9e" />
      <ellipse cx="130" cy="92" rx="4" ry="2.5" fill="#bdbdbd" />
      <ellipse cx="260" cy="85" rx="5" ry="3" fill="#9e9e9e" />
      <ellipse cx="272" cy="93" rx="4" ry="2.5" fill="#bdbdbd" />
      <ellipse cx="100" cy="100" rx="6" ry="3.5" fill="#9e9e9e" />
      <ellipse cx="300" cy="100" rx="6" ry="3.5" fill="#9e9e9e" />

      {/* 왼쪽 나무 */}
      <rect x="92" y="58" width="6" height="22" rx="3" fill="#6d4c41" />
      <circle cx="95" cy="50" r="16" fill="#388e3c" />
      <circle cx="85" cy="55" r="11" fill="#43a047" />
      <circle cx="106" cy="54" r="11" fill="#2e7d32" />

      {/* 오른쪽 나무 */}
      <rect x="298" y="58" width="6" height="22" rx="3" fill="#6d4c41" />
      <circle cx="301" cy="50" r="16" fill="#388e3c" />
      <circle cx="290" cy="55" r="11" fill="#43a047" />
      <circle cx="312" cy="54" r="11" fill="#2e7d32" />

      {/* 풀 */}
      {[108,116,122,278,285,292].map((x, i) => (
        <g key={i}>
          <path d={`M${x} 79 Q${x-3} 71 ${x-5} 73`} stroke="#4caf50" strokeWidth="1.5" fill="none" />
          <path d={`M${x} 79 Q${x+1} 70 ${x+3} 72`} stroke="#66bb6a" strokeWidth="1.5" fill="none" />
        </g>
      ))}
    </>
  );
}

export default function CharacterBanner({ nickname, message }) {
  const season = getSeason();
  const colors = seasonConfig[season];

  return (
    <div className="relative overflow-hidden rounded-b-3xl shadow-md" style={{ background: colors.skyTop }}>
      {/* SVG 씬 */}
      <svg viewBox="0 0 400 120" className="w-full" style={{ display: 'block', height: '180px' }}>
        <PathScene colors={colors} />

        {/* 마왕성 (원경) */}
        <g transform="scale(0.55) translate(210, -4)">
          <DemonCastle x={0} />
        </g>

        {/* 여우 캐릭터 - 숨쉬기 idle 애니메이션 */}
        <motion.g
          animate={{
            y: [0, -2.5, 0, -2.5, 0],
          }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <g transform="translate(60, 30) scale(0.9)">
            <FoxCharacter />
          </g>
        </motion.g>
      </svg>

      {/* 텍스트 오버레이 */}
      <div className="absolute bottom-0 left-0 right-0 px-5 py-3 bg-gradient-to-t from-amber-900/60 to-transparent">
        <p className="font-bold text-base text-amber-50 drop-shadow">
          {nickname || '용사님'}
        </p>
        <p className="text-xs text-amber-100/90 drop-shadow leading-relaxed">
          {message || '당신을 기다리고 있습니다.'}
        </p>
      </div>
    </div>
  );
}