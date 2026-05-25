'use client';

import { useState, useEffect } from 'react';

function gradeColor(s: number): string {
  if (s >= 90) return '#00D97E';
  if (s >= 80) return '#22C55E';
  if (s >= 70) return '#84CC16';
  if (s >= 60) return '#EAB308';
  if (s >= 50) return '#F97316';
  if (s >= 40) return '#EF4444';
  if (s >= 30) return '#DC2626';
  return '#FF4D6D';
}

function gradeLetter(s: number): string {
  if (s >= 90) return 'A+';
  if (s >= 80) return 'A';
  if (s >= 70) return 'B+';
  if (s >= 60) return 'B';
  if (s >= 50) return 'C+';
  if (s >= 40) return 'C';
  if (s >= 30) return 'D';
  return 'F';
}

function signalFor(s: number): string {
  if (s >= 85) return 'STRONG BUY';
  if (s >= 70) return 'BUY';
  if (s >= 55) return 'WATCH';
  if (s >= 40) return 'NEUTRAL';
  if (s >= 25) return 'CAUTION';
  return 'AVOID';
}

interface ScoreDialProps {
  score: number;
  size?: number;
  prev?: number;
}

export function ScoreDial({ score, size = 260, prev = 0 }: ScoreDialProps) {
  const [d, setD] = useState(0);

  useEffect(() => {
    let raf: number;
    let start: number | undefined;
    function step(t: number) {
      if (!start) start = t;
      const k = Math.min(1, (t - start) / 800);
      setD(Math.round(score * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const r = size / 2 - 16;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - d / 100);
  const col = gradeColor(score);
  const delta = score - prev;

  // Tick marks
  const ticks = [];
  for (let i = 0; i < 100; i++) {
    const a = (i / 100) * Math.PI * 2 - Math.PI / 2;
    const i1 = r + 4;
    const i2 = r + 9;
    ticks.push(
      <line
        key={i}
        x1={c + Math.cos(a) * i1}
        y1={c + Math.sin(a) * i1}
        x2={c + Math.cos(a) * i2}
        y2={c + Math.sin(a) * i2}
        stroke={i < d ? col : '#1C2130'}
        strokeWidth={i % 10 === 0 ? 1.5 : 0.8}
        opacity={i < d ? 0.5 + (i / 100) * 0.5 : 0.5}
      />
    );
  }

  const endAngle = (d / 100) * Math.PI * 2 - Math.PI / 2;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', inset: 0 }}>
        {ticks}
        <circle cx={c} cy={c} r={r} fill="none" stroke="#1C2130" />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={col}
          strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={off}
          strokeLinecap="round"
          transform={`rotate(-90 ${c} ${c})`}
          style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(.34,1.56,.64,1)' }}
        />
        <circle
          cx={c + Math.cos(endAngle) * r}
          cy={c + Math.sin(endAngle) * r}
          r="4"
          fill={col}
          style={{ filter: `drop-shadow(0 0 6px ${col})` }}
        />
      </svg>
      <div style={{ position: 'relative', textAlign: 'center', zIndex: 2 }}>
        <div className="obs-label" style={{ fontSize: 9 }}>ALPHASCORE</div>
        <div className="font-mono" style={{ fontSize: size * 0.28, fontWeight: 700, color: col, lineHeight: 1, marginTop: 4, letterSpacing: '-0.03em' }}>
          {d}
        </div>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>/ 100</div>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 32, height: 32, border: `1px solid ${col}`, background: col + '1F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="font-mono" style={{ fontWeight: 700, color: col, fontSize: 14 }}>{gradeLetter(score)}</span>
          </div>
          <div className="font-mono" style={{ fontSize: 10, letterSpacing: '0.12em', color: col }}>{signalFor(score)}</div>
          {prev > 0 && (
            <div className="font-mono" style={{ fontSize: 10, color: delta >= 0 ? '#00D97E' : '#FF4D6D' }}>
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} · 30D
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
