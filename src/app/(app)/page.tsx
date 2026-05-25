'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getScoreColor } from '@/components/charts/AlphaScoreGauge';
import { formatCurrency, formatCompact } from '@/lib/utils/formatters';
import { Search, Plus, TrendingUp, TrendingDown, Bell } from 'lucide-react';

interface StockRow {
  symbol: string; name: string; price: number; changePct: number;
  alphaScore: number; grade: string; signal: string; sector: string;
}

interface IndexQuote { symbol: string; label: string; price: number; changePct: number; }

const SECTOR_SCORES: { sector: string; score: number }[] = [
  { sector: 'Technology',       score: 76 },
  { sector: 'Healthcare',       score: 68 },
  { sector: 'Financials',       score: 64 },
  { sector: 'Comm Services',    score: 72 },
  { sector: 'Consumer Disc.',   score: 54 },
  { sector: 'Industrials',      score: 62 },
  { sector: 'Energy',           score: 48 },
  { sector: 'Real Estate',      score: 42 },
];

const MOCK_ALERTS = [
  { symbol: 'NVDA', age: '2h', type: 'SCORE_UP',  typeColor: '#00D97E', msg: 'AlphaScore 81→87 (+6) — Momentum +0.4' },
  { symbol: 'TSLA', age: '6h', type: 'FLAG',      typeColor: '#FF4D6D', msg: 'Beneish M-Score crossed -1.78 threshold' },
  { symbol: 'AMD',  age: '9h', type: 'INSIDER',   typeColor: '#F5A623', msg: 'CFO net purchase $2.1M (Form 4)' },
  { symbol: 'META', age: '1d', type: 'EARN',      typeColor: '#3B82F6', msg: 'EPS revisions mean +4.2% over last 30d' },
  { symbol: 'PTON', age: '2d', type: 'AVOID',     typeColor: '#FF4D6D', msg: 'Score dropped to F (22) — EQS 31, CER 18' },
];

function signalChipClass(signal: string) {
  if (signal.includes('BUY')) return 'obs-chip-green';
  if (signal.includes('AVOID') || signal.includes('SELL')) return 'obs-chip-red';
  if (signal.includes('WATCH')) return 'obs-chip-blue';
  return 'obs-chip-gold';
}

export default function DashboardPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [indices, setIndices] = useState<IndexQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    // Fetch screener data
    fetch('/api/screener')
      .then(r => r.json())
      .then(d => { if (d.stocks) setStocks(d.stocks); })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch index quotes
    fetch('/api/bulk-quote?symbols=^GSPC,^IXIC,^RUT,^VIX')
      .then(r => r.json())
      .then(d => {
        setIndices([
          { symbol: '^GSPC', label: 'S&P 500',  price: d['^GSPC']?.price || 0, changePct: d['^GSPC']?.changePct || 0 },
          { symbol: '^IXIC', label: 'NASDAQ',   price: d['^IXIC']?.price || 0, changePct: d['^IXIC']?.changePct || 0 },
          { symbol: '^RUT',  label: 'RUSSELL',  price: d['^RUT']?.price  || 0, changePct: d['^RUT']?.changePct  || 0 },
          { symbol: '^VIX',  label: 'VIX',      price: d['^VIX']?.price  || 0, changePct: d['^VIX']?.changePct  || 0 },
        ]);
      }).catch(() => {});

    // Fetch watchlist
    fetch('/api/watchlist')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setWatchlist(d); })
      .catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/stock/${query.trim().toUpperCase()}`);
  };

  const topMovers = [...stocks].sort((a, b) => b.changePct - a.changePct).slice(0, 5);
  const watchlistStocks = watchlist.length > 0
    ? stocks.filter(s => watchlist.includes(s.symbol))
    : stocks.slice(0, 10);

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1400, margin: '0 auto' }}>

      {/* ── Index Bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-white/[0.06]">
        {indices.length > 0 ? indices.map((idx, i) => (
          <div key={idx.symbol} className={`px-5 py-4 ${i < 3 ? 'border-r border-white/[0.06]' : ''}`}>
            <div className="obs-label text-[9px] mb-1">{idx.label}</div>
            <div className="font-mono text-xl font-bold">{idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="font-mono text-xs mt-0.5" style={{ color: idx.changePct >= 0 ? '#00D97E' : '#FF4D6D' }}>
              {idx.changePct >= 0 ? '+' : ''}{idx.changePct.toFixed(2)}%
            </div>
          </div>
        )) : [
          { label: 'S&P 500', val: '5,842.11', chg: '+0.42%', up: true },
          { label: 'NASDAQ',  val: '18,942.84', chg: '+0.68%', up: true },
          { label: 'RUSSELL', val: '2,214.12', chg: '−0.18%', up: false },
          { label: 'VIX',     val: '14.82',    chg: '−4.8%',  up: false },
        ].map((idx, i) => (
          <div key={idx.label} className={`px-5 py-4 ${i < 3 ? 'border-r border-white/[0.06]' : ''}`}>
            <div className="obs-label text-[9px] mb-1">{idx.label}</div>
            <div className="font-mono text-xl font-bold">{idx.val}</div>
            <div className="font-mono text-xs mt-0.5" style={{ color: idx.up ? '#00D97E' : '#FF4D6D' }}>{idx.chg}</div>
          </div>
        ))}
      </div>

      {/* ── Search bar ── */}
      <div className="px-5 py-3 border-b border-white/[0.06]" style={{ background: 'var(--color-surface)' }}>
        <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-accent text-sm">{'>'}</span>
            <input
              type="text" value={query} onChange={e => setQuery(e.target.value.toUpperCase())}
              placeholder="ENTER TICKER SYMBOL..."
              className="w-full pl-7 pr-4 py-2 font-mono text-sm uppercase border border-white/[0.08] outline-none focus:border-accent/50 transition-colors"
              style={{ background: 'var(--color-surface-2)', color: 'var(--color-foreground)' }}
            />
          </div>
          <button type="submit" className="obs-btn !py-2 !px-4 text-[10px]" style={{ borderColor: '#00D97E', color: '#00D97E' }}>
            EXECUTE
          </button>
        </form>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">

        {/* Left: Watchlist table */}
        <div className="border-r border-white/[0.06]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="obs-label">WATCHLIST · {watchlistStocks.length}</span>
            </div>
            <Link href="/watchlist" className="obs-btn !py-1 !px-3 text-[9px] flex items-center gap-1">
              <Plus className="w-3 h-3" /> ADD
            </Link>
          </div>

          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full text-left border-collapse" style={{ minWidth: 700 }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['TICKER', 'NAME', 'ALPHA', 'G', 'SIG', 'PRICE', 'Δ 1D', 'FLAGS'].map(h => (
                    <th key={h} className="px-4 py-2.5 obs-label text-[9px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 rounded animate-pulse" style={{ background: 'var(--color-surface-3)', width: j === 1 ? 80 : 40 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : watchlistStocks.map(s => {
                  const col = getScoreColor(s.alphaScore);
                  const flagCount = s.alphaScore < 40 ? 3 : s.alphaScore < 55 ? 1 : 0;
                  return (
                    <tr key={s.symbol} className="obs-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-4 py-2.5">
                        <Link href={`/stock/${s.symbol}`} className="font-mono text-sm font-bold hover:text-accent transition-colors" style={{ color: col }}>
                          {s.symbol}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-muted max-w-[120px] truncate">{s.name}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-10 h-[2px]" style={{ background: 'var(--color-surface-3)' }}>
                            <div className="h-full" style={{ width: `${s.alphaScore}%`, background: col }} />
                          </div>
                          <span className="font-mono text-xs font-bold" style={{ color: col }}>{s.alphaScore}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="obs-chip text-[9px]" style={{ borderColor: col, color: col, background: col + '1F' }}>
                          {s.grade}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`obs-chip text-[9px] ${signalChipClass(s.signal)}`}>{s.signal}</span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs">{formatCurrency(s.price)}</td>
                      <td className="px-4 py-2.5 font-mono text-xs font-bold" style={{ color: s.changePct >= 0 ? '#00D97E' : '#FF4D6D' }}>
                        {s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[10px]" style={{ color: '#F5A623' }}>
                        {flagCount > 0 ? `⚠ ${flagCount}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom: Top Movers + Sector Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-white/[0.06]">
            {/* Top Movers */}
            <div className="p-5 border-r border-white/[0.06]">
              <div className="obs-label mb-3">TOP MOVERS</div>
              {topMovers.map((s, i) => (
                <Link key={s.symbol} href={`/stock/${s.symbol}`}
                  className="obs-row-hover flex items-center gap-3 py-2 border-b border-white/[0.04]">
                  <span className="font-mono text-[10px] text-muted w-4">{i + 1}</span>
                  <span className="font-mono text-sm font-bold w-14" style={{ color: '#00D97E' }}>{s.symbol}</span>
                  <span className="obs-chip text-[9px]" style={{ borderColor: getScoreColor(s.alphaScore), color: getScoreColor(s.alphaScore), background: getScoreColor(s.alphaScore) + '1F' }}>
                    {s.grade} {s.alphaScore}
                  </span>
                  <span className="font-mono text-xs ml-auto" style={{ color: '#00D97E' }}>+{s.changePct.toFixed(2)}%</span>
                </Link>
              ))}
            </div>

            {/* Sector AlphaScore */}
            <div className="p-5">
              <div className="obs-label mb-3">SECTOR ALPHASCORE</div>
              {SECTOR_SCORES.map(s => {
                const c = getScoreColor(s.score);
                return (
                  <div key={s.sector} className="flex items-center gap-3 py-1.5">
                    <span className="font-mono text-[10px] text-muted w-28 shrink-0">{s.sector}</span>
                    <div className="flex-1 h-[3px]" style={{ background: 'var(--color-surface-3)' }}>
                      <div className="h-full" style={{ width: `${s.score}%`, background: c }} />
                    </div>
                    <span className="font-mono text-xs font-bold w-6 text-right" style={{ color: c }}>{s.score}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Alerts Feed */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-3.5 h-3.5 text-muted-2" />
            <span className="obs-label">ALERTS · LIVE</span>
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse ml-auto" />
          </div>
          <div className="space-y-3">
            {MOCK_ALERTS.map((a, i) => (
              <Link key={i} href={`/stock/${a.symbol}`}
                className="obs-row-hover block p-3 border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                style={{ background: 'var(--color-surface-2)' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-sm font-bold" style={{ color: '#00D97E' }}>{a.symbol}</span>
                  <span className="font-mono text-[9px] text-muted">{a.age}</span>
                </div>
                <div className="mb-1.5">
                  <span className="obs-chip text-[8px]" style={{ borderColor: a.typeColor, color: a.typeColor, background: a.typeColor + '1F' }}>
                    {a.type}
                  </span>
                </div>
                <p className="font-mono text-[10px] text-muted leading-snug">{a.msg}</p>
              </Link>
            ))}
          </div>
          <Link href="/settings" className="obs-btn w-full mt-4 justify-center text-[10px]">
            MANAGE ALERTS →
          </Link>
        </div>
      </div>
    </div>
  );
}
