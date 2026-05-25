'use client';

const ALGOS = [
  {
    name: 'AlphaScore™ v12',
    score: '87/100',
    scoreColor: '#00D97E',
    desc: 'Composite of 54 metrics across 6 weighted dimensions (Value/Quality/Growth/Momentum/Safety/Dividend), percentile-scored against sector median.',
    formula: 'Σ wᵢ · percentileSector(metricᵢ) − flagPenalty',
    color: '#00D97E',
  },
  {
    name: 'TSI™ · Trend Strength',
    score: '82/100',
    scoreColor: '#3B82F6',
    desc: 'Six-component directional conviction: ADX, BB width, volume, MA stack, DI divergence, R².',
    formula: '0.25·ADX + 0.15·BB + 0.15·Vol + 0.20·MA + 0.15·DI + 0.10·R²',
    color: '#3B82F6',
  },
  {
    name: 'EQS™ · Earnings Quality',
    score: '88/100',
    scoreColor: '#F97316',
    desc: 'Beneish M-Score plus 5 accrual flags. Detects accounting manipulation before price.',
    formula: '100 − Σ flagPenalty(M, AQ, CS, GM, FCF, DSO)',
    color: '#F97316',
  },
  {
    name: 'AlphaMomentum™',
    score: '94 pct',
    scoreColor: '#8B5CF6',
    desc: 'Skip-1-month momentum (12-1, 6-1, 3-1), volatility-adjusted, percentile within sector.',
    formula: '(0.4·r12-1 + 0.35·r6-1 + 0.25·r3-1) / vol·√252',
    color: '#8B5CF6',
  },
  {
    name: 'SMI™ · Smart Money',
    score: '79/100',
    scoreColor: '#22C55E',
    desc: 'End-of-day institutional accumulation vs open-gap retail reaction.',
    formula: '((EMA₂₀(smart) − EMA₂₀(dumb)) + 0.5) · 100',
    color: '#22C55E',
  },
  {
    name: 'CER™ · Capital Efficiency',
    score: '76/100',
    scoreColor: '#EAB308',
    desc: 'ROIC per unit of leverage — penalizes debt-driven ROE inflation.',
    formula: 'ROIC − levPenalty(D/E) · fcfConversion · capTurnover',
    color: '#EAB308',
  },
  {
    name: 'Piotroski F-Score',
    score: '8/9',
    scoreColor: '#00D97E',
    desc: '9-point profitability / leverage / efficiency scorecard.',
    formula: 'Σ binaryCheck(9 criteria)',
    color: '#00D97E',
  },
  {
    name: 'Vol Regime™',
    score: 'EXPANSION',
    scoreColor: '#F5A623',
    desc: 'Classifies volatility: COMPRESSION, EXPANSION, MEAN-REVERSION, CAPITULATION.',
    formula: 'BBWidth/BBAvg · ATR/ATRAvg · kurtosis',
    color: '#F5A623',
  },
  {
    name: 'Earnings Momentum™',
    score: '96/100',
    scoreColor: '#00D97E',
    desc: 'EPS revisions, beat rate, surprise magnitude, analyst agreement.',
    formula: 'revTrend · beatRate · surpriseMag · agreement',
    color: '#00D97E',
  },
  {
    name: 'Beneish M-Score',
    score: '−2.61',
    scoreColor: '#FF4D6D',
    desc: 'Academic 8-variable manipulation detector. Crosses −1.78 on aggressive rev-rec.',
    formula: '−4.84 + 0.92·DSRI + 0.53·GMI + 0.44·AQI + 0.58·SGI + …',
    color: '#FF4D6D',
  },
  {
    name: 'Macro Regime',
    score: 'LATE-CYCLE',
    scoreColor: '#3B82F6',
    desc: 'Yield curve, CPI, GDP, Fed policy → 4 regimes. Sector stance from historical factors.',
    formula: 'classify(yieldCurve, CPI Δ, GDP, fedStance)',
    color: '#3B82F6',
  },
  {
    name: 'Edge Score',
    score: '0.72',
    scoreColor: '#8B5CF6',
    desc: 'Probability the AlphaScore is UNDERSTATING fundamental quality.',
    formula: 'P(score < trueQuality | momentum, insider, peer div.)',
    color: '#8B5CF6',
  },
];

export default function AlgosPage() {
  return (
    <div className="max-w-[1400px] mx-auto p-5 xl:p-6 animate-fade-in">
      {/* Header */}
      <div className="obs-panel p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative">
          <div className="obs-label mb-2">THE 12 ALGORITHMS</div>
          <h1 className="font-mono text-2xl md:text-3xl font-bold leading-tight mb-3">
            Every score, signal, and badge is pre-computed<br />
            nightly across 5,000+ tickers.{' '}
            <span style={{ color: '#00D97E' }}>Served from the edge in under 50ms.</span>
          </h1>
          <div className="flex flex-wrap gap-3 mt-4">
            {[
              { label: '54 METRICS', color: '#00D97E' },
              { label: '6 DIMENSIONS', color: '#3B82F6' },
              { label: '5,000+ TICKERS', color: '#8B5CF6' },
              { label: 'NIGHTLY COMPUTE', color: '#F5A623' },
            ].map(b => (
              <span key={b.label} className="obs-chip text-[10px]"
                style={{ borderColor: b.color, color: b.color, background: b.color + '12' }}>
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Algorithm grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALGOS.map((algo) => (
          <div key={algo.name} className="obs-panel p-5 flex flex-col gap-3 hover:border-white/[0.12] transition-colors">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-mono text-sm font-bold" style={{ color: algo.color }}>{algo.name}</div>
              </div>
              <span className="font-mono text-lg font-bold shrink-0" style={{ color: algo.scoreColor }}>
                {algo.score}
              </span>
            </div>

            {/* Description */}
            <p className="font-mono text-[11px] text-muted leading-relaxed flex-1">{algo.desc}</p>

            {/* Formula */}
            <div className="px-3 py-2 border-l-2 mt-1" style={{ borderColor: algo.color + '60', background: algo.color + '06' }}>
              <code className="font-mono text-[10px] text-foreground/80 break-all">{algo.formula}</code>
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-6 p-4 obs-panel">
        <p className="font-mono text-[10px] text-muted leading-relaxed text-center">
          AlphaLens algorithms are proprietary mathematical models for educational and informational purposes only.
          AlphaScore™, TSI™, EQS™, AlphaMomentum™, SMI™, CER™, Vol Regime™, Earnings Momentum™, Macro Regime™, Edge Score™ are trademarks of AlphaLens.
          No output constitutes investment advice. Past performance does not guarantee future results.
        </p>
      </div>
    </div>
  );
}
