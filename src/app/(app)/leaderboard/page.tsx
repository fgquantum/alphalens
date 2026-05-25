'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlphaScoreBadge, getScoreColor } from '@/components/charts/AlphaScoreGauge';
import { formatCurrency, formatCompact } from '@/lib/utils/formatters';
import {
  Trophy, TrendingUp, TrendingDown, Target, Crown,
  ArrowUpRight, ArrowDownRight, BarChart3, Flame
} from 'lucide-react';

interface LeaderboardStock {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  marketCap: number;
  alphaScore: number;
  grade: string;
  signal: string;
}

export default function LeaderboardPage() {
  const [stocks, setStocks] = useState<LeaderboardStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setStocks(data);
        setLoading(false);
      });
  }, []);

  const topAlpha = [...stocks].sort((a, b) => b.alphaScore - a.alphaScore).slice(0, 8);
  const topGainers = [...stocks].sort((a, b) => b.changePct - a.changePct).slice(0, 8);
  const topLosers = [...stocks].sort((a, b) => a.changePct - b.changePct).slice(0, 8);

  const SkeletonRows = () => (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex justify-between items-center py-3 animate-shimmer">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 bg-surface-3/30 rounded" />
            <div className="h-4 w-20 bg-surface-3/30 rounded" />
          </div>
          <div className="h-4 w-16 bg-surface-3/30 rounded" />
        </div>
      ))}
    </>
  );

  const RankBadge = ({ rank }: { rank: number }) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-alpha-gold" />;
    if (rank === 2) return <span className="text-[11px] font-bold text-league-silver font-mono">2</span>;
    if (rank === 3) return <span className="text-[11px] font-bold text-league-bronze font-mono">3</span>;
    return <span className="text-[11px] font-bold text-muted-2 font-mono">{rank}</span>;
  };

  const StockList = ({
    title, icon: Icon, items, metric, accentColor = '#00D97E'
  }: {
    title: string;
    icon: typeof Trophy;
    items: LeaderboardStock[];
    metric: 'score' | 'change';
    accentColor?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card overflow-hidden"
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}20` }}>
          <Icon className="w-4 h-4" style={{ color: accentColor }} />
        </div>
        <h3 className="text-sm font-bold text-foreground font-display tracking-tight">{title}</h3>
      </div>

      <div className="space-y-0.5">
        {loading ? <SkeletonRows /> : items.length === 0 ? (
          <p className="text-xs text-muted py-4 text-center">No data available</p>
        ) : (
          items.map((s, i) => (
            <Link
              key={s.symbol}
              href={`/stock/${s.symbol}`}
              className="flex justify-between items-center py-2.5 px-3 -mx-1 rounded-xl hover:bg-white/[0.03] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 flex justify-center">
                  <RankBadge rank={i + 1} />
                </div>
                <div className="w-7 h-7 rounded-lg bg-surface-3/30 flex items-center justify-center text-[10px] font-black text-accent border border-white/[0.04] group-hover:border-accent/15 transition-colors">
                  {s.symbol[0]}
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[13px] font-bold text-foreground group-hover:text-accent transition-colors">
                    {s.symbol}
                  </span>
                  <span className="text-[10px] text-muted-2 truncate max-w-[100px]">{s.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {metric === 'score' ? (
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 rounded-full bg-surface-3/30 overflow-hidden hidden sm:block">
                      <div className="h-full rounded-full" style={{ width: `${s.alphaScore}%`, backgroundColor: getScoreColor(s.alphaScore) }} />
                    </div>
                    <span className="font-mono text-sm font-bold" style={{ color: getScoreColor(s.alphaScore) }}>
                      {s.alphaScore}
                    </span>
                  </div>
                ) : (
                  <div className="text-right">
                    <p className="font-mono text-[13px] text-foreground">{formatCurrency(s.price)}</p>
                    <p className={`text-[11px] font-bold flex items-center gap-0.5 justify-end ${s.changePct >= 0 ? 'text-bull' : 'text-bear'}`}>
                      {s.changePct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
                    </p>
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-alpha-gold/10 border border-alpha-gold/15 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-alpha-gold" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground font-display tracking-tight">Market Leaderboards</h1>
          <p className="text-xs text-muted mt-0.5">Real-time rankings across {stocks.length} monitored stocks</p>
        </div>
      </div>

      {/* Summary stats */}
      {!loading && stocks.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Stocks Tracked', value: stocks.length.toString(), icon: BarChart3, color: '#3B82F6' },
            { label: 'Top AlphaScore', value: topAlpha[0]?.alphaScore.toString() || '\u2014', sub: topAlpha[0]?.symbol, icon: Target, color: '#00D97E' },
            { label: 'Biggest Gainer', value: `+${topGainers[0]?.changePct.toFixed(2)}%`, sub: topGainers[0]?.symbol, icon: TrendingUp, color: '#00D97E' },
            { label: 'Biggest Loser', value: `${topLosers[0]?.changePct.toFixed(2)}%`, sub: topLosers[0]?.symbol, icon: TrendingDown, color: '#FF4D6D' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="stat-card flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${stat.color}10`, border: `1px solid ${stat.color}15` }}>
                  <Icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-[9px] text-muted-2 uppercase tracking-wider font-display">{stat.label}</p>
                  <p className="text-lg font-bold font-mono" style={{ color: stat.color }}>{stat.value}</p>
                  {stat.sub && <p className="text-[10px] text-muted font-mono">{stat.sub}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Three leaderboard columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <StockList title="Highest AlphaScore" icon={Target} items={topAlpha} metric="score" accentColor="#00D97E" />
        <StockList title="Top Daily Gainers" icon={TrendingUp} items={topGainers} metric="change" accentColor="#22C55E" />
        <StockList title="Top Daily Losers" icon={TrendingDown} items={topLosers} metric="change" accentColor="#FF4D6D" />
      </div>

      {/* All stocks grid */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-4 h-4 text-alpha-gold" />
          <h3 className="text-sm font-bold text-foreground font-display">All Monitored Stocks</h3>
          <span className="text-[10px] text-muted-2 font-mono ml-auto">{stocks.length} total</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {loading ? (
            Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="h-9 w-24 bg-surface-2/30 animate-shimmer rounded-xl" />
            ))
          ) : stocks.map(s => (
            <Link
              key={s.symbol}
              href={`/stock/${s.symbol}`}
              className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-accent/15 text-xs font-mono transition-all"
            >
              <span className="text-foreground font-bold group-hover:text-accent transition-colors">{s.symbol}</span>
              <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${s.changePct >= 0 ? 'text-bull' : 'text-bear'}`}>
                {s.changePct >= 0 ? '\u25B2' : '\u25BC'} {Math.abs(s.changePct).toFixed(1)}%
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
