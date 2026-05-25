// ============================================================
// AlphaLens v11 — AlphaMomentum™ Rank (0-100, sector-relative)
// Skip-1-month momentum (quant standard: avoids reversal traps)
// Volatility-adjusted, percentile-ranked within sector
// ============================================================

import type { OHLCV, AlphaMomentumResult } from '@/lib/types';

function std(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

export function computeAlphaMomentum(
  history: OHLCV[],
  sectorDistribution: number[] = []
): AlphaMomentumResult {
  const closes = history.map(h => h.close);
  const n = closes.length;

  if (n < 252) {
    return { rank: 50, sectorRank: 50, ret12m1m: null, ret6m1m: null, ret3m1m: null };
  }

  // Skip-1-month returns (exclude most recent 22 trading days to avoid reversal traps)
  const r12 = (closes[n - 22] - closes[n - 252]) / closes[n - 252];
  const r6  = (closes[n - 22] - closes[n - 126]) / closes[n - 126];
  const r3  = (closes[n - 22] - closes[n - 63])  / closes[n - 63];

  // Annualized volatility for risk adjustment
  const rets = closes.slice(-252).map((p, i, a) => i === 0 ? 0 : (p - a[i - 1]) / a[i - 1]);
  const vol = std(rets) * Math.sqrt(252);

  // Composite: weighted by timeframe, divided by volatility for risk-adjustment
  const composite = (r12 * 0.40 + r6 * 0.35 + r3 * 0.25) / Math.max(vol, 0.10);

  // Percentile rank within sector distribution
  const rank = sectorDistribution.length > 0
    ? Math.round((sectorDistribution.filter(v => v < composite).length / sectorDistribution.length) * 100)
    : Math.round(Math.min(Math.max(composite * 50 + 50, 0), 100)); // fallback without sector data

  return {
    rank,
    sectorRank: rank,
    ret12m1m: +(r12 * 100).toFixed(1),
    ret6m1m:  +(r6  * 100).toFixed(1),
    ret3m1m:  +(r3  * 100).toFixed(1),
  };
}
