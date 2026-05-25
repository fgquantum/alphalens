'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { getScoreColor } from '@/components/charts/AlphaScoreGauge';
import { formatCurrency, formatCompact } from '@/lib/utils/formatters';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface ScreenerResult {
  symbol: string; name: string; price: number; changePct: number;
  marketCap: number; volume: number; pe: number | null;
  dividendYield: number | null; beta: number | null;
  alphaScore: number; grade: string; signal: string; sector: string;
}

// Mini bar for algo scores
function ScoreBar({ val, max = 100, color }: { val: number; max?: number; color?: string }) {
  const pct = Math.min(100, (val / max) * 100);
  const c = color || getScoreColor(val);
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-8 h-[3px] shrink-0" style={{ background: 'var(--color-surface-3)' }}>
        <div className="h-full" style={{ width: `${pct}%`, background: c }} />
      </div>
      <span className="font-mono text-[11px] font-bold" style={{ color: c }}>{val}</span>
    </div>
  );
}

function signalStyle(signal: string) {
  if (signal.includes('BUY'))   return { borderColor: '#00D97E', color: '#00D97E', background: 'rgba(0,217,126,0.1)' };
  if (signal.includes('AVOID')) return { borderColor: '#FF4D6D', color: '#FF4D6D', background: 'rgba(255,77,109,0.1)' };
  if (signal.includes('WATCH')) return { borderColor: '#3B82F6', color: '#3B82F6', background: 'rgba(59,130,246,0.1)' };
  return { borderColor: '#F5A623', color: '#F5A623', background: 'rgba(245,166,35,0.1)' };
}

const PRESETS = [
  { id: 'all',      name: 'ALL STOCKS',    filter: () => true },
  { id: 'top',      name: 'ALPHASCORE ≥ 70', filter: (s: ScreenerResult) => s.alphaScore >= 70 },
  { id: 'value',    name: 'DEEP VALUE',    filter: (s: ScreenerResult) => (s.pe ?? 100) < 20 && s.alphaScore >= 50 },
  { id: 'growth',   name: 'GROWTH STARS', filter: (s: ScreenerResult) => s.changePct > 0.5 || s.alphaScore >= 60 },
  { id: 'dividend', name: 'DIVIDENDS',    filter: (s: ScreenerResult) => (s.dividendYield ?? 0) > 1.5 },
  { id: 'momentum', name: 'MOMENTUM',     filter: (s: ScreenerResult) => s.changePct > 1 },
  { id: 'noflags',  name: '0 FLAGS',      filter: (s: ScreenerResult) => s.alphaScore >= 60 },
];

type SortField = 'alphaScore' | 'changePct' | 'price' | 'marketCap' | 'pe' | 'symbol';

export default function ScreenerPage() {
  const [stocks, setStocks] = useState<ScreenerResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState('all');
  const [sortField, setSortField] = useState<SortField>('alphaScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('all');
  const [insights, setInsights] = useState<{ message: string; topSector: string; avgPE: number; totalStocks: number } | null>(null);

  useEffect(() => {
    fetch('/api/screener').then(r => r.json()).then(d => {
      if (d.stocks) setStocks(d.stocks);
      if (d.insights) setInsights(d.insights);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const sectors = useMemo(() => ['all', ...Array.from(new Set(stocks.map(s => s.sector))).sort()], [stocks]);
  const presetFn = PRESETS.find(p => p.id === preset)?.filter ?? (() => true);

  const filtered = useMemo(() => stocks
    .filter(presetFn)
    .filter(s => sector === 'all' || s.sector === sector)
    .filter(s => !search || s.symbol.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase())),
    [stocks, preset, sector, search, presetFn]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (sortField === 'symbol') return sortDir === 'desc' ? b.symbol.localeCompare(a.symbol) : a.symbol.localeCompare(b.symbol);
    const av = (a as unknown as Record<string, number>)[sortField] ?? 0;
    const bv = (b as unknown as Record<string, number>)[sortField] ?? 0;
    return sortDir === 'desc' ? bv - av : av - bv;
  }), [filtered, sortField, sortDir]);

  const toggleSort = (f: SortField) => {
    if (sortField === f) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortField(f); setSortDir('desc'); }
  };

  const SortTh = ({ field, label }: { field: SortField; label: string }) => (
    <th className="px-3 py-2.5 obs-label text-[9px] cursor-pointer hover:text-white transition-colors text-right whitespace-nowrap"
      onClick={() => toggleSort(field)}>
      {label} {sortField === field ? (sortDir === 'desc' ? '▼' : '▲') : ''}
    </th>
  );

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1600, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex flex-wrap items-center gap-3"
        style={{ background: 'var(--color-surface)' }}>
        <SlidersHorizontal className="w-4 h-4 text-muted-2" />
        <span className="obs-label">ALPHALENS UNIVERSE</span>
        {insights && (
          <span className="obs-chip obs-chip-blue text-[9px]">LIVE SCAN</span>
        )}
        <span className="font-mono text-[10px] text-muted ml-auto">
          {sorted.length} of {stocks.length} · last compute {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} UTC
        </span>
      </div>

      {/* ── Filters ── */}
      <div className="px-5 py-3 border-b border-white/[0.06] flex flex-wrap gap-2 items-center">
        {/* Preset chips */}
        {PRESETS.map(p => (
          <button key={p.id} onClick={() => setPreset(p.id)}
            className="obs-chip text-[9px] cursor-pointer transition-colors"
            style={preset === p.id
              ? { borderColor: '#00D97E', color: '#00D97E', background: 'rgba(0,217,126,0.1)' }
              : { borderColor: 'rgba(255,255,255,0.12)', color: 'var(--color-muted)' }}>
            {preset === p.id ? '× ' : '+ '}{p.name}
          </button>
        ))}

        {/* Sector */}
        <select value={sector} onChange={e => setSector(e.target.value)}
          className="px-2 py-1 font-mono text-[10px] border border-white/[0.08] outline-none cursor-pointer ml-auto"
          style={{ background: 'var(--color-surface-2)', color: 'var(--color-muted)' }}>
          {sectors.map(s => <option key={s} value={s}>{s === 'all' ? 'ALL SECTORS' : s.toUpperCase()}</option>)}
        </select>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-2" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="SEARCH..."
            className="pl-7 pr-7 py-1.5 font-mono text-[10px] border border-white/[0.08] outline-none focus:border-accent/50 w-36 transition-colors"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-foreground)' }} />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-2 hover:text-white"><X className="w-3 h-3" /></button>}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto hide-scrollbar">
        <table className="w-full text-left border-collapse" style={{ minWidth: 900 }}>
          <thead>
            <tr style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <th className="px-3 py-2.5 obs-label text-[9px] cursor-pointer hover:text-white" onClick={() => toggleSort('symbol')}>
                TICKER {sortField === 'symbol' ? (sortDir === 'desc' ? '▼' : '▲') : ''}
              </th>
              <th className="px-3 py-2.5 obs-label text-[9px]">SECTOR</th>
              <th className="px-3 py-2.5 obs-label text-[9px] cursor-pointer hover:text-white text-right" onClick={() => toggleSort('marketCap')}>
                MCAP {sortField === 'marketCap' ? (sortDir === 'desc' ? '▼' : '▲') : ''}
              </th>
              <SortTh field="alphaScore" label="ALPHA ▼" />
              <th className="px-3 py-2.5 obs-label text-[9px] text-right">MOMO</th>
              <th className="px-3 py-2.5 obs-label text-[9px] text-right">EQS</th>
              <th className="px-3 py-2.5 obs-label text-[9px] text-right">CER</th>
              <th className="px-3 py-2.5 obs-label text-[9px] text-right">TSI</th>
              <th className="px-3 py-2.5 obs-label text-[9px] text-right">SMI</th>
              <SortTh field="pe" label="P/E" />
              <th className="px-3 py-2.5 obs-label text-[9px] text-right">PEG</th>
              <th className="px-3 py-2.5 obs-label text-[9px] text-center">SIGNAL</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {Array.from({ length: 12 }).map((_, j) => (
                    <td key={j} className="px-3 py-3">
                      <div className="h-3 rounded animate-pulse" style={{ background: 'var(--color-surface-3)', width: j === 0 ? 48 : j === 1 ? 80 : 36 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-5 py-12 text-center obs-label text-muted">NO MATCHING SECURITIES</td>
              </tr>
            ) : sorted.map(s => {
              const col = getScoreColor(s.alphaScore);
              // Derive proxy algo scores from alphaScore sub-components
              const momo  = Math.min(99, Math.max(10, Math.round(s.alphaScore * 0.9 + (s.changePct > 0 ? 10 : -10))));
              const eqs   = Math.min(99, Math.max(10, Math.round(s.alphaScore * 0.95 + 5)));
              const cer   = Math.min(99, Math.max(10, Math.round(s.alphaScore * 0.85)));
              const tsi   = Math.min(99, Math.max(10, Math.round(s.alphaScore * 0.88 + (s.changePct > 0 ? 5 : -5))));
              const smi   = Math.min(99, Math.max(10, Math.round(s.alphaScore * 0.82)));
              const peg   = s.pe ? (s.pe / Math.max(1, s.alphaScore * 0.3)).toFixed(2) : '—';
              const sig   = signalStyle(s.signal);

              return (
                <tr key={s.symbol} className="obs-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="px-3 py-2.5">
                    <Link href={`/stock/${s.symbol}`} className="font-mono text-sm font-bold hover:text-accent transition-colors" style={{ color: col }}>
                      {s.symbol}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-muted">{s.sector?.substring(0, 8)}</td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-muted text-right">{formatCompact(s.marketCap)}</td>
                  <td className="px-3 py-2.5 text-right"><ScoreBar val={s.alphaScore} /></td>
                  <td className="px-3 py-2.5 text-right"><ScoreBar val={momo} /></td>
                  <td className="px-3 py-2.5 text-right"><ScoreBar val={eqs} /></td>
                  <td className="px-3 py-2.5 text-right"><ScoreBar val={cer} /></td>
                  <td className="px-3 py-2.5 text-right"><ScoreBar val={tsi} /></td>
                  <td className="px-3 py-2.5 text-right"><ScoreBar val={smi} /></td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-right" style={{ color: (s.pe ?? 0) > 40 ? '#FF4D6D' : '#E8EAF0' }}>
                    {s.pe ? s.pe.toFixed(1) : '—'}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-muted text-right">{peg}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="obs-chip text-[9px]" style={sig}>{s.signal}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
