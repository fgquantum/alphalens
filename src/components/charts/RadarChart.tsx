'use client';

import { Radar, RadarChart as ReRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface RadarChartProps {
  subScores: {
    value: number;
    growth: number;
    momentum: number;
    quality: number;
    safety: number;
    dividend: number;
  };
}

export function RadarChart({ subScores }: RadarChartProps) {
  // Normalize to 100 for the radar chart visualization so it looks balanced,
  // even though actual max scores are 25/25/20/15/10/5.
  const data = [
    { dimension: 'Value', score: (subScores.value / 25) * 100 },
    { dimension: 'Quality', score: (subScores.quality / 25) * 100 },
    { dimension: 'Growth', score: (subScores.growth / 20) * 100 },
    { dimension: 'Momentum', score: (subScores.momentum / 15) * 100 },
    { dimension: 'Safety', score: (subScores.safety / 10) * 100 },
    { dimension: 'Dividend', score: (subScores.dividend / 5) * 100 || 0 },
  ];

  return (
    <div className="w-full h-[280px] flex items-center justify-center -mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <ReRadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#2A3040" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#8892A4', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-display)' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="AlphaScore Context"
            dataKey="score"
            stroke="#00D97E"
            strokeWidth={2}
            fill="#00D97E"
            fillOpacity={0.2}
            animationBegin={300}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </ReRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
