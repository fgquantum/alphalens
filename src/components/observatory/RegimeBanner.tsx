'use client';

interface RegimeBannerProps {
  status: string;
  details: string;
  color?: 'green' | 'gold' | 'red';
}

const COLORS = {
  green: { border: '#00D97E', bg: 'rgba(0, 217, 126, 0.08)', text: '#00D97E' },
  gold: { border: '#F5A623', bg: 'rgba(245, 166, 35, 0.08)', text: '#F5A623' },
  red: { border: '#FF4D6D', bg: 'rgba(255, 77, 109, 0.08)', text: '#FF4D6D' },
};

export function RegimeBanner({ status, details, color = 'green' }: RegimeBannerProps) {
  const c = COLORS[color];

  return (
    <div className="regime-scan border-l-2 p-3 mt-4" style={{ borderColor: c.border, backgroundColor: c.bg }}>
      <div className="flex items-center gap-3">
        <div className="animate-pulse-ring w-2 h-2 rounded-full" style={{ backgroundColor: c.border, color: c.border }} />
        <span className="font-mono text-[10px] tracking-widest font-bold" style={{ color: c.text }}>{status}</span>
        <span className="text-[10px] text-muted">|</span>
        <span className="font-mono text-[10px] text-muted-2 truncate">{details}</span>
      </div>
    </div>
  );
}
