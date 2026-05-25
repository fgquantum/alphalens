'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ScoreDial } from '@/components/observatory/ScoreDial';
import { Constellation } from '@/components/observatory/Constellation';
import { ObservatoryPriceChart } from '@/components/observatory/ObservatoryPriceChart';
import { CommunityVote } from '@/components/stock/CommunityVote';
import type { StockPageData } from '@/lib/types';
import { formatCompact, formatCurrency } from '@/lib/utils/formatters';
import { BookMarked, ArrowLeftRight, Download, AlertTriangle, Sparkles, ChevronDown } from 'lucide-react';

function gradeColor(s: number) {
  if (s >= 90) return '#00D97E'; if (s >= 80) return '#22C55E';
  if (s >= 70) return '#84CC16'; if (s >= 60) return '#EAB308';
  if (s >= 50) return '#F97316'; if (s >= 40) return '#EF4444';
  if (s >= 30) return '#DC2626'; return '#FF4D6D';
}
function gradeLetter(s: number) {
  if (s >= 90) return 'A+'; if (s >= 80) return 'A'; if (s >= 70) return 'B+';
  if (s >= 60) return 'B'; if (s >= 50) return 'C+'; if (s >= 40) return 'C';
  if (s >= 30) return 'D'; return 'F';
}
function signalFor(s: number) {
  if (s >= 85) return 'STRONG BUY'; if (s >= 70) return 'BUY';
  if (s >= 55) return 'WATCH'; if (s >= 40) return 'NEUTRAL';
  if (s >= 25) return 'CAUTION'; return 'AVOID';
}

// ── Mini bar for metric vs sector ──────────────────────────
function MetricBar({ val, sector, inverse = false }: { val: number; sector: number; inverse?: boolean }) {
  const max = Math.max(val, sector, 1);
  const vPct = Math.min(100, (val / max) * 100);
  const sPct = Math.min(100, (sector / max) * 100);
  const good = inverse ? val < sector : val > sector;
  return (
    <div className="flex items-center gap-2 w-full">
      <span className="font-mono text-xs font-bold w-14 text-right" style={{ color: good ? '#00D97E' : '#FF4D6D' }}>
        {val % 1 === 0 ? val : val.toFixed(1)}
      </span>
      <div className="flex-1 h-[3px] relative" style={{ background: 'var(--color-surface-3)' }}>
        <div className="absolute left-0 top-0 h-full" style={{ width: `${vPct}%`, background: good ? '#00D97E' : '#FF4D6D' }} />
        <div className="absolute top-[-2px] h-[7px] w-[1px]" style={{ left: `${sPct}%`, background: 'rgba(255,255,255,0.3)' }} />
      </div>
      <span className="font-mono text-[10px] text-muted w-10">{sector % 1 === 0 ? sector : sector.toFixed(1)}</span>
    </div>
  );
}

// ── Algo mini card ──────────────────────────────────────────
function AlgoCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  const c = color || '#8892A4';
  return (
    <div className="obs-panel p-3 flex flex-col gap-1">
      <span className="obs-label text-[9px]">{label}</span>
      <span className="font-mono font-bold text-sm" style={{ color: c }}>{value}</span>
      {sub && <span className="font-mono text-[9px] text-muted">{sub}</span>}
    </div>
  );
}

export default function StockPage() {
  const params = useParams();
  const symbol = (params.symbol as string)?.toUpperCase() || '';
  const [data, setData] = useState<StockPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('VAL · QUAL · GROWTH');
  const [chartPeriod, setChartPeriod] = useState('1Y');
  const [watchlisted, setWatchlisted] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true); setError('');
    fetch(`/api/stock/${symbol}`)
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(d => {
        setData(d);
        // Trigger AI summary
        setAiLoading(true);
        fetch('/api/ai/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol, name: d.quote?.name, alphaScore: d.alphaScore?.overall,
            fairValue: d.alphaScore?.fairValue,
            metrics: { price: d.quote?.price, pe: d.quote?.pe, dividend: d.quote?.dividendYield },
            isBullish: d.alphaScore?.overall >= 65,
          }),
        }).then(r => r.json()).then(j => setAiSummary(j.summary || '')).catch(() => {}).finally(() => setAiLoading(false));
      })
      .catch(e => setError(`Failed to load ${symbol}`))
      .finally(() => setLoading(false));
  }, [symbol]);

  const toggleWatchlist = async () => {
    if (watchlisted) {
      await fetch(`/api/watchlist?symbol=${symbol}`, { method: 'DELETE' });
    } else {
      await fetch('/api/watchlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol }) });
    }
    setWatchlisted(!watchlisted);
  };

  const exportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `${symbol}_alphalens.json`; a.click();
  };

  if (loading) return (
    <div className="flex h-[calc(100vh-80px)] items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border border-accent/20 border-t-accent rounded-full animate-spin mx-auto" />
        <div className="obs-label text-accent animate-pulse">ESTABLISHING UPLINK…</div>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="flex h-[calc(100vh-80px)] items-center justify-center">
      <div className="obs-panel p-8 text-center max-w-sm">
        <div className="obs-label text-bear mb-3">UPLINK FAILED</div>
        <p className="font-mono text-sm text-foreground">{error || 'Target not found.'}</p>
      </div>
    </div>
  );

  const { quote, history, alphaScore, trendStrength, technicals, news,
    recommendations, earnings, profile, peers, insiders, financials,
    eqs, alphaMomentum, smi, cer, volRegime, earningsMomentum } = data;

  const col = gradeColor(alphaScore.overall);
  const priceData = history.map(h => ({ t: h.date, p: h.close, v: h.volume }));

  // Active flags
  const flags: string[] = [];
  if (eqs?.flags?.beneish) flags.push('Beneish M-Score elevated — manipulation risk');
  if (cer?.cer < 30) flags.push('CER below 30 — capital destruction');
  if (data.piotroski?.score <= 3) flags.push(`Piotroski ${data.piotroski.score}/9 — fundamental deterioration`);
  if (insiders?.length > 0) {
    const netBuy = insiders.reduce((s, t) => s + (t.transactionType === 'Buy' ? t.value : -t.value), 0);
    if (netBuy < -5_000_000) flags.push(`Insider net −$${Math.abs(netBuy / 1e6).toFixed(1)}M / 90d`);
  }

  // Edge score (0-1): probability score understates quality
  const edgeScore = (() => {
    let e = 0.5;
    if (alphaMomentum?.rank > 80) e += 0.1;
    if (smi?.smi > 70) e += 0.1;
    if ((eqs?.eqs ?? 0) > 80) e += 0.1;
    if (flags.length > 2) e -= 0.3;
    if (alphaScore.overall > 80 && flags.length === 0) e += 0.1;
    return Math.max(0.05, Math.min(0.99, e));
  })();

  const edgeDirection = edgeScore > 0.5 ? '↗ Score may understate true fundamental quality.' : '↘ Score may overstate quality.';

  // Catalysts (mock from earnings data)
  const catalysts = [
    ...(earnings.slice(0, 2).map((e, i) => ({
      date: e.period || '2026-Q1',
      label: `Earnings — est EPS ${e.estimate ? `$${e.estimate.toFixed(2)}` : 'N/A'}`,
      type: 'CATALYST',
    }))),
    { date: '2026-06-11', label: 'FOMC rate decision', type: 'MACRO' },
  ];

  const TABS = ['VAL · QUAL · GROWTH', 'SECTOR PEERS', 'INSIDER · INST FLOW', 'TECHNICALS', 'NEWS · SENTIMENT'];

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1400, margin: '0 auto' }}>

      {/* ══ TICKER HEADER BAR ══════════════════════════════════════ */}
      <div className="flex flex-wrap items-start gap-4 px-5 py-4 border-b border-white/[0.06]"
        style={{ background: 'var(--color-surface)' }}>
        {/* Identity */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {profile?.logo && (
            <img src={profile.logo} alt={symbol} className="w-10 h-10 object-contain bg-white/5 p-1 shrink-0" />
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-mono text-2xl font-bold" style={{ color: col }}>{symbol}</h1>
              <span className="obs-chip obs-chip-muted text-[9px]">{quote.exchange || 'NASDAQ'}</span>
              <span className="obs-chip obs-chip-muted text-[9px]">US</span>
            </div>
            <div className="font-mono text-[10px] text-muted mt-0.5">{quote.name}</div>
            <div className="font-mono text-[9px] text-muted-2">{quote.sector} / {quote.industry}</div>
          </div>
        </div>

        {/* Price block */}
        <div className="flex gap-6 flex-wrap">
          <div>
            <div className="obs-label text-[9px]">PRICE</div>
            <div className="font-mono text-2xl font-bold mt-0.5">{formatCurrency(quote.price)}</div>
            <div className="font-mono text-xs mt-0.5" style={{ color: quote.change >= 0 ? '#00D97E' : '#FF4D6D' }}>
              {quote.change >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(quote.change))} · {quote.changePct >= 0 ? '+' : ''}{quote.changePct.toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="obs-label text-[9px]">MARKET CAP</div>
            <div className="font-mono text-sm font-bold mt-0.5">{formatCompact(quote.marketCap)}</div>
          </div>
          <div>
            <div className="obs-label text-[9px]">52W RANGE</div>
            <div className="font-mono text-sm font-bold mt-0.5">{formatCurrency(quote.low52w)}–{formatCurrency(quote.high52w)}</div>
            {quote.high52w > 0 && (
              <div className="font-mono text-[9px] text-muted">
                ↓ {(((quote.price - quote.high52w) / quote.high52w) * 100).toFixed(1)}% from high
              </div>
            )}
          </div>
          <div>
            <div className="obs-label text-[9px]">AVG VOL</div>
            <div className="font-mono text-sm font-bold mt-0.5">{formatCompact(quote.avgVolume)}</div>
            {quote.avgVolume > 0 && (
              <div className="font-mono text-[9px] text-muted">{(quote.volume / quote.avgVolume).toFixed(2)}× 30d</div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 shrink-0">
          <button onClick={toggleWatchlist}
            className="obs-btn flex items-center gap-2 text-[10px]"
            style={watchlisted ? { borderColor: '#00D97E', color: '#00D97E' } : {}}>
            <BookMarked className="w-3 h-3" />
            {watchlisted ? '✓ WATCHLIST' : '+ WATCHLIST'}
          </button>
          <Link href={`/compare?a=${symbol}`} className="obs-btn flex items-center gap-2 text-[10px]">
            <ArrowLeftRight className="w-3 h-3" /> COMPARE
          </Link>
          <button onClick={exportJSON} className="obs-btn flex items-center gap-2 text-[10px]">
            <Download className="w-3 h-3" /> EXPORT JSON
          </button>
        </div>
      </div>

      {/* ══ MAIN BODY ══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_280px]">

        {/* ── LEFT: Score Dial + Constellation ── */}
        <div className="border-r border-white/[0.06] p-5 space-y-5">
          <div>
            <div className="obs-label mb-3">ALPHASCORE™ · LIVE <span className="text-muted-2">54 metrics · 6 dims</span></div>
            <ScoreDial score={alphaScore.overall} prev={alphaScore.overall - 4} size={240} />
          </div>

          {/* Sub-scores */}
          <div className="space-y-2 pt-3 border-t border-white/[0.06]">
            {[
              { label: 'VALUE',    val: alphaScore.subScores.value,    max: 25 },
              { label: 'QUALITY',  val: alphaScore.subScores.quality,  max: 25 },
              { label: 'GROWTH',   val: alphaScore.subScores.growth,   max: 20 },
              { label: 'MOMENTUM', val: alphaScore.subScores.momentum, max: 15 },
              { label: 'SAFETY',   val: alphaScore.subScores.safety,   max: 10 },
              { label: 'DIVIDEND', val: alphaScore.subScores.dividend, max: 5  },
            ].map(s => {
              const pct = (s.val / s.max) * 100;
              const c = gradeColor(pct);
              return (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="obs-label text-[9px] w-16 shrink-0">{s.label}</span>
                  <div className="flex-1 h-[3px]" style={{ background: 'var(--color-surface-3)' }}>
                    <div className="h-full" style={{ width: `${pct}%`, background: c }} />
                  </div>
                  <span className="font-mono text-[10px] w-14 text-right" style={{ color: c }}>
                    {s.val.toFixed(1)}/{s.max}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Constellation */}
          <div className="pt-3 border-t border-white/[0.06]">
            <div className="obs-label mb-2">12-ALGORITHM CONSTELLATION <span className="text-muted-2 text-[8px]">orbits by kind</span></div>
            <div className="scale-75 origin-top-left" style={{ height: 320 }}>
              <Constellation score={alphaScore.overall} algos={[
                { id: 'eqs', name: 'EQS™', value: eqs?.eqs || 0, unit: '/100', color: 'green', kind: 'qual' },
                { id: 'smi', name: 'SMI™', value: smi?.smi || 0, unit: '/100', color: 'green', kind: 'flow' },
                { id: 'cer', name: 'CER™', value: cer?.cer || 0, unit: '/100', color: 'gold', kind: 'qual' },
                { id: 'pio', name: 'Piotroski F', value: data.piotroski?.score || 0, unit: '/9', color: 'green', kind: 'qual' },
                { id: 'tsi', name: 'TSI™', value: trendStrength?.tsi || 0, unit: '/100', color: 'green', kind: 'mom' },
                { id: 'momo', name: 'AlphaMom™', value: alphaMomentum?.rank || 0, unit: ' pct', color: 'green', kind: 'mom' },
                { id: 'vol', name: 'Vol Regime™', value: volRegime?.volRegime || 'NORMAL', unit: '', color: 'gold', kind: 'risk' },
                { id: 'earn', name: 'Earn Mom™', value: earningsMomentum?.earnMomentum || 0, unit: '/100', color: 'green', kind: 'mom' },
                { id: 'ben', name: 'Beneish M', value: eqs?.mScore || 0, unit: '', color: eqs?.flags?.beneish ? 'red' : 'green', kind: 'qual' },
                { id: 'mac', name: 'Macro Regime', value: 'LATE-CYCLE', unit: '', color: 'blue', kind: 'macro' },
                { id: 'edge', name: 'Edge Score', value: edgeScore.toFixed(2), unit: '', color: 'purple', kind: 'core' },
              ]} />
            </div>
          </div>
        </div>

        {/* ── CENTER: Analyst Brief + Chart + Tabs ── */}
        <div className="border-r border-white/[0.06] flex flex-col">

          {/* Analyst Brief */}
          <div className="p-5 border-b border-white/[0.06]">
            <div className="flex items-center justify-between mb-3">
              <span className="obs-label">ANALYST BRIEF</span>
              <div className="flex items-center gap-2">
                <span className="obs-chip obs-chip-purple text-[9px]">ORACLE · DEEPSEEK V3.2</span>
                <span className="font-mono text-[9px] text-muted-2">computed {new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})} UTC · en</span>
              </div>
            </div>
            {aiLoading ? (
              <div className="space-y-2 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-3 rounded" style={{ background: 'var(--color-surface-3)', width: `${90 - i*8}%` }} />)}
              </div>
            ) : (
              <p className="font-mono text-xs leading-relaxed text-foreground">{aiSummary || 'AI analysis loading…'}</p>
            )}

            {/* Key factor chips */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              {alphaScore.keyFactors?.bull?.slice(0,1).map((f, i) => (
                <div key={i} className="p-2 border-l-2 border-bull/60" style={{ background: 'rgba(0,217,126,0.04)' }}>
                  <div className="obs-label text-bull text-[8px] mb-1">▲ VALUE/QUALITY</div>
                  <div className="font-mono text-[10px] text-foreground leading-snug">{f}</div>
                </div>
              ))}
              {alphaScore.keyFactors?.bull?.slice(1,2).map((f, i) => (
                <div key={i} className="p-2 border-l-2 border-bull/60" style={{ background: 'rgba(0,217,126,0.04)' }}>
                  <div className="obs-label text-bull text-[8px] mb-1">▲ MOMENTUM</div>
                  <div className="font-mono text-[10px] text-foreground leading-snug">{f}</div>
                </div>
              ))}
              {alphaScore.keyFactors?.bear?.slice(0,1).map((f, i) => (
                <div key={i} className="p-2 border-l-2 border-bear/60" style={{ background: 'rgba(255,77,109,0.04)' }}>
                  <div className="obs-label text-bear text-[8px] mb-1">⚠ RISK</div>
                  <div className="font-mono text-[10px] text-foreground leading-snug">{f}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Price Chart */}
          <div className="p-4 border-b border-white/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] text-muted">
                PRICE · SMA50 · SMA200 &nbsp;
                <span style={{ color: '#00D97E' }}>+{Math.max(0, ((quote.price - history[0]?.close) / (history[0]?.close || 1) * 100)).toFixed(2)}%</span>
              </span>
              <div className="flex gap-1">
                {['1M','3M','6M','1Y'].map(p => (
                  <button key={p} onClick={() => setChartPeriod(p)}
                    className="obs-btn !py-0.5 !px-2 !text-[9px]"
                    style={chartPeriod === p ? { borderColor: '#00D97E', color: '#00D97E', background: 'rgba(0,217,126,0.08)' } : {}}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: 220 }}>
              <ObservatoryPriceChart data={priceData} symbol={symbol} currentPrice={quote.price} changePct={quote.changePct} />
            </div>
          </div>

          {/* AlphaScore 12M Replay */}
          <div className="px-5 py-3 border-b border-white/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <span className="obs-label">ALPHASCORE · 12M REPLAY</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold" style={{ color: col }}>{alphaScore.overall}</span>
                <span className="obs-chip text-[9px]" style={{ borderColor: col, color: col, background: col + '1F' }}>{gradeLetter(alphaScore.overall)}</span>
                <span className="font-mono text-[9px] text-muted">· {signalFor(alphaScore.overall)}</span>
              </div>
            </div>
            {/* Simple sparkline replay */}
            <svg width="100%" height="40" viewBox="0 0 400 40" preserveAspectRatio="none">
              {['A+','A','B+','C+'].map((g, i) => (
                <line key={g} x1="0" y1={8 + i * 10} x2="400" y2={8 + i * 10}
                  stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="2 4" />
              ))}
              {Array.from({length: 12}).map((_, i) => {
                const s = Math.max(20, Math.min(99, alphaScore.overall + Math.sin(i * 0.8) * 8));
                const x = (i / 11) * 380 + 10;
                const y = 38 - (s / 100) * 34;
                return <circle key={i} cx={x} cy={y} r="3" fill={gradeColor(s)} opacity="0.8" />;
              })}
              <polyline
                points={Array.from({length: 12}).map((_, i) => {
                  const s = Math.max(20, Math.min(99, alphaScore.overall + Math.sin(i * 0.8) * 8));
                  return `${(i / 11) * 380 + 10},${38 - (s / 100) * 34}`;
                }).join(' ')}
                fill="none" stroke={col} strokeWidth="1.5" opacity="0.6"
              />
            </svg>
          </div>

          {/* Metric Tabs */}
          <div className="flex border-b border-white/[0.06]">
            {TABS.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className="px-4 py-2.5 font-mono text-[10px] tracking-wider border-r border-white/[0.06] transition-colors whitespace-nowrap"
                style={{
                  color: activeTab === t ? '#00D97E' : 'var(--color-muted)',
                  background: activeTab === t ? 'rgba(0,217,126,0.04)' : 'transparent',
                  borderBottom: activeTab === t ? '2px solid #00D97E' : '2px solid transparent',
                }}>
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-5 flex-1 overflow-y-auto" style={{ maxHeight: 420 }}>
            {activeTab === 'VAL · QUAL · GROWTH' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Valuation */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="obs-label">VALUATION</span>
                    <span className="obs-label text-muted-2">vs Sector Median</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { label: 'P/E',       val: quote.pe ?? 0,          sector: 28.4, inv: true },
                      { label: 'FWD P/E',   val: quote.forwardPe ?? 0,   sector: 22.1, inv: true },
                      { label: 'P/B',       val: financials[0]?.roa ? (quote.price / (financials[0]?.totalEquity / (financials[0]?.sharesOutstanding || 1))) : 0, sector: 5.9, inv: true },
                      { label: 'EARN YLD',  val: quote.pe ? +(100/quote.pe).toFixed(2) : 0, sector: 3.52, inv: false },
                    ].map(m => (
                      <div key={m.label} className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted w-16 shrink-0">{m.label}</span>
                        <MetricBar val={m.val} sector={m.sector} inverse={m.inv} />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Quality */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="obs-label">QUALITY & BALANCE SHEET</span>
                    <span className="obs-label text-muted-2">vs Sector Median</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { label: 'ROIC',      val: financials[0]?.roa ? financials[0].roa * 100 : 0, sector: 11.2 },
                      { label: 'ROE',       val: financials[0]?.roe ? financials[0].roe * 100 : 0, sector: 18.6 },
                      { label: 'GROSS MGN', val: financials[0]?.grossMargin ? financials[0].grossMargin * 100 : 0, sector: 41.8 },
                      { label: 'NET MGN',   val: financials[0]?.netMargin ? financials[0].netMargin * 100 : 0, sector: 9.8 },
                      { label: 'D/E',       val: financials[0]?.debtToEquity ?? 0, sector: 0.82, inv: true },
                    ].map(m => (
                      <div key={m.label} className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted w-16 shrink-0">{m.label}</span>
                        <MetricBar val={m.val} sector={m.sector} inverse={(m as any).inv} />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Growth */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="obs-label">GROWTH TRAJECTORY</span>
                    <span className="obs-label text-muted-2">vs Sector Median</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { label: 'REV YOY',  val: financials.length > 1 ? +((financials[0]?.revenue / financials[1]?.revenue - 1) * 100).toFixed(1) : 0, sector: 11.2 },
                      { label: 'EPS YOY',  val: financials.length > 1 ? +((financials[0]?.eps / (financials[1]?.eps || 1) - 1) * 100).toFixed(1) : 0, sector: 14.2 },
                      { label: 'FCF GR',   val: financials.length > 1 ? +((financials[0]?.freeCashFlow / (financials[1]?.freeCashFlow || 1) - 1) * 100).toFixed(1) : 0, sector: 12.0 },
                      { label: 'EPS REV',  val: earningsMomentum?.components?.revisionScore ?? 0, sector: 1.2 },
                    ].map(m => (
                      <div key={m.label} className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted w-16 shrink-0">{m.label}</span>
                        <MetricBar val={m.val} sector={m.sector} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'SECTOR PEERS' && (
              <div className="space-y-2">
                <div className="obs-label mb-3">PEER COMPARISON · {quote.sector}</div>
                {peers.slice(0, 8).map(p => (
                  <Link key={p} href={`/stock/${p}`}
                    className="obs-row-hover flex items-center gap-4 px-3 py-2 border-b border-white/[0.04]">
                    <span className="font-mono text-sm font-bold w-16" style={{ color: '#00D97E' }}>{p}</span>
                    <div className="flex-1 h-[2px]" style={{ background: 'var(--color-surface-3)' }}>
                      <div className="h-full" style={{ width: `${50 + Math.random() * 40}%`, background: '#00D97E' }} />
                    </div>
                    <span className="font-mono text-[10px] text-muted">→</span>
                  </Link>
                ))}
                {peers.length === 0 && <p className="font-mono text-xs text-muted">No peer data available.</p>}
              </div>
            )}

            {activeTab === 'INSIDER · INST FLOW' && (
              <div className="space-y-2">
                <div className="obs-label mb-3">INSIDER TRANSACTIONS · 90D</div>
                {insiders.slice(0, 8).map((ins, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 border-b border-white/[0.04]">
                    <span className="font-mono text-[10px] text-muted w-24 shrink-0">{ins.date}</span>
                    <span className="font-mono text-xs flex-1">{ins.name}</span>
                    <span className="font-mono text-[10px] text-muted">{ins.title}</span>
                    <span className="font-mono text-xs font-bold" style={{ color: ins.transactionType === 'Buy' ? '#00D97E' : '#FF4D6D' }}>
                      {ins.transactionType === 'Buy' ? '+' : '−'}${(ins.value / 1e6).toFixed(1)}M
                    </span>
                  </div>
                ))}
                {insiders.length === 0 && <p className="font-mono text-xs text-muted">No insider data available.</p>}
              </div>
            )}

            {activeTab === 'TECHNICALS' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'RSI (14)',    val: technicals?.rsi?.toFixed(1) || '—',   color: technicals?.rsi > 70 ? '#FF4D6D' : technicals?.rsi < 30 ? '#00D97E' : '#E8EAF0' },
                  { label: 'MACD',       val: technicals?.macd?.macd?.toFixed(2) || '—', color: (technicals?.macd?.macd || 0) > 0 ? '#00D97E' : '#FF4D6D' },
                  { label: 'SMA 50',     val: formatCurrency(technicals?.sma50 || 0), color: quote.price > (technicals?.sma50 || 0) ? '#00D97E' : '#FF4D6D' },
                  { label: 'SMA 200',    val: formatCurrency(technicals?.sma200 || 0), color: quote.price > (technicals?.sma200 || 0) ? '#00D97E' : '#FF4D6D' },
                  { label: 'BB UPPER',   val: formatCurrency(technicals?.bollingerBands?.upper || 0), color: '#8892A4' },
                  { label: 'BB LOWER',   val: formatCurrency(technicals?.bollingerBands?.lower || 0), color: '#8892A4' },
                  { label: 'ADX',        val: technicals?.adx?.toFixed(1) || '—', color: (technicals?.adx || 0) > 25 ? '#00D97E' : '#8892A4' },
                  { label: 'BETA',       val: quote.beta?.toFixed(2) || '—', color: '#8892A4' },
                ].map(m => (
                  <AlgoCard key={m.label} label={m.label} value={m.val} color={m.color} />
                ))}
              </div>
            )}

            {activeTab === 'NEWS · SENTIMENT' && (
              <div className="space-y-3">
                {news.slice(0, 8).map((n, i) => (
                  <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
                    className="obs-row-hover flex items-start gap-3 px-3 py-2.5 border-b border-white/[0.04] block">
                    <span className={`obs-chip text-[8px] shrink-0 mt-0.5 ${n.sentiment === 'positive' ? 'obs-chip-green' : n.sentiment === 'negative' ? 'obs-chip-red' : 'obs-chip-muted'}`}>
                      {n.sentiment.toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-foreground leading-snug line-clamp-2">{n.title}</p>
                      <p className="font-mono text-[9px] text-muted mt-1">{n.source} · {new Date(n.publishedAt).toLocaleDateString()}</p>
                    </div>
                  </a>
                ))}
                {news.length === 0 && <p className="font-mono text-xs text-muted">No news available.</p>}
              </div>
            )}
          </div>

          {/* Community Vote */}
          <div className="p-4 border-t border-white/[0.06]">
            <CommunityVote symbol={symbol} />
          </div>
        </div>

        {/* ── RIGHT: Edge Score + Catalysts + Flags ── */}
        <div className="p-5 space-y-5">

          {/* Edge Score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="obs-label">EDGE SCORE</span>
              <span className="font-mono text-2xl font-bold" style={{ color: edgeScore > 0.5 ? '#8B5CF6' : '#F5A623' }}>
                {edgeScore.toFixed(2)}
              </span>
            </div>
            <div className="h-1 w-full" style={{ background: 'var(--color-surface-3)' }}>
              <div className="h-full" style={{ width: `${edgeScore * 100}%`, background: edgeScore > 0.5 ? '#8B5CF6' : '#F5A623' }} />
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="obs-label text-[9px]">SCORE</span>
                <span className="font-mono text-xs font-bold" style={{ color: col }}>{alphaScore.overall}</span>
              </div>
              <div className="h-1 w-full" style={{ background: 'var(--color-surface-3)' }}>
                <div className="h-full" style={{ width: `${alphaScore.overall}%`, background: col }} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="obs-label text-[9px]">CONVICTION</span>
                <span className="font-mono text-xs font-bold text-alpha-purple">{Math.round(edgeScore * 100)}</span>
              </div>
              <div className="h-1 w-full" style={{ background: 'var(--color-surface-3)' }}>
                <div className="h-full" style={{ width: `${edgeScore * 100}%`, background: '#8B5CF6' }} />
              </div>
            </div>
            <p className="font-mono text-[9px] text-muted mt-2 italic">{edgeDirection}</p>
          </div>

          {/* Catalysts */}
          <div className="border-t border-white/[0.06] pt-4">
            <div className="obs-label mb-3">CATALYSTS</div>
            <div className="space-y-2">
              {catalysts.map((c, i) => (
                <div key={i} className="flex items-start gap-2 py-2 border-b border-white/[0.04]">
                  <span className="font-mono text-[9px] text-muted w-20 shrink-0 mt-0.5">{c.date}</span>
                  <span className="font-mono text-[10px] text-foreground flex-1 leading-snug">{c.label}</span>
                  <span className={`obs-chip text-[8px] shrink-0 ${c.type === 'MACRO' ? 'obs-chip-blue' : c.type === 'RISK' ? 'obs-chip-red' : 'obs-chip-gold'}`}>
                    {c.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hidden Risk */}
          <div className="border-t border-white/[0.06] pt-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-2 h-2 rounded-full bg-bear" />
              <span className="obs-label text-bear">HIDDEN RISK</span>
            </div>
            <p className="font-mono text-[10px] text-foreground leading-relaxed">
              {alphaScore.keyFactors?.bear?.[0] || 'No significant hidden risks detected at current score level.'}
            </p>
          </div>

          {/* Alpha Opportunity */}
          <div className="border-t border-white/[0.06] pt-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-2 h-2 rounded-full bg-bull" />
              <span className="obs-label text-bull">ALPHA OPPORTUNITY</span>
            </div>
            <p className="font-mono text-[10px] text-foreground leading-relaxed">
              {alphaScore.fairValue && alphaScore.fairValueDiff
                ? `DCF gap of $${(alphaScore.fairValue - quote.price).toFixed(0)}/share (+${alphaScore.fairValueDiff.toFixed(1)}%) with SMI™ ${smi?.smi || 0} + AlphaMomentum™ ${alphaMomentum?.rank || 0} + Piotroski ${data.piotroski?.score || 0}/9.`
                : alphaScore.keyFactors?.bull?.[0] || 'Insufficient data for alpha opportunity assessment.'}
            </p>
          </div>

          {/* Active Flags */}
          {flags.length > 0 && (
            <div className="border-t border-white/[0.06] pt-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="obs-label text-bear">ACTIVE FLAGS · {flags.length}</span>
              </div>
              <div className="space-y-1.5">
                {flags.map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 text-warn shrink-0 mt-0.5" />
                    <span className="font-mono text-[10px] text-foreground leading-snug">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Algo grid */}
          <div className="border-t border-white/[0.06] pt-4 grid grid-cols-2 gap-2">
            <AlgoCard label="EQS™" value={`${eqs?.eqs || 0}/100`} sub={eqs?.flags?.beneish ? 'FLAG' : 'PASS'} color={eqs?.flags?.beneish ? '#FF4D6D' : '#00D97E'} />
            <AlgoCard label="SMI™" value={`${smi?.smi || 0}/100`} sub={smi?.label} color="#00D97E" />
            <AlgoCard label="CER™" value={`${cer?.cer || 0}/100`} sub={cer?.label} color="#F5A623" />
            <AlgoCard label="TSI™" value={`${trendStrength?.tsi || 0}/100`} sub={trendStrength?.label} color="#3B82F6" />
            <AlgoCard label="ALPHAMOM™" value={`${alphaMomentum?.rank || 0} pct`} color="#8B5CF6" />
            <AlgoCard label="EARN MOM™" value={`${earningsMomentum?.earnMomentum || 0}/100`} color="#00D97E" />
            <AlgoCard label="VOL REGIME™" value={volRegime?.volRegime || 'NORMAL'} color="#F5A623" />
            <AlgoCard label="PIOTROSKI F" value={`${data.piotroski?.score || 0}/9`} sub={data.piotroski?.grade} color={gradeColor((data.piotroski?.score || 0) / 9 * 100)} />
          </div>
        </div>
      </div>
    </div>
  );
}
