'use client';

interface FlowRiverProps {
  inflow: number; // percentage 0-100
  outflow: number; // percentage 0-100
  label?: string;
}

export function FlowRiver({ inflow, outflow, label = "ORDER FLOW" }: FlowRiverProps) {
  // Normalize if they exceed 100 combined
  const total = inflow + outflow;
  const nIn = total > 0 ? (inflow / total) * 100 : 50;
  const nOut = total > 0 ? (outflow / total) * 100 : 50;

  return (
    <div className="obs-panel p-4">
      <div className="obs-label mb-3">{label}</div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between items-end mb-1">
            <span className="font-mono text-xs font-bold text-bull">IN</span>
            <span className="font-mono text-xs text-muted">{nIn.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 w-full bg-surface-3 rounded-full flex justify-end overflow-hidden">
            <div className="h-full bg-bull rounded-full" style={{ width: `${nIn}%` }} />
          </div>
        </div>
        <div className="w-px h-6 bg-white/10" />
        <div className="flex-1">
          <div className="flex justify-between items-end mb-1">
            <span className="font-mono text-xs text-muted">{nOut.toFixed(1)}%</span>
            <span className="font-mono text-xs font-bold text-bear">OUT</span>
          </div>
          <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden">
            <div className="h-full bg-bear rounded-full" style={{ width: `${nOut}%` }} />
          </div>
        </div>
      </div>
      <div className="flex justify-between mt-3">
        <div className="obs-chip obs-chip-green">NET BULLISH</div>
        <div className="font-mono text-xs">{(nIn - nOut).toFixed(1)}%</div>
      </div>
    </div>
  );
}
