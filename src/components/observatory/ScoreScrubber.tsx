'use client';

import { useState } from 'react';

interface ScoreScrubberProps {
  currentScore: number;
  history: number[]; // e.g. last 30 days
  dates: string[];
}

export function ScoreScrubber({ currentScore, history, dates }: ScoreScrubberProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (!history || history.length === 0) return null;

  const min = Math.min(...history);
  const max = Math.max(...history);
  const r = max - min || 1;

  const displayScore = hoverIdx !== null ? history[hoverIdx] : currentScore;
  const displayDate = hoverIdx !== null ? dates[hoverIdx] : 'CURRENT';

  const getColor = (s: number) => {
    if (s >= 80) return '#00D97E';
    if (s >= 60) return '#F5A623';
    return '#FF4D6D';
  };

  const col = getColor(displayScore);

  return (
    <div className="obs-panel p-4 h-full flex flex-col justify-between group">
      <div className="flex justify-between items-start">
        <div className="obs-label">SCORE TREND</div>
        <div className="text-right">
          <div className="font-mono text-xl font-bold" style={{ color: col }}>{displayScore}</div>
          <div className="obs-label text-[9px] mt-0.5">{displayDate}</div>
        </div>
      </div>

      <div className="relative h-12 mt-4 flex items-end gap-[2px]">
        {history.map((s, i) => {
          const hPct = ((s - min) / r) * 0.8 + 0.2; // Min 20% height
          const isHov = hoverIdx === i;
          return (
            <div
              key={i}
              className="flex-1 bg-surface-3 transition-all rounded-t-sm"
              style={{ 
                height: `${hPct * 100}%`,
                background: isHov ? getColor(s) : 'var(--color-surface-3)',
                opacity: hoverIdx === null || isHov ? 1 : 0.3
              }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            />
          );
        })}
      </div>
    </div>
  );
}
