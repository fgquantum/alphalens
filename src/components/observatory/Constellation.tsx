'use client';

import { useState } from 'react';

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

interface AlgoNode {
  id: string;
  name: string;
  value: number | string;
  unit: string;
  color: 'green' | 'red' | 'gold' | 'blue' | 'purple';
  kind: string;
}

const COL: Record<string, string> = {
  green: '#00D97E',
  red: '#FF4D6D',
  gold: '#F5A623',
  blue: '#3B82F6',
  purple: '#8B5CF6',
};

interface ConstellationProps {
  score: number;
  algos?: AlgoNode[];
}

const DEFAULT_ALGOS: AlgoNode[] = [
  { id: 'edge', name: 'Edge Score', value: 0.72, unit: '', color: 'purple', kind: 'core' },
  { id: 'eqs', name: 'EQS™', value: 88, unit: '/100', color: 'green', kind: 'qual' },
  { id: 'smi', name: 'SMI™', value: 79, unit: '/100', color: 'green', kind: 'flow' },
  { id: 'cer', name: 'CER™', value: 76, unit: '/100', color: 'green', kind: 'qual' },
  { id: 'pio', name: 'Piotroski F', value: 8, unit: '/9', color: 'green', kind: 'qual' },
  { id: 'tsi', name: 'TSI™', value: 82, unit: '/100', color: 'green', kind: 'mom' },
  { id: 'momo', name: 'AlphaMom™', value: 94, unit: ' pct', color: 'green', kind: 'mom' },
  { id: 'vol', name: 'Vol Regime™', value: 'EXPANSION', unit: '', color: 'gold', kind: 'risk' },
  { id: 'earn', name: 'Earn Mom™', value: 96, unit: '/100', color: 'green', kind: 'mom' },
  { id: 'mac', name: 'Macro Regime', value: 'LATE-CYCLE', unit: '', color: 'blue', kind: 'macro' },
  { id: 'ben', name: 'Beneish M', value: -2.61, unit: '', color: 'green', kind: 'qual' },
];

export function Constellation({ score, algos = DEFAULT_ALGOS }: ConstellationProps) {
  const size = 420;
  const cx = size / 2;
  const cy = size / 2;
  const r1 = 78;
  const r2 = 132;
  const r3 = 180;
  const [hov, setHov] = useState<string | null>(null);

  const inner = algos.filter(a => a.kind === 'core');
  const mid = algos.filter(a => a.kind === 'qual' || a.kind === 'flow');
  const outer = algos.filter(a => a.kind === 'mom' || a.kind === 'risk' || a.kind === 'macro');

  const place = (items: AlgoNode[], r: number) =>
    items.map((a, i) => {
      const ang = (i / items.length) * Math.PI * 2 - Math.PI / 2;
      return { ...a, x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r };
    });

  const all = [...place(inner, r1), ...place(mid, r2), ...place(outer, r3)];

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <radialGradient id="cg">
            <stop offset="0%" stopColor="#00D97E" stopOpacity="0.25" />
            <stop offset="70%" stopColor="#00D97E" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={90} fill="url(#cg)" />
        {[r1, r2, r3].map(r => (
          <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeDasharray="2 4" />
        ))}
        {/* Outer ticks */}
        {Array.from({ length: 72 }).map((_, i) => {
          const a = (i / 72) * Math.PI * 2;
          const x1 = cx + Math.cos(a) * (r3 + 6);
          const y1 = cy + Math.sin(a) * (r3 + 6);
          const x2 = cx + Math.cos(a) * (r3 + (i % 9 === 0 ? 12 : 8));
          const y2 = cy + Math.sin(a) * (r3 + (i % 9 === 0 ? 12 : 8));
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.12)" strokeWidth={i % 9 === 0 ? 1 : 0.5} />;
        })}
        {/* Connection lines */}
        {all.map(a => (
          <line key={a.id + 'l'} x1={cx} y1={cy} x2={a.x} y2={a.y} stroke={hov === a.id ? COL[a.color] : 'rgba(255,255,255,0.07)'} strokeWidth={hov === a.id ? 1 : 0.5} opacity={hov === a.id ? 0.9 : 0.5} />
        ))}
        {/* Node circles */}
        {all.map(a => {
          const col = COL[a.color];
          const act = hov === a.id;
          return (
            <g key={a.id} transform={`translate(${a.x} ${a.y})`} onMouseEnter={() => setHov(a.id)} onMouseLeave={() => setHov(null)} style={{ cursor: 'pointer' }}>
              <circle r={act ? 14 : 10} fill="var(--color-surface)" stroke={col} strokeWidth={act ? 1.5 : 1} />
              <circle r={act ? 5 : 3.5} fill={col} style={act ? { filter: `drop-shadow(0 0 6px ${col})` } : {}} />
            </g>
          );
        })}
      </svg>
      {/* Labels */}
      {all.map(a => {
        const col = COL[a.color];
        const tx = a.x + (a.x < cx ? -18 : 18);
        const ta = a.x < cx ? 'right' : 'left';
        return (
          <div key={a.id + 'txt'} style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${tx}px,${a.y - 12}px)`, textAlign: ta as any, pointerEvents: 'none' }}>
            <div className="obs-micro" style={{ color: col, fontSize: 9, whiteSpace: 'nowrap' }}>{a.name}</div>
            <div className="font-mono" style={{ fontSize: 12, color: 'var(--color-foreground)', fontWeight: 700 }}>
              {typeof a.value === 'number' ? (a.value % 1 === 0 ? a.value : a.value.toFixed(2)) : a.value}{a.unit}
            </div>
          </div>
        );
      })}
      {/* Center score */}
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', width: 130 }}>
        <div className="obs-label" style={{ fontSize: 8 }}>COMPOSITE</div>
        <div className="font-mono" style={{ fontSize: 44, fontWeight: 700, color: gradeColor(score), lineHeight: 1, letterSpacing: '-0.03em' }}>{score}</div>
        <div className="font-mono" style={{ fontSize: 9, color: 'var(--color-muted)', marginTop: 4, letterSpacing: '0.12em' }}>ALPHASCORE™</div>
      </div>
    </div>
  );
}
