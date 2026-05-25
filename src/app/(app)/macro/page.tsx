'use client';

import { useEffect, useState } from 'react';
import type { MacroIndicator } from '@/lib/types';
import { Area, AreaChart, YAxis } from 'recharts';
import { SafeResponsiveContainer } from '@/components/charts/SafeChart';
import { formatNumber } from '@/lib/utils/formatters';

function Sparkline({ data, positiveIsGood = true }: { data: { date: string; value: number }[]; positiveIsGood?: boolean }) {
  if (!data || data.length === 0) return null;
  const start = data[0].value;
  const end = data[data.length - 1].value;
  const diff = end - start;
  
  let color = '#8b8da0';
  if (diff > 0) color = positiveIsGood ? '#22c55e' : '#ef4444';
  if (diff < 0) color = positiveIsGood ? '#ef4444' : '#22c55e';

  return (
    <div className="h-full w-full">
      <SafeResponsiveContainer height={30}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fillOpacity={1}
            fill={`url(#grad-${color})`}
            isAnimationActive={false}
          />
          <YAxis domain={['auto', 'auto']} hide />
        </AreaChart>
      </SafeResponsiveContainer>
    </div>
  );
}

export default function MacroPage() {
  const [indicators, setIndicators] = useState<MacroIndicator[]>([]);
  const [loading, setLoading] = useState(true);

  const [aiReport, setAiReport] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    fetch('/api/macro')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setIndicators(data);
          
          // Trigger AI Insight generation
          setLoadingAi(true);
          fetch('/api/ai/macro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ macroData: data.map((d: any) => ({ name: d.name, value: d.current, unit: d.unit })) })
          })
          .then(r => r.json())
          .then(json => setAiReport(json.summary))
          .catch(() => setAiReport('AI Macro Insights temporarily unavailable.'))
          .finally(() => setLoadingAi(false));
        }
        setLoading(false);
      });
  }, []);

  const positiveGoodKeys = ['SP500', 'GDP', 'CONSUMER_SENT'];
  const positiveBadKeys = ['CPI', 'UNEMPLOYMENT', 'INITIAL_CLAIMS'];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Macroeconomic Dashboard</h1>
        <p className="text-sm text-muted mt-1">Live data from the Federal Reserve Economic Data (FRED)</p>
      </div>

      {indicators.length > 0 && (
        <div className="card bg-accent/5 border-accent/20 relative overflow-hidden group">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">✨</span>
            <h3 className="text-sm font-bold text-accent-light uppercase tracking-wider">Chief Economist AI Report</h3>
          </div>
          {loadingAi ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-accent/20 rounded w-full" />
              <div className="h-4 bg-accent/20 rounded w-11/12" />
              <div className="h-4 bg-accent/20 rounded w-4/5" />
            </div>
          ) : (
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{aiReport}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-32">
              <div className="h-4 bg-surface-3 rounded w-24 mb-3" />
              <div className="h-8 bg-surface-3 rounded w-16" />
            </div>
          ))
        ) : (
          indicators.map(ind => {
            const isPositiveGood = positiveGoodKeys.includes(ind.key) || 
                                 (!positiveBadKeys.includes(ind.key) && true); // Fallback

            const diff = (ind.current ?? 0) - (ind.previous ?? 0);
            const isUp = diff > 0;
            const isNeutral = diff === 0;

            let changeColor = 'text-muted';
            if (!isNeutral) {
              if (isUp) changeColor = isPositiveGood ? 'text-bull' : 'text-bear';
              else changeColor = isPositiveGood ? 'text-bear' : 'text-bull';
            }

            return (
              <div key={ind.key} className="card flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-foreground">{ind.name}</span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-2 bg-surface-2 px-1.5 py-0.5 rounded">
                    {ind.unit}
                  </span>
                </div>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono">
                    {ind.current !== null ? formatNumber(ind.current, 2) : '—'}
                  </span>
                  {ind.previous !== null && (
                    <span className={`text-xs font-semibold ${changeColor}`}>
                      {isUp ? '▲' : isNeutral ? '—' : '▼'} {formatNumber(Math.abs(diff), 2)}
                    </span>
                  )}
                </div>

                <Sparkline data={ind.trend} positiveIsGood={isPositiveGood} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
