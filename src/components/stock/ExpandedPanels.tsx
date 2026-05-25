'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import type { CompanyProfile, InsiderTransaction, Financials } from '@/lib/types';
import { ExternalLink, Users, Globe, MapPin, TrendingUp, TrendingDown, Info } from 'lucide-react';

// ── Company Identity ────────────────────────────────────────

export function CompanyIdentity({ profile }: { profile: CompanyProfile | null }) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!profile) return null;

  return (
    <div className="card border-border/30 bg-surface/20 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 bg-accent rounded-full shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
          <h3 className="text-sm font-black uppercase tracking-[0.1em] text-foreground">Company Identity</h3>
        </div>
        {profile.website && (
          <a 
            href={profile.website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-muted-2 hover:text-accent transition-colors"
          >
            <Globe className="w-4 h-4" />
          </a>
        )}
      </div>

      <div className="space-y-4 flex-1">
        <div className={`text-xs text-muted-2 leading-relaxed transition-all relative ${!isExpanded ? 'line-clamp-4' : ''}`}>
          {profile.description || "The profile description for this stock is currently unavailable. This may occur for stocks with limited public financial history or recently listed companies."}
          {!isExpanded && profile.description && profile.description.length > 200 && (
            <div className="absolute bottom-0 right-0 bg-gradient-to-l from-surface/90 to-transparent pl-8">
              <button 
                onClick={() => setIsExpanded(true)}
                className="text-accent hover:text-accent-light font-bold text-[10px] uppercase tracking-wider"
              >
                Read More
              </button>
            </div>
          )}
        </div>
        {isExpanded && profile.description && (
          <button 
            onClick={() => setIsExpanded(false)}
            className="text-accent hover:text-accent-light font-bold text-[10px] uppercase tracking-wider block mt-1"
          >
            Show Less
          </button>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1">
            <p className="text-[9px] uppercase font-bold text-muted-2 tracking-widest flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> HQ Location
            </p>
            <p className="text-xs font-semibold text-foreground">{profile.country || 'Not Disclosed'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] uppercase font-bold text-muted-2 tracking-widest flex items-center gap-1.5">
              <Users className="w-3 h-3" /> Employees
            </p>
            <p className="text-xs font-semibold text-foreground">{profile.employees ? profile.employees.toLocaleString() : 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] uppercase font-bold text-muted-2 tracking-widest flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" /> Sector
            </p>
            <p className="text-xs font-semibold text-foreground truncate">{profile.sector || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] uppercase font-bold text-muted-2 tracking-widest flex items-center gap-1.5">
              <Info className="w-3 h-3" /> Industry
            </p>
            <p className="text-xs font-semibold text-foreground truncate">{profile.industry || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Insider Transactions ────────────────────────────────────

export function InsiderPanel({ insiders }: { insiders: InsiderTransaction[] }) {
  if (insiders.length === 0) return null;

  return (
    <div className="card border-border/30 bg-surface/20">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-4 bg-warn rounded-full" />
        <h3 className="text-sm font-black uppercase tracking-[0.1em] text-foreground">Insider Movement</h3>
      </div>
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {insiders.map((t, i) => {
          const isBuy = t.transactionType.toLowerCase().includes('buy') || t.transactionType.toLowerCase().includes('acquisition');
          return (
            <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-surface-2/30 border border-border/10 hover:bg-surface-2/50 transition-colors group">
              <div className="space-y-0.5">
                <p className="text-[11px] font-bold text-foreground group-hover:text-accent transition-colors">{t.name}</p>
                <p className="text-[9px] text-muted-2 uppercase tracking-tighter">{t.title}</p>
              </div>
              <div className="text-right">
                <div className={`text-[10px] font-black uppercase flex items-center justify-end gap-1 ${isBuy ? 'text-bull' : 'text-bear'}`}>
                  {isBuy ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isBuy ? 'Buy' : 'Sell'}
                </div>
                <p className="text-[10px] font-mono text-muted-2 mt-0.5">{t.shares.toLocaleString()} shares</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Financial Pulse (Sparklines) ────────────────────────────

export function FinancialSparklines({ financials }: { financials: Financials[] }) {
  if (financials.length < 2) return null;

  const data = [...financials].reverse(); // Oldest to newest
  const maxRev = Math.max(...data.map(f => f.revenue));
  const maxNet = Math.max(...data.map(f => f.netIncome));

  const Sparkline = ({ points, color }: { points: number[], color: string }) => {
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min || 1;
    const width = 100;
    const height = 30;
    const padding = 2;
    
    const svgPoints = points.map((p, i) => {
      const x = (i / (points.length - 1)) * (width - padding * 2) + padding;
      const y = height - ((p - min) / range) * (height - padding * 2) - padding;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={svgPoints}
          className="drop-shadow-[0_0_8px_rgba(var(--color-accent),0.3)]"
          style={{ filter: `drop-shadow(0 0 4px ${color}66)` }}
        />
        {/* Animated Dash array if we wanted but polyline is fine */}
      </svg>
    );
  };

  return (
    <div className="card border-border/30 bg-surface/20">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-4 bg-accent rounded-full" />
        <h3 className="text-sm font-black uppercase tracking-[0.1em] text-foreground">Financial Momentum</h3>
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-2 tracking-widest">Revenue Growth (4Y)</p>
              <p className="text-sm font-mono font-bold text-foreground mt-0.5">
                ${(data[data.length-1].revenue / 1e9).toFixed(1)}B
              </p>
            </div>
            <div className="text-right">
              <p className={`text-[10px] font-bold ${data[data.length-1].revenue > data[0].revenue ? 'text-bull' : 'text-bear'}`}>
                {(((data[data.length-1].revenue / data[0].revenue) - 1) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <Sparkline points={data.map(f => f.revenue)} color="var(--color-accent)" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-2 tracking-widest">Net Income Growth</p>
              <p className="text-sm font-mono font-bold text-foreground mt-0.5">
                ${(data[data.length-1].netIncome / 1e9).toFixed(1)}B
              </p>
            </div>
            <div className="text-right">
              <p className={`text-[10px] font-bold ${data[data.length-1].netIncome > data[0].netIncome ? 'text-bull' : 'text-bear'}`}>
                {(((data[data.length-1].netIncome / data[0].netIncome) - 1) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <Sparkline points={data.map(f => f.netIncome)} color="#10b981" />
        </div>
      </div>
    </div>
  );
}

// ── Peer Comparison ─────────────────────────────────────────

export function PeerRadar({ peers }: { peers: string[] }) {
  if (peers.length === 0) return null;

  return (
    <div className="card border-border/30 bg-surface/20">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-4 bg-info rounded-full" />
        <h3 className="text-sm font-black uppercase tracking-[0.1em] text-foreground">Competition Radar</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {peers.slice(0, 10).map((p) => (
          <motion.a
            key={p}
            href={`/stock/${p}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1.5 rounded-lg bg-surface-2/40 border border-border/20 text-xs font-bold text-muted- hover:text-accent hover:border-accent/40 transition-all"
          >
            {p}
          </motion.a>
        ))}
      </div>
    </div>
  );
}
