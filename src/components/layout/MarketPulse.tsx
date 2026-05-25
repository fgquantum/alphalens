'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatNumber } from '@/lib/utils/formatters';

interface IndexData {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
}

const INDICES = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^IXIC', name: 'Nasdaq' },
  { symbol: '^DJI', name: 'Dow Jones' },
  { symbol: 'BTC-USD', name: 'Bitcoin' },
];

export function MarketPulse() {
  const [data, setData] = useState<IndexData[]>([]);

  useEffect(() => {
    async function fetchIndices() {
      try {
        const results = await Promise.all(
          INDICES.map(async (idx) => {
            const res = await fetch(`/api/stock/${idx.symbol.replace('^', '%5E')}`);
            if (!res.ok) return null;
            const d = await res.json();
            return {
              symbol: idx.symbol,
              name: idx.name,
              price: d.quote.price,
              changePct: d.quote.changePct,
            };
          })
        );
        setData(results.filter(Boolean) as IndexData[]);
      } catch (e) {
        console.error('Pulse Fetch Failed:', e);
      }
    }
    fetchIndices();
    const interval = setInterval(fetchIndices, 60000); // 1 min update
    return () => clearInterval(interval);
  }, []);

  if (data.length === 0) return null;

  return (
    <div className="flex items-center gap-6 overflow-hidden h-full">
      <AnimatePresence mode="wait">
        <motion.div 
          className="flex items-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {data.map((idx) => (
            <div key={idx.symbol} className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-[10px] font-black text-muted-2 uppercase tracking-widest">{idx.name}</span>
              <span className="text-[11px] font-mono font-bold text-foreground">
                {formatNumber(idx.price, 1)}
              </span>
              <span className={`text-[10px] font-bold ${idx.changePct >= 0 ? 'text-bull' : 'text-bear'}`}>
                {idx.changePct >= 0 ? '+' : ''}{formatNumber(idx.changePct, 2)}%
              </span>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
