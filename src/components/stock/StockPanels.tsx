import { motion } from 'framer-motion';
import type { StockQuote, TechnicalIndicators, AlphaScoreResult, NewsItem, EarningsResult, AnalystRecommendation } from '@/lib/types';

// ── Key Metrics Grid ────────────────────────────────────────

function MetricCard({ label, value, sub, index }: { label: string; value: string; sub?: string; index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="px-4 py-3.5 rounded-xl bg-surface-2/40 border border-border/40 backdrop-blur-md hover:border-accent/40 transition-all group overflow-hidden relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <p className="text-[10px] text-muted-2 uppercase font-bold tracking-[0.1em]">{label}</p>
      <p className="text-base font-mono font-bold text-foreground mt-1 group-hover:text-accent-light transition-colors">{value}</p>
      {sub && <p className="text-[9px] text-muted-2 mt-1 font-medium">{sub}</p>}
    </motion.div>
  );
}

function fmt(n: number | null | undefined, decimals = 2): string {
  if (n === null || n === undefined || isNaN(n)) return '—';
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function KeyMetrics({ quote }: { quote: StockQuote }) {
  const metrics = [
    { label: "Market Cap", value: fmt(quote.marketCap) },
    { label: "P/E", value: quote.pe ? quote.pe.toFixed(2) : '—' },
    { label: "Forward P/E", value: quote.forwardPe ? quote.forwardPe.toFixed(2) : '—' },
    { label: "EPS", value: quote.eps ? `$${quote.eps.toFixed(2)}` : '—' },
    { label: "Dividend", value: quote.dividendYield ? `${quote.dividendYield.toFixed(2)}%` : '—' },
    { label: "Beta", value: quote.beta ? quote.beta.toFixed(2) : '—' },
    { label: "52W High", value: `$${quote.high52w.toFixed(2)}` },
    { label: "52W Low", value: `$${quote.low52w.toFixed(2)}` },
    { label: "SMA 50", value: `$${quote.sma50.toFixed(2)}` },
    { label: "SMA 200", value: `$${quote.sma200.toFixed(2)}` },
    { label: "Volume", value: fmt(quote.volume, 0) },
    { label: "Avg Vol", value: fmt(quote.avgVolume, 0) },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {metrics.map((m, i) => (
        <MetricCard key={m.label} label={m.label} value={m.value} index={i} />
      ))}
    </div>
  );
}

// ── Technical Panel ─────────────────────────────────────────

function TechIndicator({ label, value, signal, pct }: { label: string; value: string; signal?: 'bull' | 'bear' | 'neutral', pct?: number }) {
  const signalColor = signal === 'bull' ? 'text-bull' : signal === 'bear' ? 'text-bear' : 'text-muted';
  return (
    <div className="flex flex-col gap-1 px-3 py-2.5 rounded-xl bg-surface-2/30 border border-border/20 group hover:bg-surface-2/50 transition-colors">
      <div className="flex justify-between items-center">
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-2">{label}</span>
        <span className={`text-xs font-mono font-bold ${signalColor}`}>{value}</span>
      </div>
      {pct !== undefined && (
        <div className="h-1 bg-surface-3 rounded-full overflow-hidden mt-1">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${signal === 'bull' ? 'bg-bull' : signal === 'bear' ? 'bg-bear' : 'bg-accent'}`}
            style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function TechnicalPanel({ technicals, price }: { technicals: TechnicalIndicators; price: number }) {
  return (
    <div className="card border-border/40">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-4 bg-accent rounded-full" />
        <h3 className="text-sm font-black uppercase tracking-[0.1em] text-foreground">Technical Pulse</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <TechIndicator label="RSI" value={technicals.rsi.toFixed(1)} signal={technicals.rsi > 70 ? 'bear' : technicals.rsi < 30 ? 'bull' : 'neutral'} pct={technicals.rsi} />
        <TechIndicator label="MACD Hist" value={technicals.macd.histogram.toFixed(3)} signal={technicals.macd.histogram > 0 ? 'bull' : 'bear'} />
        <TechIndicator label="MACD Signal" value={technicals.macd.signal.toFixed(3)} />
        <TechIndicator label="ADX Strength" value={technicals.adx.toFixed(1)} signal={technicals.adx > 25 ? 'bull' : 'neutral'} pct={(technicals.adx / 50) * 100} />
        <TechIndicator label="VWAP Dist" value={`$${Math.abs(price - technicals.vwap).toFixed(2)}`} signal={price > technicals.vwap ? 'bull' : 'bear'} />
        <TechIndicator label="Stochastic %K" value={technicals.stochastic.k.toFixed(1)} signal={technicals.stochastic.k > 80 ? 'bear' : technicals.stochastic.k < 20 ? 'bull' : 'neutral'} pct={technicals.stochastic.k} />
      </div>
    </div>
  );
}

// ── News Panel ──────────────────────────────────────────────

export function NewsPanel({ news }: { news: NewsItem[] }) {
  if (news.length === 0) return null;
  const sentimentBadge = (s: string) => {
    const cls = s === 'positive' ? 'bg-bull/10 text-bull border-bull/20' : s === 'negative' ? 'bg-bear/10 text-bear border-bear/20' : 'bg-surface-3 text-muted border-border/30';
    return <span className={`text-[9px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded-md border ${cls}`}>{s}</span>;
  };

  return (
    <div className="card border-border/30 bg-surface/30">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-4 bg-bull rounded-full" />
        <h3 className="text-sm font-black uppercase tracking-[0.1em] text-foreground">Market Intelligence</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {news.slice(0, 6).map((n, i) => (
          <motion.a 
            key={i} 
            href={n.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="block group"
          >
            <div className="h-full p-4 rounded-xl bg-surface-2/20 border border-border/30 hover:bg-surface-2/40 hover:border-accent/30 transition-all flex flex-col gap-2">
              <div className="flex justify-between items-start gap-2">
                <span className="text-[10px] font-bold text-accent-light bg-accent/10 px-2 py-0.5 rounded uppercase tracking-wider">{n.source}</span>
                {sentimentBadge(n.sentiment)}
              </div>
              <p className="text-sm font-medium text-foreground group-hover:text-accent-light transition-colors line-clamp-3 leading-snug">{n.title}</p>
              <span className="text-[10px] text-muted-2 mt-auto">{new Date(n.publishedAt).toLocaleDateString()}</span>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}

// ── Earnings Panel ──────────────────────────────────────────

export function EarningsPanel({ earnings }: { earnings: EarningsResult[] }) {
  if (earnings.length === 0) return null;
  return (
    <div className="card border-border/30">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-4 bg-accent-light rounded-full" />
        <h3 className="text-sm font-black uppercase tracking-[0.1em] text-foreground">Earnings Execution</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left py-3 text-muted-2 font-bold uppercase tracking-wider">Quarter</th>
              <th className="text-right py-3 text-muted-2 font-bold uppercase tracking-wider">Est EPS</th>
              <th className="text-right py-3 text-muted-2 font-bold uppercase tracking-wider">Act EPS</th>
              <th className="text-right py-3 text-muted-2 font-bold uppercase tracking-wider">Surprise</th>
            </tr>
          </thead>
          <tbody>
            {earnings.slice(0, 6).map((e, i) => (
              <tr key={i} className="border-b border-border/20 last:border-0 hover:bg-surface-2/30 transition-colors">
                <td className="py-3 font-medium text-foreground">{e.period}</td>
                <td className="py-3 text-right font-mono text-muted-2">${e.estimate?.toFixed(2) || '—'}</td>
                <td className="py-3 text-right font-mono font-bold text-foreground">${e.actual?.toFixed(2) || '—'}</td>
                <td className={`py-3 text-right font-mono font-bold ${
                  e.surprisePercent !== null ? (e.surprisePercent >= 0 ? 'text-bull' : 'text-bear') : ''
                }`}>
                  {e.surprisePercent !== null ? `${e.surprisePercent >= 0 ? '+' : ''}${e.surprisePercent.toFixed(1)}%` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Analyst Recommendations ─────────────────────────────────

export function AnalystPanel({ recommendations }: { recommendations: AnalystRecommendation[] }) {
  if (recommendations.length === 0) return null;
  const r = recommendations[0];
  const total = r.strongBuy + r.buy + r.hold + r.sell + r.strongSell;
  if (total === 0) return null;

  const bar = (label: string, value: number, color: string) => (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-bold text-muted-2 w-16 text-right shrink-0 tracking-tighter uppercase">{label}</span>
      <div className="flex-1 h-3 bg-surface-3/50 rounded-full overflow-hidden relative">
        <motion.div 
          initial={{ width: 0 }}
          whileInView={{ width: `${(value / total) * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)]" 
          style={{ backgroundColor: color }} 
        />
      </div>
      <span className="text-[10px] font-mono font-bold w-6 text-right text-foreground">{value}</span>
    </div>
  );

  return (
    <div className="card border-border/30">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-4 bg-bull rounded-full" />
        <h3 className="text-sm font-black uppercase tracking-[0.1em] text-foreground">Analyst Consensus</h3>
      </div>
      <div className="space-y-3">
        {bar('Strong Buy', r.strongBuy, '#22c55e')}
        {bar('Buy', r.buy, '#84cc16')}
        {bar('Hold', r.hold, '#f59e0b')}
        {bar('Sell', r.sell, '#f97316')}
        {bar('Strong Sell', r.strongSell, '#ef4444')}
      </div>
    </div>
  );
}

// ── Alpha Factors Panel ─────────────────────────────────────

export function AlphaFactorsPanel({ alphaScore }: { alphaScore: AlphaScoreResult }) {
  return (
    <div className="card bg-surface-2/30 border-border/40 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1.5 h-4 bg-accent rounded-full shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
        <h3 className="text-sm font-black uppercase tracking-[0.1em] text-foreground">Proprietary AlphaFactors™</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-bull/10">
            <span className="text-bull text-base">🟢</span>
            <p className="text-xs font-black uppercase tracking-widest text-bull">Catalysts</p>
          </div>
          <ul className="space-y-2.5">
            {alphaScore.keyFactors.bull.map((f, i) => (
              <motion.li 
                key={i} 
                initial={{ opacity: 0, x: -5 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-xs text-foreground/80 flex items-start gap-2.5 leading-relaxed"
              >
                <div className="w-1 h-1 rounded-full bg-bull/50 mt-1.5 shrink-0" />
                {f}
              </motion.li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-bear/10">
            <span className="text-bear text-base">🔴</span>
            <p className="text-xs font-black uppercase tracking-widest text-bear">Risks</p>
          </div>
          <ul className="space-y-2.5">
            {alphaScore.keyFactors.bear.map((f, i) => (
              <motion.li 
                key={i} 
                initial={{ opacity: 0, x: 5 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-xs text-foreground/80 flex items-start gap-2.5 leading-relaxed"
              >
                <div className="w-1 h-1 rounded-full bg-bear/50 mt-1.5 shrink-0" />
                {f}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
