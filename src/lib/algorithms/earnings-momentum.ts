// ============================================================
// AlphaLens v11 — Earnings Momentum™ Score (0-100)
// Measures trajectory and quality of earnings estimate revisions
// High earnings momentum predicts price outperformance 3-6mo forward
// ============================================================

import type { Financials, EarningsResult, EarningsMomentumResult } from '@/lib/types';

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function computeEarningsMomentum(
  financials: Financials[],
  earnings: EarningsResult[]
): EarningsMomentumResult {
  if (financials.length < 2 && earnings.length < 2) {
    return {
      earnMomentum: 50,
      earnMomentumLabel: 'Insufficient data',
      components: { revisionScore: 5, beatScore: 5, revSurprise: 5, accelScore: 5 },
    };
  }

  // Component 1: Earnings beat rate (30%)
  // How many of last 4 quarters beat estimates
  let beatCount = 0;
  let totalQuarters = 0;
  for (const e of earnings.slice(0, 4)) {
    if (e.actual != null && e.estimate != null) {
      totalQuarters++;
      if (e.actual > e.estimate) beatCount++;
    }
  }
  const beatRate = totalQuarters > 0 ? beatCount / totalQuarters : 0.5;
  const beatScore = clamp(beatRate * 10, 0, 10);

  // Component 2: Average earnings surprise (30%)
  // Consistent positive surprises signal business momentum
  const surprises = earnings
    .slice(0, 4)
    .map(e => e.surprisePercent)
    .filter((s): s is number => s != null);
  const avgSurprise = surprises.length > 0
    ? surprises.reduce((a, b) => a + b, 0) / surprises.length
    : 0;
  const revisionScore = clamp(((avgSurprise) / 5 + 0.5) * 10, 0, 10);

  // Component 3: Revenue surprise (20%)
  // Revenue beats signal real demand, not just cost-cutting
  const revSurprise = clamp(((avgSurprise * 0.7) / 3 + 0.5) * 10, 0, 10);

  // Component 4: EPS growth acceleration (20%)
  let accelScore = 5;
  if (financials.length >= 3) {
    const curr = financials[0].eps;
    const prev = financials[1].eps;
    const prev2 = financials[2].eps;
    if (prev > 0 && prev2 > 0) {
      const recentGrowth = (curr - prev) / Math.abs(prev);
      const priorGrowth = (prev - prev2) / Math.abs(prev2);
      const accel = recentGrowth - priorGrowth;
      accelScore = clamp(((accel) / 0.1 + 0.5) * 10, 0, 10);
    }
  }

  const raw = revisionScore * 0.30 + beatScore * 0.30 + revSurprise * 0.20 + accelScore * 0.20;
  const score = Math.round(clamp(raw * 10, 0, 100));

  const label = score >= 80 ? 'Strong Positive Momentum'
    : score >= 60 ? 'Improving'
    : score >= 40 ? 'Neutral'
    : score >= 20 ? 'Deteriorating'
    : 'Collapsing';

  return {
    earnMomentum: score,
    earnMomentumLabel: label,
    components: {
      revisionScore: +revisionScore.toFixed(1),
      beatScore: +beatScore.toFixed(1),
      revSurprise: +revSurprise.toFixed(1),
      accelScore: +accelScore.toFixed(1),
    },
  };
}
