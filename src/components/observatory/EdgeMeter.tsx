'use client';

interface EdgeMeterProps {
  score: number;
  label: string;
  color?: 'green' | 'gold' | 'red' | 'purple' | 'blue';
  grade?: string;
  desc?: string;
}

const COLORS = {
  green: '#00D97E',
  gold: '#F5A623',
  red: '#FF4D6D',
  purple: '#8B5CF6',
  blue: '#3B82F6',
};

export function EdgeMeter({ score, label, color = 'green', grade, desc }: EdgeMeterProps) {
  const c = COLORS[color];
  const w = `${score}%`;

  return (
    <div className="obs-panel p-4 h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className="obs-label" style={{ color: c }}>{label}</div>
          {grade && (
            <div className="font-mono text-xs font-bold" style={{ color: c }}>{grade}</div>
          )}
        </div>
        {desc && <div className="text-[10px] text-muted leading-relaxed mb-4 max-w-[85%]">{desc}</div>}
      </div>

      <div>
        <div className="flex justify-between items-end mb-1.5">
          <div className="font-mono text-[10px] text-muted">0</div>
          <div className="font-mono text-xl font-bold" style={{ color: c, letterSpacing: '-0.02em', lineHeight: 1 }}>{score}</div>
        </div>
        <div className="h-1.5 w-full rounded-full" style={{ background: 'var(--color-surface-3)' }}>
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: w, background: c, boxShadow: `0 0 8px ${c}40` }} />
        </div>
      </div>
    </div>
  );
}
