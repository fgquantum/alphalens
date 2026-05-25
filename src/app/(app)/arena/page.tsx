'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Swords, Trophy, TrendingUp, Users, BarChart3, Flame } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────
interface Trader {
  rank: number;
  name: string;
  league: 'Diamond' | 'Platinum' | 'Gold' | 'Silver';
  returnPct: number;
  sharpe: number;
  trades: number;
  streak: number;
  isYou?: boolean;
}

interface TopPosition {
  symbol: string;
  returnPct: number;
  allocation: number;
}

// ── Color Helpers ─────────────────────────────────────────────
const LEAGUE_COLORS: Record<string, string> = {
  Diamond: '#3B82F6',
  Platinum: '#E5E4E2',
  Gold: '#F5A623',
  Silver: '#8892A4',
};

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

// ── Static Data ───────────────────────────────────────────────
const MOCK_LEADERS: Trader[] = [
  { rank: 1, name: '@quant_draft', league: 'Diamond', returnPct: 84.2, sharpe: 2.41, trades: 342, streak: 12 },
  { rank: 2, name: '@midnight_alpha', league: 'Diamond', returnPct: 71.8, sharpe: 2.18, trades: 521, streak: 8 },
  { rank: 3, name: '@vol_whisperer', league: 'Diamond', returnPct: 68.4, sharpe: 1.94, trades: 287, streak: 5 },
  { rank: 4, name: '@mean_reverter', league: 'Platinum', returnPct: 62.1, sharpe: 1.88, trades: 412, streak: 4 },
  { rank: 5, name: '@edge_hunter', league: 'Platinum', returnPct: 58.9, sharpe: 1.71, trades: 199, streak: 3 },
  { rank: 6, name: '@you', league: 'Platinum', returnPct: 54.2, sharpe: 1.62, trades: 178, streak: 7, isYou: true },
  { rank: 7, name: '@sharpe_ratio_x', league: 'Platinum', returnPct: 51.8, sharpe: 1.58, trades: 312, streak: 2 },
  { rank: 8, name: '@low_beta_pro', league: 'Gold', returnPct: 48.2, sharpe: 1.52, trades: 224, streak: 1 },
  { rank: 9, name: '@factor_guy', league: 'Gold', returnPct: 46.1, sharpe: 1.48, trades: 398, streak: 6 },
  { rank: 10, name: '@vwap_only', league: 'Gold', returnPct: 43.9, sharpe: 1.41, trades: 152, streak: 0 },
];

const MOCK_POSITIONS: TopPosition[] = [
  { symbol: 'NVDA', returnPct: 28.4, allocation: 18 },
  { symbol: 'AVGO', returnPct: 14.2, allocation: 12 },
  { symbol: 'LLY', returnPct: 11.8, allocation: 10 },
  { symbol: 'V', returnPct: 8.2, allocation: 9 },
  { symbol: 'MSFT', returnPct: 6.4, allocation: 8 },
];

// ── Arena Page ────────────────────────────────────────────────
export default function ArenaPage() {
  const [activeTab, setActiveTab] = useState('Overall');
  const tabs = ['Overall', 'Diamond', 'Platinum', 'Gold', 'Silver'];

  const leaders = useMemo(() => {
    if (activeTab === 'Overall') return MOCK_LEADERS;
    return MOCK_LEADERS.filter(l => l.league === activeTab);
  }, [activeTab]);

  const you = MOCK_LEADERS.find(l => l.isYou);

  return (
    <div className="max-w-[1400px] mx-auto space-y-0 animate-fade-in">
      {/* ── Hero Header ── */}
      <div className="px-6 py-6 border-b border-white/[0.04]" style={{ background: 'linear-gradient(180deg, var(--color-surface) 0%, var(--color-background) 100%)' }}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <span className="obs-label">ARENA · SEASON 07</span>
            <div className="flex items-baseline gap-4 mt-2">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                Q2 2026 · Merit Leaderboard
              </h1>
              <span className="obs-chip obs-chip-gold text-[9px]">38 DAYS REMAINING</span>
            </div>
            <p className="text-muted text-xs mt-2">
              Rankings by virtual portfolio return %. Elite leagues ranked by Sharpe.{' '}
              <span className="text-muted-2">· Virtual prizes only</span>
            </p>
          </div>
          <div className="flex gap-6 lg:gap-8">
            {[
              { label: 'TRADERS', value: '12,482' },
              { label: 'TRADES TODAY', value: '8,914' },
              { label: 'MEDIAN RET', value: '+4.2%' },
            ].map((m, i) => (
              <div key={i} className="text-right">
                <div className="obs-label text-[9px]">{m.label}</div>
                <div className="font-mono text-lg md:text-xl font-bold mt-1">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px]">
        {/* Left: Leaderboard */}
        <div className="p-6 border-r border-white/[0.04]">
          {/* League tabs */}
          <div className="flex mb-4 border border-white/[0.06]">
            {tabs.map((t, i) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className="flex-1 py-2.5 text-center transition-all"
                style={{
                  background: activeTab === t ? 'var(--color-surface-2)' : 'transparent',
                  color: activeTab === t ? '#00D97E' : 'var(--color-muted)',
                  borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase' as const,
                  cursor: 'pointer',
                  border: 'none',
                  borderRight: i < tabs.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[60px_1fr_90px_70px_70px_60px_60px] px-3.5 py-2 border-b border-white/[0.04]" style={{ background: 'var(--color-surface-2)' }}>
            {['RANK', 'TRADER', 'LEAGUE', 'RETURN', 'SHARPE', 'TRADES', 'STREAK'].map(h => (
              <span key={h} className="obs-label text-[9px]">{h}</span>
            ))}
          </div>

          {/* Rows */}
          {leaders.map(u => (
            <div
              key={u.name}
              className="obs-row-hover grid grid-cols-[60px_1fr_90px_70px_70px_60px_60px] px-3.5 py-3 border-b border-white/[0.04] items-center"
              style={{ background: u.isYou ? 'rgba(0, 217, 126, 0.08)' : 'transparent' }}
            >
              {/* Rank */}
              <span className="font-mono text-sm font-bold" style={{ color: u.rank <= 3 ? '#F5A623' : 'var(--color-foreground)' }}>
                {u.rank <= 3 ? ['◆', '◇', '◇'][u.rank - 1] + ' ' + u.rank : '#' + u.rank}
              </span>

              {/* Trader */}
              <span className="font-mono text-sm" style={{ fontWeight: u.isYou ? 700 : 400, color: u.isYou ? '#00D97E' : 'var(--color-foreground)' }}>
                {u.name}
              </span>

              {/* League chip */}
              <span
                className="obs-chip text-[9px]"
                style={{
                  borderColor: LEAGUE_COLORS[u.league],
                  color: LEAGUE_COLORS[u.league],
                  background: LEAGUE_COLORS[u.league] + '1F',
                }}
              >
                {u.league}
              </span>

              {/* Return */}
              <span className="font-mono text-sm font-bold" style={{ color: '#00D97E' }}>
                +{u.returnPct}%
              </span>

              {/* Sharpe */}
              <span className="font-mono text-xs">{u.sharpe.toFixed(2)}</span>

              {/* Trades */}
              <span className="font-mono text-[11px] text-muted">{u.trades}</span>

              {/* Streak */}
              <span className="font-mono text-[11px]" style={{ color: u.streak >= 5 ? '#F5A623' : 'var(--color-muted)' }}>
                {u.streak > 0 ? `🔥 ${u.streak}` : '—'}
              </span>
            </div>
          ))}
        </div>

        {/* Right: Your Portfolio */}
        <div className="p-5 lg:p-6">
          <div className="obs-label mb-3">YOUR PORTFOLIO</div>

          {/* Portfolio Card */}
          <div className="obs-panel p-5 mb-4">
            <div className="font-mono text-3xl font-bold" style={{ color: '#00D97E', letterSpacing: '-0.02em' }}>
              +{you?.returnPct ?? 54.2}%
            </div>
            <div className="flex gap-4 mt-2">
              <span className="obs-micro">
                RANK <span className="font-mono text-foreground">#{you?.rank ?? 6}</span>
              </span>
              <span className="obs-micro">
                SHARPE <span className="font-mono text-foreground">{you?.sharpe?.toFixed(2) ?? '1.62'}</span>
              </span>
              <span className="obs-micro">
                STREAK <span className="font-mono" style={{ color: '#F5A623' }}>{you?.streak ?? 7}W</span>
              </span>
            </div>

            {/* Equity Curve */}
            <div className="mt-4 pt-4 border-t border-white/[0.04]">
              <div className="obs-label text-[9px] mb-2">EQUITY CURVE · 90D</div>
              <svg width="100%" height="60" viewBox="0 0 320 60" className="block">
                <defs>
                  <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00D97E" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#00D97E" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M 0 50 L 30 48 L 60 42 L 90 45 L 120 38 L 150 32 L 180 28 L 210 24 L 240 20 L 270 14 L 300 12 L 320 8 L 320 60 L 0 60 Z" fill="url(#eqFill)" />
                <path d="M 0 50 L 30 48 L 60 42 L 90 45 L 120 38 L 150 32 L 180 28 L 210 24 L 240 20 L 270 14 L 300 12 L 320 8" fill="none" stroke="#00D97E" strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          {/* Top Positions */}
          <div className="obs-label mb-3">TOP POSITIONS</div>
          {MOCK_POSITIONS.map(p => (
            <Link
              key={p.symbol}
              href={`/stock/${p.symbol}`}
              className="obs-row-hover grid grid-cols-[60px_1fr_50px_50px] gap-2 px-2.5 py-2 border-b border-white/[0.04] items-center"
            >
              <span className="font-mono text-xs font-bold" style={{ color: '#00D97E' }}>{p.symbol}</span>
              <div className="h-[3px] rounded-full" style={{ background: 'var(--color-surface-3)', position: 'relative' }}>
                <div className="absolute inset-0 rounded-full" style={{ width: `${p.allocation * 4}%`, background: '#00D97E' }} />
              </div>
              <span className="font-mono text-[11px] text-muted">{p.allocation}%</span>
              <span className="font-mono text-[11px] text-right" style={{ color: '#00D97E' }}>+{p.returnPct}%</span>
            </Link>
          ))}

          {/* Join CTA */}
          <button
            className="w-full mt-6 py-3 text-center uppercase tracking-widest font-bold text-xs transition-all"
            style={{
              background: '#00D97E',
              color: '#070910',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.12em',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            JOIN ARENA
          </button>
        </div>
      </div>
    </div>
  );
}
