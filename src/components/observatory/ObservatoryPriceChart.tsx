'use client';

import { useState } from 'react';
import { formatCurrency, formatCompact } from '@/lib/utils/formatters';

interface PricePoint {
  t: string; // Time or date
  p: number; // Price
  v?: number; // Volume
}

interface ObservatoryPriceChartProps {
  data: PricePoint[];
  symbol: string;
  currentPrice: number;
  changePct: number;
}

export function ObservatoryPriceChart({ data, symbol, currentPrice, changePct }: ObservatoryPriceChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-muted text-xs">NO PRICE DATA</div>;

  const minPrice = Math.min(...data.map(d => d.p));
  const maxPrice = Math.max(...data.map(d => d.p));
  const rng = maxPrice - minPrice || 1;
  const pad = rng * 0.1;
  const yMin = minPrice - pad;
  const yMax = maxPrice + pad;
  const yRng = yMax - yMin;

  const maxVol = Math.max(...data.map(d => d.v || 0));

  const isUp = changePct >= 0;
  const strokeCol = isUp ? '#00D97E' : '#FF4D6D';
  const fillStart = isUp ? 'rgba(0, 217, 126, 0.2)' : 'rgba(255, 77, 109, 0.2)';
  const fillEnd = isUp ? 'rgba(0, 217, 126, 0)' : 'rgba(255, 77, 109, 0)';

  // SVG dimensions
  const W = 800;
  const H = 300;
  
  // Create path
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((d.p - yMin) / yRng) * H;
    return { x, y, d };
  });

  const pathD = `M ${pts.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const fillD = `${pathD} L ${W},${H} L 0,${H} Z`;

  const hPoint = hoverIdx !== null ? pts[hoverIdx] : null;

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Header overlaid on chart */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-3xl font-bold text-foreground">{formatCurrency(currentPrice)}</span>
          <span className="font-mono text-sm font-bold" style={{ color: strokeCol }}>
            {isUp ? '+' : ''}{changePct.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="flex-1 relative mt-16 group">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillStart} />
              <stop offset="100%" stopColor={fillEnd} />
            </linearGradient>
            <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1={H/4} x2={W} y2={H/4} stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
          <line x1="0" y1={H/2} x2={W} y2={H/2} stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
          <line x1="0" y1={(H*3)/4} x2={W} y2={(H*3)/4} stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />

          {/* Volume bars */}
          {pts.map((p, i) => {
            if (!p.d.v) return null;
            const barH = (p.d.v / maxVol) * (H * 0.2); // max 20% of height
            const barW = Math.max(1, (W / pts.length) * 0.8);
            return (
              <rect
                key={`v${i}`}
                x={p.x - barW/2}
                y={H - barH}
                width={barW}
                height={barH}
                fill="url(#volFill)"
              />
            );
          })}

          {/* Price Area */}
          <path d={fillD} fill="url(#chartFill)" />
          
          {/* Price Line */}
          <path d={pathD} fill="none" stroke={strokeCol} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

          {/* Hover Crosshair */}
          {hPoint && (
            <g>
              <line x1={hPoint.x} y1="0" x2={hPoint.x} y2={H} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
              <line x1="0" y1={hPoint.y} x2={W} y2={hPoint.y} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
              <circle cx={hPoint.x} cy={hPoint.y} r="4" fill={strokeCol} stroke="var(--color-surface)" strokeWidth="2" />
            </g>
          )}
        </svg>

        {/* Interaction layer */}
        <div 
          className="absolute inset-0 cursor-crosshair"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const pct = x / rect.width;
            const idx = Math.min(pts.length - 1, Math.max(0, Math.round(pct * (pts.length - 1))));
            setHoverIdx(idx);
          }}
          onMouseLeave={() => setHoverIdx(null)}
        />
        
        {/* Hover Tooltip Overlay (HTML based to prevent SVG text clipping issues) */}
        {hPoint && (
          <div 
            className="absolute bg-surface border border-white/10 rounded px-2 py-1 pointer-events-none transform -translate-x-1/2 -translate-y-[calc(100%+10px)]"
            style={{ 
              left: `${(hPoint.x / W) * 100}%`, 
              top: `${(hPoint.y / H) * 100}%`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}
          >
            <div className="font-mono text-xs font-bold text-foreground">{formatCurrency(hPoint.d.p)}</div>
            <div className="obs-label" style={{ fontSize: 9 }}>{hPoint.d.t}</div>
            {hPoint.d.v && <div className="obs-label mt-1" style={{ fontSize: 9 }}>VOL: {formatCompact(hPoint.d.v)}</div>}
          </div>
        )}
      </div>

      {/* X-Axis labels */}
      <div className="flex justify-between items-center mt-2 px-1">
        <span className="obs-label" style={{ fontSize: 9 }}>{data[0]?.t}</span>
        <span className="obs-label" style={{ fontSize: 9 }}>{data[Math.floor(data.length/2)]?.t}</span>
        <span className="obs-label" style={{ fontSize: 9 }}>{data[data.length-1]?.t}</span>
      </div>
    </div>
  );
}
