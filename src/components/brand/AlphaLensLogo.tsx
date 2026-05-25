// ============================================================
// AlphaLens v11 — Brand Logo Component
// Precision optical lens with quantitative data core
// ============================================================

'use client';

interface LogoProps {
  variant?: 'full' | 'compact' | 'icon';
  size?: number;
  className?: string;
}

export function AlphaLensLogo({ variant = 'full', size = 32, className = '' }: LogoProps) {
  const iconSize = variant === 'icon' ? size : size;

  const ApertureIcon = ({ s = iconSize }: { s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 100 100" className="shrink-0">
      {/* Outer circle */}
      <circle cx="50" cy="50" r="46" fill="none" stroke="#00D97E" strokeWidth="2.5" opacity="0.9" />
      {/* 6-blade aperture iris */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle + 15) * Math.PI / 180;
        const x1 = 50 + 18 * Math.cos(rad);
        const y1 = 50 + 18 * Math.sin(rad);
        const x2 = 50 + 38 * Math.cos(rad + 0.35);
        const y2 = 50 + 38 * Math.sin(rad + 0.35);
        const x3 = 50 + 38 * Math.cos(rad + 0.7);
        const y3 = 50 + 38 * Math.sin(rad + 0.7);
        const x4 = 50 + 18 * Math.cos(rad + 0.6);
        const y4 = 50 + 18 * Math.sin(rad + 0.6);
        return (
          <path
            key={i}
            d={`M${x1},${y1} L${x2},${y2} L${x3},${y3} L${x4},${y4} Z`}
            fill="#0A0C10"
            stroke="#00D97E"
            strokeWidth="0.8"
            opacity="0.85"
          />
        );
      })}
      {/* Center focal point */}
      <circle cx="50" cy="50" r="4" fill="#00D97E" />
      {/* Inner glow ring */}
      <circle cx="50" cy="50" r="16" fill="none" stroke="#00D97E" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={className}>
        <ApertureIcon />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <ApertureIcon s={size} />
        <span
          className="font-bold text-sm tracking-tight"
          style={{ fontFamily: "'Space Grotesk', 'DM Sans', sans-serif" }}
        >
          <span style={{ color: '#E8EAF0' }}>A</span>
          <span style={{ color: '#00D97E' }}>L</span>
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <ApertureIcon s={size} />
      <span
        className="font-semibold tracking-tight"
        style={{
          fontFamily: "'Space Grotesk', 'DM Sans', sans-serif",
          fontSize: size * 0.55,
          letterSpacing: '-0.04em',
        }}
      >
        <span style={{ color: '#E8EAF0' }}>Alpha</span>
        <span style={{ color: '#00D97E' }}>Lens</span>
      </span>
    </div>
  );
}
