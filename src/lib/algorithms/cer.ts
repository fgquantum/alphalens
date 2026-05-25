// ============================================================
// AlphaLens v11 — Capital Efficiency Ratio™ (CER)
// ROIC per unit of leverage. Penalizes debt-driven ROE inflation.
// Rewards genuine business returns.
// ============================================================

import type { Financials, CERResult } from '@/lib/types';

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function computeCER(financials: Financials[]): CERResult {
  if (financials.length === 0) {
    return { cer: 50, label: 'Insufficient data' };
  }

  const f = financials[0];

  // Need ROIC and FCF data
  const roic = f.roe != null ? f.roe : 0; // Use ROE as proxy if ROIC unavailable
  const investedCapital = f.totalEquity + f.longTermDebt;

  if (!f.freeCashFlow || investedCapital <= 0) {
    return { cer: 50, label: 'Insufficient data' };
  }

  // ROIC calculation (better than ROE — strips leverage effect)
  const actualROIC = f.totalAssets > 0
    ? f.operatingIncome * (1 - 0.21) / investedCapital // After-tax NOPAT / IC
    : roic;

  // Leverage penalty: D/E above 0.5 gets penalized
  const levPenalty = Math.max(0, (f.debtToEquity ?? 0) - 0.5) * 0.15;

  // FCF conversion: how much net income converts to cash
  const fcfConv = clamp(
    f.freeCashFlow / Math.max(Math.abs(f.netIncome || 1), 1),
    0.3, 1.5
  );

  // Capital turns: revenue per dollar of invested capital
  const capTurns = clamp(
    (f.revenue / Math.max(investedCapital, 1)) / 2,
    0, 1
  );

  const cer = Math.round(clamp(
    ((actualROIC - levPenalty) * fcfConv * capTurns) * 100,
    0, 100
  ));

  const label = cer >= 80 ? 'Exceptional'
    : cer >= 60 ? 'Efficient'
    : cer >= 40 ? 'Average'
    : cer >= 20 ? 'Inefficient'
    : 'Capital Destroyer';

  return { cer, label };
}
