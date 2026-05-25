'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function EtfOverlapPage() {
  const [tickers, setTickers] = useState<string>('SPY, QQQ');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, any[]> | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tickers.trim()) return;
    
    setLoading(true);
    try {
      const formatted = tickers.split(',').map(t => t.trim().toUpperCase()).filter(Boolean).join(',');
      const res = await fetch(`/api/etf?symbols=${formatted}`);
      const json = await res.json();
      if (json.data) {
        setData(json.data);
        setNames(json.names);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // Find overlaps
  let overlaps: { symbol: string, name: string, appearances: string[], avgWeight: number }[] = [];
  if (data) {
    const etfs = Object.keys(data);
    const map = new Map<string, { name: string, appearsIn: {etf: string, weight: number}[] }>();
    
    etfs.forEach(etf => {
      data[etf].forEach(holding => {
        const sym = holding.symbol;
        if (!map.has(sym)) map.set(sym, { name: holding.name, appearsIn: [] });
        map.get(sym)!.appearsIn.push({ etf, weight: holding.percent });
      });
    });

    for (const [sym, info] of map.entries()) {
      if (info.appearsIn.length > 1) { // Appears in at least 2 ETFs
        const totalWeight = info.appearsIn.reduce((acc, curr) => acc + curr.weight, 0);
        overlaps.push({
          symbol: sym,
          name: info.name,
          appearances: info.appearsIn.map(a => `${a.etf} (${a.weight.toFixed(1)}%)`),
          avgWeight: totalWeight / info.appearsIn.length
        });
      }
    }
    
    overlaps.sort((a, b) => b.avgWeight - a.avgWeight); // sort by highest combined weight
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ETF X-Ray & Overlap</h1>
          <p className="text-sm text-muted mt-1">Discover hidden concentration risks by comparing top ETF holdings.</p>
        </div>
      </div>

      <div className="card max-w-2xl">
        <form onSubmit={handleAnalyze} className="flex gap-2">
          <input 
            value={tickers} 
            onChange={e => setTickers(e.target.value)} 
            placeholder="e.g. SPY, QQQ, VTI (comma separated)" 
            className="flex-1 bg-surface-2 border border-border rounded px-4 py-2 text-sm outline-offset-2 outline-accent font-mono uppercase" 
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-accent text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-accent-light transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? 'Analyzing...' : 'Analyze Overlap'}
          </button>
        </form>
      </div>

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Overlapping Holdings</h2>
            {overlaps.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-muted">No overlapping top holdings found among these ETFs.</p>
              </div>
            ) : (
              <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-surface-2/50 text-muted-2 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Symbol</th>
                      <th className="px-5 py-3 font-semibold">Holding Name</th>
                      <th className="px-5 py-3 font-semibold w-1/2">Appears In (Weight)</th>
                      <th className="px-5 py-3 font-semibold text-right">Avg Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {overlaps.map(ov => (
                      <tr key={ov.symbol} className="hover:bg-surface-2/30 transition-colors">
                        <td className="px-5 py-3">
                          <Link href={`/stock/${ov.symbol}`} className="font-mono font-bold text-accent-light hover:underline">{ov.symbol}</Link>
                        </td>
                        <td className="px-5 py-3 text-muted max-w-[150px] truncate">{ov.name}</td>
                        <td className="px-5 py-3 text-xs font-mono text-muted-2 leading-relaxed">
                          {ov.appearances.join(', ')}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-medium">{ov.avgWeight.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">ETFs Evaluated</h2>
            {Object.keys(data).map(etf => (
              <div key={etf} className="card p-4 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <Link href={`/stock/${etf}`} className="font-bold font-mono text-accent hover:underline">{etf}</Link>
                  <span className="text-xs text-muted-2 bg-surface-3 px-2 py-0.5 rounded">{data[etf].length} holdings data</span>
                </div>
                <p className="text-xs text-muted truncate">{names[etf]}</p>
              </div>
            ))}
            
            <div className="card bg-accent/5 border-accent/20 mt-6">
              <h3 className="text-sm font-semibold text-accent-light mb-2">Why this matters</h3>
              <p className="text-xs text-muted leading-relaxed">
                ETFs like SPY and QQQ share massive overlap in mega-cap tech. By running an X-Ray, you verify if your "diversified" ETF portfolio is actually heavily concentrated in just a few stocks.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
