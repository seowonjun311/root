import React from 'react';

// 간단한 여우 SVG
function FoxCharacter() {
  return (
    <g>
      {/* 꼬리 */}
      <ellipse cx="18" cy="44" rx="10" ry="6" fill="#f97316" transform="rotate(-20 18 44)" />
      <ellipse cx="14" cy="42" rx="5" ry="3" fill="#fff7ed" transform="rotate(-20 14 42)" />
      {/* 몸통 */}
      <ellipse cx="30" cy="42" rx="12" ry="10" fill="#f97316" />
      {/* 배 */}
      <ellipse cx="30" cy="44" rx="7" ry="6" fill="#fff7ed" />
      {/* 머리 */}
      <circle cx="30" cy="26" r="11" fill="#f97316" />
      {/* 귀 */}
      <polygon points="22,18 18,8 26,16" fill="#f97316" />
      <polygon points="38,18 42,8 34,16" fill="#f97316" />
      <polygon points="23,17 20,11 27,16" fill="#fca5a5" />
      <polygon points="37,17 40,11 33,16" fill="#fca5a5" />
      {/* 눈 */}
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
    </g>
  );
}

export default function CharacterBanner({ nickname, message }) {
  return (
    <div className="relative overflow-hidden rounded-b-3xl shadow-md" style={{ background: '#fff8e7' }}>
      {/* 여우 SVG */}
      <svg viewBox="0 0 100 80" className="w-full" style={{ display: 'block', height: '140px' }} role="presentation" aria-hidden="true">
        <g transform="translate(35, 8)">
          <FoxCharacter />
        </g>
      </svg>

      {/* 텍스트 오버레이 */}
      <div className="absolute bottom-0 left-0 right-0 py-2.5 px-5" style={{
        background: 'linear-gradient(90deg, rgba(160,120,48,0.92) 0%, rgba(210,170,80,0.92) 30%, rgba(235,195,100,0.95) 50%, rgba(210,170,80,0.92) 70%, rgba(160,120,48,0.92) 100%)',
        borderTop: '2px solid rgba(180,130,40,0.8)',
        boxShadow: '0 -2px 8px rgba(60,30,5,0.3)',
      }}>
        <p className="font-bold text-base drop-shadow" style={{ color: '#3a1f05', textShadow: '0 1px 2px rgba(255,220,120,0.4)' }}>
          {nickname || '용사님'}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: '#5a3510' }}>
          {message || '당신을 기다리고 있습니다.'}
        </p>
      </div>
    </div>
  );
}