// ============================================================
// AlphaLens v6 — Beneish M-Score
// Earnings manipulation detection model
// ============================================================

import type { Financials, BeneishResult } from '@/lib/types';

export function computeBeneishMScore(
  curr: Financials,
  prev: Financials
): BeneishResult {
  // Guard against division by zero
  const safe = (n: number, d: number) => d !== 0 ? n / d : 1;

  // 8 variables
  const DSRI = safe(
    safe(curr.receivables, curr.revenue),
    safe(prev.receivables, prev.revenue)
  );

  const GMI = safe(prev.grossMargin, curr.grossMargin);

  const AQI = safe(
    1 - safe(curr.ppe + curr.currentAssets, curr.totalAssets),
    1 - safe(prev.ppe + prev.currentAssets, prev.totalAssets)
  );

  const SGI = safe(curr.revenue, prev.revenue);

  const DEPI = safe(
    safe(prev.depreciation, prev.depreciation + prev.ppe),
    safe(curr.depreciation, curr.depreciation + curr.ppe)
  );

  const SGAI = safe(
    safe(curr.sgaExpense, curr.revenue),
    safe(prev.sgaExpense, prev.revenue)
  );

  const LVGI = safe(
    safe(curr.totalLiabilities, curr.totalAssets),
    safe(prev.totalLiabilities, prev.totalAssets)
  );

  const TATA = curr.totalAssets !== 0
    ? (curr.netIncome - curr.operatingCashFlow) / curr.totalAssets
    : 0;

  // M-Score formula (Beneish 1999)
  const mScore = -4.84
    + 0.920 * DSRI
    + 0.528 * GMI
    + 0.404 * AQI
    + 0.892 * SGI
    + 0.115 * DEPI
    - 0.172 * SGAI
    + 4.679 * TATA
    - 0.327 * LVGI;

  // Red flags
  const flags: string[] = [];
  if (mScore > -1.78) flags.push('M-Score > -1.78: potential earnings manipulation');
  if (TATA > 0.05) flags.push('High accruals ratio: earnings may lack cash backing');
  if (DSRI > 1.3) flags.push('Days Sales Receivable growing faster than revenue');
  if (AQI > 1.2) flags.push('Asset Quality declining — possible capitalization of expenses');
  if (SGI > 1.4 && GMI > 1.0) flags.push('High growth with declining margins — sustainability risk');
  if (LVGI > 1.2) flags.push('Leverage increasing significantly');
  if (DEPI > 1.1) flags.push('Depreciation slowing — may be inflating earnings');

  return {
    mScore: Math.round(mScore * 100) / 100,
    isLikelyManipulator: mScore > -1.78,
    variables: { DSRI, GMI, AQI, SGI, DEPI, SGAI, LVGI, TATA },
    flags,
  };
}

/**
 * Compute Beneish from a financials array (most recent two periods)
 */
export function computeBeneishFromArray(financials: Financials[]): BeneishResult {
  if (financials.length < 2) {
    return {
      mScore: 0,
      isLikelyManipulator: false,
      variables: { DSRI: 1, GMI: 1, AQI: 1, SGI: 1, DEPI: 1, SGAI: 1, LVGI: 1, TATA: 0 },
      flags: ['Insufficient data for M-Score calculation'],
    };
  }
  return computeBeneishMScore(financials[0], financials[1]);
}
