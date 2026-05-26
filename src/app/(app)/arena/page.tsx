'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Swords, Trophy, TrendingUp, Users, BarChart3, Flame,
  Coins, Search, Plus, Trash2, ShieldAlert, Timer,
  ArrowLeftRight, ArrowUpRight, TrendingDown
} from 'lucide-react';

interface Participant {
  id: string;
  userId: string;
  name: string;
  tier: string;
  budget: number;
  tickers: string[];
  allocations: Record<string, number>;
  currentPrices: Record<string, number>;
  entryPrices: Record<string, number>;
  portfolioValue: number;
  avgReturnPct: number;
  hasPaid: boolean;
}

interface ActiveSeason {
  id: string;
  seasonNumber: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isCompleted: boolean;
  winnerId: string | null;
}

interface UserEntry {
  id: string;
  tier: string;
  budget: number;
  tickers: string[];
  allocations: Record<string, number>;
  currentPrices: Record<string, number>;
  entryPrices: Record<string, number>;
  portfolioValue: number;
  avgReturnPct: number;
  hasPaid: boolean;
  dailyHistory: Array<{
    id: string;
    date: string;
    portfolioValue: number;
    avgReturnPct: number;
  }>;
}

interface CurrentUser {
  realBalance: number;
  arenaTier: string;
}

const TIER_BUDGETS: Record<string, number> = {
  Silver: 10000,
  Gold: 20000,
  Platinum: 50000,
  Diamond: 100000,
};

const TIER_COLORS: Record<string, string> = {
  Silver: '#8892A4',
  Gold: '#F5A623',
  Platinum: '#3B82F6',
  Diamond: '#A78BFA',
};

const TIER_PRIZES: Record<string, string> = {
  Silver: '5€',
  Gold: '10€',
  Platinum: '20€',
  Diamond: '100€',
};

export default function ArenaPage() {
  const [activeSeason, setActiveSeason] = useState<ActiveSeason | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [userEntry, setUserEntry] = useState<UserEntry | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [sandboxLog, setSandboxLog] = useState<string>('');

  // Standings Tab
  const [activeStandingsTab, setActiveStandingsTab] = useState<'Silver' | 'Gold' | 'Platinum' | 'Diamond'>('Silver');

  // Registration Pick State
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ symbol: string; name: string }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [regError, setRegError] = useState('');

  // ── 1. Fetch Arena State ──
  const fetchState = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/arena/active');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      
      setActiveSeason(data.activeSeason);
      setParticipants(data.participants);
      setUserEntry(data.userEntry);
      setCurrentUser(data.currentUser);
      
      // Auto-set the standings tab to match the user's current tier
      if (data.currentUser && !silent) {
        setActiveStandingsTab(data.currentUser.arenaTier as any);
      }
    } catch (e: any) {
      console.error('Failed to load arena active state:', e);
      setSandboxLog('Error loading arena data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // ── 2. Search Stocks ──
  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.length < 1) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/search?q=${val}`);
      const data = await res.json();
      setSearchResults((data || []).slice(0, 5));
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const addStock = (symbol: string) => {
    const sym = symbol.toUpperCase().trim();
    if (selectedStocks.includes(sym)) return;
    if (selectedStocks.length >= 5) {
      setRegError('You can select a maximum of 5 tickers.');
      return;
    }

    const updated = [...selectedStocks, sym];
    setSelectedStocks(updated);

    // Re-distribute allocations equally as a helper
    const newAlloc: Record<string, number> = {};
    const equalShare = Math.floor(100 / updated.length);
    updated.forEach((s, idx) => {
      newAlloc[s] = idx === updated.length - 1 ? 100 - (equalShare * (updated.length - 1)) : equalShare;
    });

    setAllocations(newAlloc);
    setSearchQuery('');
    setSearchResults([]);
    setRegError('');
  };

  const removeStock = (sym: string) => {
    const updated = selectedStocks.filter(s => s !== sym);
    setSelectedStocks(updated);
    
    const newAlloc: Record<string, number> = {};
    if (updated.length > 0) {
      const equalShare = Math.floor(100 / updated.length);
      updated.forEach((s, idx) => {
        newAlloc[s] = idx === updated.length - 1 ? 100 - (equalShare * (updated.length - 1)) : equalShare;
      });
    }
    setAllocations(newAlloc);
    setRegError('');
  };

  const handleAllocationChange = (sym: string, val: number) => {
    setAllocations(prev => ({
      ...prev,
      [sym]: val,
    }));
    setRegError('');
  };

  // ── 3. Submit Selections ──
  const handleJoinArena = async () => {
    setRegError('');
    if (selectedStocks.length !== 5) {
      setRegError('You must select exactly 5 stocks to join.');
      return;
    }

    const totalAlloc = Object.values(allocations).reduce((sum, v) => sum + v, 0);
    if (Math.abs(totalAlloc - 100) > 0.01) {
      setRegError('Allocations must sum up exactly to 100%.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/arena/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocations }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join');

      setSandboxLog('Welcome to the Arena! Entry fee of 5€ deducted, picks successfully locked.');
      setSelectedStocks([]);
      setAllocations({});
      await fetchState();
    } catch (e: any) {
      setRegError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── 4. Sandbox Actions ──
  const triggerSandbox = async (action: 'promote' | 'seed' | 'reset', extraTier?: string) => {
    setActionLoading(true);
    setSandboxLog(`Running sandbox action: ${action}...`);
    try {
      const res = await fetch('/api/arena/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, tier: extraTier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      
      setSandboxLog(data.message);
      await fetchState();
    } catch (e: any) {
      setSandboxLog(`Sandbox Error: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const triggerDailyUpdate = async (forceClose = false) => {
    setActionLoading(true);
    setSandboxLog(forceClose ? 'Closing out season and compiling payouts...' : 'Fetching quotes and executing 10 PM CET daily calculations...');
    try {
      const res = await fetch('/api/arena/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceClose, simulatePriceShift: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');

      if (data.seasonClosed) {
        setSandboxLog(`Season closed! ${data.message} Log: \n${data.closeSummary?.logEvents?.join('\n') || 'No promotions logged.'}`);
      } else {
        setSandboxLog(data.message);
      }
      await fetchState();
    } catch (e: any) {
      setSandboxLog(`Calculation Error: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // ── 5. Derived Computations ──
  const activeStandings = useMemo(() => {
    return participants.filter(p => p.tier === activeStandingsTab);
  }, [participants, activeStandingsTab]);

  const daysRemaining = useMemo(() => {
    if (!activeSeason) return 0;
    const end = new Date(activeSeason.endDate).getTime();
    const now = new Date('2026-05-25T15:37:00Z').getTime(); // Use simulated date baseline
    const diff = end - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [activeSeason]);

  const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + val, 0);

  if (loading) return (
    <div className="flex h-[calc(100vh-100px)] items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border border-accent/20 border-t-accent rounded-full animate-spin mx-auto" />
        <div className="obs-label text-accent animate-pulse">ESTABLISHING SYNAPSE LINK…</div>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-5 animate-fade-in">

      {/* ── DEVELOPER SANDBOX CONTROL PANEL ── */}
      <div className="p-4 rounded-xl border border-warn/20 bg-warn/[0.03] backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-warn animate-pulse" />
            <span className="obs-label text-warn text-[10px] tracking-widest font-black">DEVELOPER TESTING SANDBOX</span>
          </div>
          {actionLoading && <span className="text-[10px] text-muted-2 animate-pulse">EXECUTING ATOMIC TRANSACTION…</span>}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button onClick={() => triggerSandbox('reset')} disabled={actionLoading}
            className="obs-btn !py-1 !px-2.5 !text-[9px] hover:!bg-bear/15 hover:!border-bear/30 !text-bear shrink-0">
            RESET ARENA & SEED BASICS
          </button>
          <button onClick={() => triggerSandbox('seed')} disabled={actionLoading}
            className="obs-btn !py-1 !px-2.5 !text-[9px] hover:!bg-bull/15 hover:!border-bull/30 !text-bull shrink-0">
            SEED эко-SYSTEM PARTICIPANTS
          </button>
          
          <div className="h-4 w-[1px] bg-white/10 mx-1" />
          
          <span className="text-[10px] text-muted-2 font-mono">Tiers:</span>
          {['Silver', 'Gold', 'Platinum', 'Diamond'].map(t => (
            <button key={t} onClick={() => triggerSandbox('promote', t)} disabled={actionLoading}
              className="obs-btn !py-1 !px-2 !text-[9px]"
              style={currentUser?.arenaTier === t ? { borderColor: TIER_COLORS[t], color: TIER_COLORS[t] } : {}}>
              Set to {t}
            </button>
          ))}

          <div className="h-4 w-[1px] bg-white/10 mx-1" />

          <button onClick={() => triggerDailyUpdate(false)} disabled={actionLoading}
            className="obs-btn !py-1 !px-2.5 !text-[9px] bg-accent/10 border-accent/30 text-accent">
            Simulate 10 PM Daily Update
          </button>
          <button onClick={() => triggerDailyUpdate(true)} disabled={actionLoading}
            className="obs-btn !py-1 !px-2.5 !text-[9px] bg-purple-500/10 border-purple-500/30 text-purple-400">
            Force Season End & compile Payout
          </button>
        </div>

        {sandboxLog && (
          <div className="p-3 bg-black/60 rounded-lg border border-white/[0.05]">
            <p className="font-mono text-[10px] text-muted-2 leading-relaxed whitespace-pre-wrap">{sandboxLog}</p>
          </div>
        )}
      </div>

      {/* ── HERO BANNER STATUS BAR ── */}
      <div className="px-6 py-6 border-b border-white/[0.04] rounded-2xl" 
        style={{ background: 'linear-gradient(180deg, var(--color-surface) 0%, var(--color-background) 100%)' }}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <span className="obs-label flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-accent" />
              THE STOCK ARENA · SEASON {String(activeSeason?.seasonNumber || 1).padStart(2, '0')}
            </span>
            <div className="flex flex-wrap items-baseline gap-4 mt-2">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                Competitive Performance Leagues
              </h1>
              {activeSeason && (
                <span className="obs-chip obs-chip-gold text-[9px] flex items-center gap-1.5">
                  <Timer className="w-3 h-3 text-warn" />
                  {daysRemaining} DAYS REMAINING (Ends {new Date(activeSeason.endDate).toLocaleDateString()})
                </span>
              )}
            </div>
            <p className="text-muted text-xs mt-2 leading-relaxed max-w-2xl">
              Pay the <strong className="text-foreground">5€ entry fee</strong>, select 5 tickers, and allocate your arena budget. 
              Top daily pickers secure promotions and **real cash prizes**! Worst pickers drop a tier.
            </p>
          </div>

          <div className="flex gap-6 lg:gap-8 bg-surface-2/30 p-4 rounded-xl border border-white/[0.04]">
            <div>
              <div className="obs-label text-[9px] text-muted-2">YOUR ACTIVE ARENA</div>
              <div className="font-mono text-lg md:text-xl font-bold mt-1" style={{ color: TIER_COLORS[currentUser?.arenaTier || 'Silver'] }}>
                {currentUser?.arenaTier || 'Silver'}
              </div>
            </div>
            <div>
              <div className="obs-label text-[9px] text-muted-2">SEASON BUDGET</div>
              <div className="font-mono text-lg md:text-xl font-bold mt-1">
                {TIER_BUDGETS[currentUser?.arenaTier || 'Silver']?.toLocaleString()}€
              </div>
            </div>
            <div>
              <div className="obs-label text-[9px] text-muted-2">WALLET BALANCE</div>
              <div className="font-mono text-lg md:text-xl font-bold text-bull mt-1 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-accent" />
                {currentUser?.realBalance?.toFixed(2)}€
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">

        {/* ── LEFT: Standings Standings ── */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-black uppercase tracking-[0.1em] text-foreground flex items-center gap-2">
              <Trophy className="w-4 h-4 text-accent" /> Standings Leaderboards
            </h2>
          </div>

          {/* League selectors */}
          <div className="flex border border-white/[0.06] rounded-xl overflow-hidden bg-surface-2/20">
            {(['Silver', 'Gold', 'Platinum', 'Diamond'] as const).map(tier => (
              <button
                key={tier}
                onClick={() => setActiveStandingsTab(tier)}
                className="flex-1 py-3 text-center transition-all border-none font-bold text-[10px] uppercase tracking-wider relative cursor-pointer"
                style={{
                  background: activeStandingsTab === tier ? 'var(--color-surface-2)' : 'transparent',
                  color: activeStandingsTab === tier ? TIER_COLORS[tier] : 'var(--color-muted)',
                }}
              >
                {activeStandingsTab === tier && (
                  <motion.div layoutId="activeTierIndicator" className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: TIER_COLORS[tier] }} />
                )}
                {tier} ({TIER_PRIZES[tier]})
              </button>
            ))}
          </div>

          {/* Leaderboard Entries */}
          <div className="obs-panel overflow-x-auto">
            {activeStandings.length === 0 ? (
              <div className="p-8 text-center text-muted font-mono text-xs">
                No active portfolios registered in this league yet. Seed competitors in the sandbox to test!
              </div>
            ) : (
              <table className="w-full text-left font-mono border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.04] bg-surface-2/30">
                    <th className="obs-label text-[9px] px-4 py-3">RANK</th>
                    <th className="obs-label text-[9px] px-4 py-3">TRADER</th>
                    <th className="obs-label text-[9px] px-4 py-3">HOLDINGS & ALLOC</th>
                    <th className="obs-label text-[9px] px-4 py-3 text-right">VALUE</th>
                    <th className="obs-label text-[9px] px-4 py-3 text-right">RETURN</th>
                  </tr>
                </thead>
                <tbody>
                  {activeStandings.map((p, idx) => {
                    const isCurrentUser = p.userId === userEntry?.id || p.userId === currentUser?.arenaTier; // Fallback helper
                    const finalIndex = idx + 1;
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-white/[0.03] last:border-0 hover:bg-surface-2/20 transition-all"
                        style={p.userId === userEntry?.id || p.name.includes('@you') ? { background: 'rgba(0, 217, 126, 0.04)' } : {}}
                      >
                        {/* Rank */}
                        <td className="px-4 py-4.5 font-bold text-sm">
                          {finalIndex === 1 ? '👑 1' : `#${finalIndex}`}
                        </td>

                        {/* Trader */}
                        <td className="px-4 py-4.5">
                          <div className="flex flex-col">
                            <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                              {p.name}
                              {(p.userId === userEntry?.id || p.name.includes('@you')) && (
                                <span className="obs-chip obs-chip-green text-[7px] !px-1">YOU</span>
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Holdings details */}
                        <td className="px-4 py-4.5">
                          <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                            {p.tickers.map(sym => {
                              const alloc = p.allocations[sym] || 0;
                              const ePrice = p.entryPrices[sym] || 1;
                              const cPrice = p.currentPrices[sym] || ePrice;
                              const assetRet = ((cPrice - ePrice) / ePrice) * 100;
                              return (
                                <span key={sym} className="text-[9px] px-1.5 py-0.5 rounded bg-surface-3/80 border border-white/[0.04] text-muted-2 flex items-center gap-1">
                                  <strong>{sym}</strong> {alloc}%
                                  <span style={{ color: assetRet >= 0 ? '#00D97E' : '#FF4D6D' }}>
                                    ({assetRet >= 0 ? '+' : ''}{assetRet.toFixed(0)}%)
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        {/* Current Value */}
                        <td className="px-4 py-4.5 text-right text-xs">
                          {p.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                        </td>

                        {/* Current Return */}
                        <td className="px-4 py-4.5 text-right font-bold text-xs" style={{ color: p.avgReturnPct >= 0 ? '#00D97E' : '#FF4D6D' }}>
                          {p.avgReturnPct >= 0 ? '▲' : '▼'} {p.avgReturnPct >= 0 ? '+' : ''}{p.avgReturnPct.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── RIGHT: Registration / Your Portfolio ── */}
        <div className="space-y-4">
          <h2 className="text-base font-black uppercase tracking-[0.1em] text-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent" /> Your Active Entries
          </h2>

          {/* Registration Mode */}
          {!userEntry ? (
            <div className="obs-panel p-5 space-y-4 bg-surface-2/10 border border-white/[0.05] rounded-2xl relative">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-accent" />
                <span className="obs-label text-[10px] tracking-wider text-foreground">REGISTER FOR SEASON</span>
              </div>
              <p className="text-xs text-muted-2 leading-relaxed">
                Unlock your budget of **{TIER_BUDGETS[currentUser?.arenaTier || 'Silver']?.toLocaleString()}€** in the {currentUser?.arenaTier} Arena. 
                Select exactly 5 tickers and distribute your allocation.
              </p>

              {/* Stock Selector Search */}
              <div className="space-y-1.5 relative">
                <label className="obs-label text-[8px] text-muted-2">SEARCH & ADD TICKERS</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search tickers (e.g. AAPL, NVDA, TSLA)"
                    className="w-full bg-surface-3/60 border border-white/[0.06] rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-foreground focus:border-accent/40 outline-none"
                    disabled={selectedStocks.length >= 5}
                  />
                </div>

                {searchLoading && <div className="text-[10px] text-muted-2 font-mono animate-pulse">UPLINK SEARCH ACTIVE…</div>}
                
                {/* Search Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 z-50 mt-1 bg-surface border border-white/[0.06] rounded-xl overflow-hidden shadow-2xl p-1.5 space-y-0.5">
                    {searchResults.map(stock => (
                      <button
                        key={stock.symbol}
                        onClick={() => addStock(stock.symbol)}
                        className="w-full px-3 py-2 text-left rounded-lg hover:bg-surface-2 font-mono text-xs flex justify-between items-center transition-colors border-none text-foreground cursor-pointer"
                      >
                        <span className="font-bold text-accent">{stock.symbol}</span>
                        <span className="text-[10px] text-muted-2 truncate max-w-[200px]">{stock.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Picks Grid & Allocations sliders */}
              {selectedStocks.length > 0 && (
                <div className="space-y-3 pt-2">
                  <label className="obs-label text-[8px] text-muted-2">DISTRIBUTE PORTFOLIO (MUST TOTAL 100%)</label>
                  <div className="space-y-2.5">
                    {selectedStocks.map(sym => (
                      <div key={sym} className="p-3 bg-surface-2/40 rounded-xl border border-white/[0.04] space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-xs font-bold text-accent">{sym}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-foreground">{allocations[sym] || 0}%</span>
                            <button
                              onClick={() => removeStock(sym)}
                              className="text-muted-2 hover:text-bear p-1 rounded transition-colors bg-transparent border-none cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="80"
                          step="5"
                          value={allocations[sym] || 0}
                          onChange={(e) => handleAllocationChange(sym, parseInt(e.target.value))}
                          className="w-full accent-accent h-1 bg-surface-3 rounded-full cursor-pointer outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-surface-3/30 border border-white/[0.04]">
                    <span className="obs-label text-[9px]">TOTAL ALLOCATED</span>
                    <span className="font-mono text-sm font-bold" style={{ color: totalAllocated === 100 ? '#00D97E' : '#FF4D6D' }}>
                      {totalAllocated}% / 100%
                    </span>
                  </div>
                </div>
              )}

              {/* Submit / Pay CTA */}
              <div className="pt-2">
                {regError && <div className="text-[10px] text-bear font-mono mb-2">{regError}</div>}
                
                <button
                  onClick={handleJoinArena}
                  disabled={selectedStocks.length !== 5 || totalAllocated !== 100 || actionLoading}
                  className="w-full py-3 text-center uppercase tracking-widest font-bold text-xs transition-all rounded-xl border-none font-display flex items-center justify-center gap-2"
                  style={{
                    background: (selectedStocks.length === 5 && totalAllocated === 100) ? '#00D97E' : 'rgba(255,255,255,0.04)',
                    color: (selectedStocks.length === 5 && totalAllocated === 100) ? '#070910' : 'var(--color-muted)',
                    cursor: (selectedStocks.length === 5 && totalAllocated === 100) ? 'pointer' : 'not-allowed',
                  }}
                >
                  <Coins className="w-3.5 h-3.5" /> PAY 5€ ENTRY & CONFIRM PICKS
                </button>
              </div>
            </div>
          ) : (
            // Active Holdings & Performance Curve
            <div className="space-y-4">
              <div className="obs-panel p-5 bg-surface-2/15 border border-white/[0.04] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="obs-label text-[9px]">YOUR STANDING</span>
                  <span className="obs-chip text-[9px]" style={{ borderColor: TIER_COLORS[userEntry.tier], color: TIER_COLORS[userEntry.tier] }}>
                    {userEntry.tier} Arena
                  </span>
                </div>

                <div className="font-mono text-3xl font-bold flex items-baseline gap-2" style={{ color: userEntry.avgReturnPct >= 0 ? '#00D97E' : '#FF4D6D' }}>
                  {userEntry.avgReturnPct >= 0 ? '+' : ''}{userEntry.avgReturnPct.toFixed(2)}%
                  <span className="text-xs text-muted-2 font-normal">({userEntry.portfolioValue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}€)</span>
                </div>

                {/* Equity Curve SVG */}
                {userEntry.dailyHistory && userEntry.dailyHistory.length > 1 && (
                  <div className="pt-2">
                    <div className="obs-label text-[8px] text-muted-2 mb-2">PORTFOLIO TRAJECTORY (DAILY)</div>
                    <svg width="100%" height="80" viewBox="0 0 320 80" className="block overflow-visible">
                      <defs>
                        <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00D97E" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#00D97E" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* Grid lines */}
                      {[20, 40, 60].map(y => (
                        <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="2 4" />
                      ))}
                      
                      {/* Line path */}
                      {(() => {
                        const vals = userEntry.dailyHistory.map(h => h.portfolioValue);
                        const min = Math.min(...vals, userEntry.budget * 0.95);
                        const max = Math.max(...vals, userEntry.budget * 1.05);
                        const range = max - min || 1;
                        const points = userEntry.dailyHistory.map((h, i) => {
                          const x = (i / (userEntry.dailyHistory.length - 1)) * 320;
                          const y = 80 - ((h.portfolioValue - min) / range) * 70 - 5;
                          return `${x},${y}`;
                        });
                        
                        const fillPath = `M 0 80 L ${points.join(' L ')} L 320 80 Z`;
                        const strokePath = `M ${points.join(' L ')}`;

                        return (
                          <>
                            <path d={fillPath} fill="url(#curveFill)" />
                            <path d={strokePath} fill="none" stroke="#00D97E" strokeWidth="1.5" />
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                )}

                {/* Positions holdings detail list */}
                <div className="pt-3 border-t border-white/[0.04] space-y-2">
                  <div className="obs-label text-[8px] text-muted-2">ACTIVE ALLOCATIONS & PERFORMANCE</div>
                  <div className="space-y-2">
                    {userEntry.tickers.map(sym => {
                      const alloc = userEntry.allocations[sym] || 0;
                      const entryPrice = userEntry.entryPrices[sym] || 1;
                      const currentPrice = userEntry.currentPrices[sym] || entryPrice;
                      const assetReturn = ((currentPrice - entryPrice) / entryPrice) * 100;
                      const cashAllocated = userEntry.budget * (alloc / 100);
                      const currentCashVal = cashAllocated * (currentPrice / entryPrice);

                      return (
                        <div key={sym} className="flex justify-between items-center p-2 rounded-lg bg-surface-3/30 border border-white/[0.03] text-xs">
                          <div>
                            <p className="font-bold text-foreground">{sym}</p>
                            <p className="text-[9px] text-muted-2 mt-0.5">Allocated: {alloc}% ({cashAllocated.toLocaleString()}€)</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold flex items-center justify-end gap-1" style={{ color: assetReturn >= 0 ? '#00D97E' : '#FF4D6D' }}>
                              {assetReturn >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {assetReturn >= 0 ? '+' : ''}{assetReturn.toFixed(1)}%
                            </p>
                            <p className="text-[9px] text-muted-2 mt-0.5">{currentCashVal.toLocaleString(undefined, {maximumFractionDigits:0})}€</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
