// ============================================================
// AlphaLens v6 — Piotroski F-Score
// 9-point scoring system for financial strength
// ============================================================

import type { Financials, PiotroskiResult } from '@/lib/types';

export function computePiotroskiFScore(
  current: Financials,
  previous: Financials
): PiotroskiResult {
  const breakdown = {
    // PROFITABILITY (4 points)
    positiveNetIncome: current.netIncome > 0,
    positiveCashFlow: current.operatingCashFlow > 0,
    roaIncreasing: current.roa > previous.roa,
    cashFlowGtIncome: current.operatingCashFlow > current.netIncome,

    // LEVERAGE/LIQUIDITY (3 points)
    decreasingLeverage: current.totalAssets > 0 && previous.totalAssets > 0
      ? (current.longTermDebt / current.totalAssets) < (previous.longTermDebt / previous.totalAssets)
      : false,
    improvingLiquidity: current.currentRatio > previous.currentRatio,
    noDilution: current.sharesOutstanding <= previous.sharesOutstanding,

    // OPERATING EFFICIENCY (2 points)
    improvingMargins: current.grossMargin > previous.grossMargin,
    improvingEfficiency: current.assetTurnover > previous.assetTurnover,
  };

  const score = Object.values(breakdown).filter(Boolean).length;

  let grade: string;
  if (score >= 8) grade = 'Excellent';
  else if (score >= 6) grade = 'Strong';
  else if (score >= 3) grade = 'Average';
  else grade = 'Weak';

  return { score, grade, breakdown };
}

/**
 * Compute Piotroski from a financials array (most recent two periods)
 */
export function computePiotroskiFromArray(financials: Financials[]): PiotroskiResult {
  if (financials.length < 2) {
    return {
      score: 0,
      grade: 'N/A',
      breakdown: {
        positiveNetIncome: false,
        positiveCashFlow: false,
        roaIncreasing: false,
        cashFlowGtIncome: false,
        decreasingLeverage: false,
        improvingLiquidity: false,
        noDilution: false,
        improvingMargins: false,
        improvingEfficiency: false,
      },
    };
  }
  return computePiotroskiFScore(financials[0], financials[1]);
}
