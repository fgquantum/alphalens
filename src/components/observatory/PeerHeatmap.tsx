'use client';

import Link from 'next/link';

interface Peer {
  symbol: string;
  score: number;
  change: number;
}

interface PeerHeatmapProps {
  peers: Peer[];
  sector: string;
}

export function PeerHeatmap({ peers, sector }: PeerHeatmapProps) {
  const getColor = (score: number) => {
    if (score >= 80) return 'rgba(0, 217, 126, 0.15)';
    if (score >= 60) return 'rgba(245, 166, 35, 0.15)';
    return 'rgba(255, 77, 109, 0.15)';
  };

  const getBorderColor = (score: number) => {
    if (score >= 80) return '#00D97E';
    if (score >= 60) return '#F5A623';
    return '#FF4D6D';
  };

  return (
    <div className="obs-panel p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="obs-label">PEER RELATIVE</div>
        <div className="obs-chip obs-chip-muted">{sector}</div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {peers.map(p => (
          <Link 
            key={p.symbol} 
            href={`/stock/${p.symbol}`}
            className="p-2 border transition-colors flex flex-col justify-between h-16 group hover:bg-surface-2"
            style={{ 
              borderColor: 'rgba(255,255,255,0.06)',
              borderLeftColor: getBorderColor(p.score),
              borderLeftWidth: '3px'
            }}
          >
            <div className="flex justify-between items-start">
              <span className="font-mono text-xs font-bold group-hover:text-white transition-colors">{p.symbol}</span>
              <span className="font-mono text-[10px] text-muted">{p.score}</span>
            </div>
            <div className="font-mono text-[10px]" style={{ color: p.change >= 0 ? '#00D97E' : '#FF4D6D' }}>
              {p.change >= 0 ? '+' : ''}{p.change.toFixed(2)}%
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
