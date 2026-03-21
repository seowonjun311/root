import React from 'react';

export default function Header({
  title = '루트',
  subtitle = '오늘의 행동을 기록하고 성장해보세요',
}) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'rgba(246, 247, 251, 0.92)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(229, 231, 235, 0.75)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 760,
          margin: '0 auto',
          padding: '12px 12px 10px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            minHeight: 44,
          }}
        >
          <div
            style={{
              minWidth: 0,
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: '#111827',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                marginBottom: 2,
              }}
            >
              {title}
            </div>

            <div
              style={{
                fontSize: 12,
                color: '#6b7280',
                lineHeight: 1.35,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {subtitle}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
