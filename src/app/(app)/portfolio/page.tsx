'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency, formatNumber } from '@/lib/utils/formatters';

interface Position {
  id: string; // usually symbol
  symbol: string;
  shares: number;
  avgCost: number;
}

interface PortfolioItem extends Position {
  name: string;
  currentPrice: number;
  change: number;
  changePct: number;
  marketValue: number;
  totalReturn: number;
  totalReturnPct: number;
}

export default function PortfolioPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [symbol, setSymbol] = useState('');
  const [shares, setShares] = useState('');
  const [avgCost, setAvgCost] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('alphalens_portfolio');
    if (saved) {
      try {
        setPositions(JSON.parse(saved));
      } catch (e) {
        setPositions([]);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (positions.length === 0) {
      setItems([]);
      return;
    }

    const symbols = positions.map(p => p.symbol).join(',');
    fetch(`/api/bulk-quote?symbols=${symbols}`)
      .then(res => res.json())
      .then(data => {
        const enhanced = positions.map(p => {
          const quote = data[p.symbol];
          if (!quote) return null;
          const currentPrice = quote.price;
          const marketValue = currentPrice * p.shares;
          const totalCost = p.avgCost * p.shares;
          const totalReturn = marketValue - totalCost;
          const totalReturnPct = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;
          
          return {
            ...p,
            name: quote.name,
            currentPrice,
            change: quote.change,
            changePct: quote.changePct,
            marketValue,
            totalReturn,
            totalReturnPct
          } as PortfolioItem;
        }).filter(Boolean) as PortfolioItem[];
        
        setItems(enhanced);
      });
  }, [positions]);

  const addPosition = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = symbol.toUpperCase().trim();
    if (!sym || !shares || !avgCost) return;
    
    const newPos = {
      id: sym,
      symbol: sym,
      shares: parseFloat(shares),
      avgCost: parseFloat(avgCost)
    };
    
    // Check if exists
    const existing = positions.findIndex(p => p.symbol === sym);
    const updated = [...positions];
    if (existing >= 0) {
      // average down
      const old = updated[existing];
      const totalShares = old.shares + newPos.shares;
      const totalCost = (old.shares * old.avgCost) + (newPos.shares * newPos.avgCost);
      updated[existing] = {
        ...old,
        shares: totalShares,
        avgCost: totalCost / totalShares
      };
    } else {
      updated.push(newPos);
    }
    
    setPositions(updated);
    localStorage.setItem('alphalens_portfolio', JSON.stringify(updated));
    setSymbol(''); setShares(''); setAvgCost('');
  };

  const removePosition = (sym: string) => {
    const updated = positions.filter(p => p.symbol !== sym);
    setPositions(updated);
    localStorage.setItem('alphalens_portfolio', JSON.stringify(updated));
  };

  // Totals
  const totalValue = items.reduce((sum, item) => sum + item.marketValue, 0);
  const totalCost = items.reduce((sum, item) => sum + (item.shares * item.avgCost), 0);
  const totalProfit = totalValue - totalCost;
  const totalProfitPct = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
  const dayProfit = items.reduce((sum, item) => sum + (item.change * item.shares), 0);

  const [roastData, setRoastData] = useState<{score: number, roast: string, advice: string[]} | null>(null);
  const [roasting, setRoasting] = useState(false);

  const handleRoast = async () => {
    if (items.length === 0) return;
    setRoasting(true);
    try {
      const positions = items.map(i => ({ symbol: i.symbol, weight: i.marketValue / totalValue }));
      const res = await fetch('/api/portfolio/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions })
      });
      const data = await res.json();
      setRoastData(data);
    } catch (e) {
      console.error(e);
    }
    setRoasting(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Portfolio</h1>
          <p className="text-sm text-muted mt-1">Track your holdings securely in your local browser.</p>
        </div>
        <button 
          onClick={handleRoast}
          disabled={roasting || items.length === 0}
          className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-light transition-colors disabled:opacity-50"
        >
          {roasting ? 'Evaluating...' : '🔥 Roast My Portfolio'}
        </button>
      </div>

      {roastData && (
        <div className="card border-accent/30 bg-accent/5">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex flex-col items-center justify-center shrink-0">
              <span className="text-4xl font-bold text-accent-light">{roastData.score}</span>
              <span className="text-xs text-muted-2 uppercase tracking-wider font-semibold">AlphaScore</span>
            </div>
            <div>
              <p className="text-sm text-foreground italic">"{roastData.roast}"</p>
              {roastData.advice.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {roastData.advice.map((a, i) => (
                    <li key={i} className="text-xs text-muted font-mono">• {a}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <p className="text-sm font-medium text-muted">Total Value</p>
          <p className="text-3xl font-bold text-foreground mt-2 font-mono">{formatCurrency(totalValue)}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm font-medium text-muted">Total Return</p>
          <p className={`text-2xl font-bold mt-2 font-mono ${totalProfit >= 0 ? 'text-bull' : 'text-bear'}`}>
            {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
          </p>
          <p className={`text-sm mt-1 ${totalProfit >= 0 ? 'text-bull/80' : 'text-bear/80'}`}>
            ({totalProfitPct >= 0 ? '+' : ''}{formatNumber(totalProfitPct, 2)}%)
          </p>
        </div>
        <div className="card text-center">
          <p className="text-sm font-medium text-muted">Day Change</p>
          <p className={`text-2xl font-bold mt-2 font-mono ${dayProfit >= 0 ? 'text-bull' : 'text-bear'}`}>
            {dayProfit >= 0 ? '+' : ''}{formatCurrency(dayProfit)}
          </p>
        </div>
        
        {/* ADD PORTFOLIO TILE */}
        <div className="card col-span-1 md:col-span-1 border-dashed border-2 border-border/50 bg-transparent flex flex-col justify-center">
          <form onSubmit={addPosition} className="flex flex-col gap-2 w-full">
            <div className="flex gap-2">
              <input value={symbol} onChange={e=>setSymbol(e.target.value)} placeholder="Ticker" className="bg-surface-2 border border-border rounded px-3 py-1.5 text-sm w-full outline-offset-2 outline-accent" />
            </div>
            <div className="flex gap-2">
              <input value={shares} type="number" step="any" onChange={e=>setShares(e.target.value)} placeholder="Shares" className="bg-surface-2 border border-border rounded px-3 py-1.5 text-sm w-1/2" />
              <input value={avgCost} type="number" step="any" onChange={e=>setAvgCost(e.target.value)} placeholder="Avg Price" className="bg-surface-2 border border-border rounded px-3 py-1.5 text-sm w-1/2" />
            </div>
            <button type="submit" className="bg-accent/20 text-accent-light hover:bg-accent/30 hover:text-white rounded py-1.5 text-sm font-semibold transition-colors mt-2">
              Add Position
            </button>
          </form>

          <div className="mt-4 border-t border-border/50 pt-4 relative">
            <label className="text-xs text-muted-2 font-semibold uppercase tracking-wider block mb-2 cursor-pointer hover:text-foreground transition-colors group">
              <span className="border-b border-dashed border-muted-2 group-hover:border-foreground">Import CSV</span>
              <input type="file" accept=".csv" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                  const text = e.target?.result as string;
                  if (!text) return;
                  const rows = text.split('\n').map(r => r.split(','));
                  const newPositions: Position[] = [];
                  for (let i = 1; i < rows.length; i++) { // Skip header
                    const row = rows[i];
                    if (row.length >= 3) {
                      newPositions.push({ id: row[0].trim(), symbol: row[0].trim().toUpperCase(), shares: parseFloat(row[1]), avgCost: parseFloat(row[2]) });
                    }
                  }
                  if (newPositions.length > 0) {
                    const combined = [...positions];
                    newPositions.forEach(np => {
                      const ex = combined.findIndex(c => c.symbol === np.symbol);
                      if (ex >= 0) {
                        const old = combined[ex];
                        const totalShares = old.shares + np.shares;
                        combined[ex] = { ...old, shares: totalShares, avgCost: ((old.shares * old.avgCost) + (np.shares * np.avgCost)) / totalShares };
                      } else {
                        combined.push(np);
                      }
                    });
                    setPositions(combined);
                    localStorage.setItem('alphalens_portfolio', JSON.stringify(combined));
                  }
                };
                reader.readAsText(file);
              }} />
            </label>
            <p className="text-[10px] text-muted">Format: Symbol, Shares, AvgCost</p>
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-2/50 text-muted-2 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4 font-semibold">Symbol</th>
                <th className="px-5 py-4 font-semibold text-right">Shares</th>
                <th className="px-5 py-4 font-semibold text-right">Avg Cost</th>
                <th className="px-5 py-4 font-semibold text-right">Price</th>
                <th className="px-5 py-4 font-semibold text-right">Day %</th>
                <th className="px-5 py-4 font-semibold text-right">Market Value</th>
                <th className="px-5 py-4 font-semibold text-right">Return</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-muted">Loading portfolio...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-muted">
                    <p className="text-base mb-2">No positions yet.</p>
                    <p className="text-xs">Add a ticker using the form above to get started.</p>
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.symbol} className="hover:bg-surface-2/30 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Link href={`/stock/${item.symbol}`} className="font-mono font-bold text-accent-light hover:underline">{item.symbol}</Link>
                        <span className="text-xs text-muted truncate max-w-[120px] hidden sm:block">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-mono">{formatNumber(item.shares, 0)}</td>
                    <td className="px-5 py-4 text-right font-mono">{formatCurrency(item.avgCost)}</td>
                    <td className="px-5 py-4 text-right font-mono">{formatCurrency(item.currentPrice)}</td>
                    <td className={`px-5 py-4 text-right font-semibold font-mono ${item.changePct >= 0 ? 'text-bull' : 'text-bear'}`}>
                      {item.changePct >= 0 ? '+' : ''}{formatNumber(item.changePct, 2)}%
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-semibold">{formatCurrency(item.marketValue)}</td>
                    <td className={`px-5 py-4 text-right font-mono font-semibold ${item.totalReturn >= 0 ? 'text-bull' : 'text-bear'}`}>
                      {item.totalReturn >= 0 ? '+' : ''}{formatCurrency(item.totalReturn)}
                      <br/>
                      <span className="text-xs opacity-80">({item.totalReturnPct >= 0 ? '+' : ''}{formatNumber(item.totalReturnPct, 2)}%)</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button 
                        onClick={() => removePosition(item.symbol)}
                        className="text-muted hover:text-bear p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove position"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
