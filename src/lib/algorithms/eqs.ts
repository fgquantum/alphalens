// ============================================================
// AlphaLens v11 — Earnings Quality Score™ (EQS)
// Beneish M-Score (8 variables) + 5 proprietary accrual flags
// Requires 2 fiscal years — returns null if insufficient history
// ============================================================

import type { Financials, EQSResult } from '@/lib/types';

function safe(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a == null || b == null || b === 0 || !isFinite(a) || !isFinite(b)) return null;
  return a / b;
}

export function computeEQS(financials: Financials[]): EQSResult | null {
  if (financials.length < 2) return null;

  const curr = financials[0];
  const prev = financials[1];

  // Guard: need valid prev-year data
  if (!prev.revenue || !prev.totalAssets) return null;

  // === Beneish 8-variable model ===
  const DSRI = safe(
    safe(curr.receivables, curr.revenue),
    safe(prev.receivables, prev.revenue)
  );
  const GMI = safe(
    safe(prev.revenue - prev.costOfRevenue, prev.revenue),
    safe(curr.revenue - curr.costOfRevenue, curr.revenue)
  );
  const AQI = safe(
    1 - (curr.currentAssets + curr.ppe) / curr.totalAssets,
    1 - (prev.currentAssets + prev.ppe) / prev.totalAssets
  );
  const SGI = safe(curr.revenue, prev.revenue);
  const DEPI = safe(
    safe(prev.depreciation, prev.ppe + prev.depreciation),
    safe(curr.depreciation, curr.ppe + curr.depreciation)
  );
  const SGAI = safe(
    safe(curr.sgaExpense, curr.revenue),
    safe(prev.sgaExpense, prev.revenue)
  );
  const LVGI = safe(
    (curr.currentLiabilities + curr.longTermDebt) / curr.totalAssets,
    (prev.currentLiabilities + prev.longTermDebt) / prev.totalAssets
  );
  const TATA = safe(
    curr.netIncome - curr.operatingCashFlow,
    curr.totalAssets
  );

  // Cannot compute reliably without core variables
  if (DSRI == null || GMI == null || AQI == null || SGI == null) return null;

  const mScore = -4.84
    + 0.920 * DSRI
    + 0.528 * GMI
    + 0.404 * AQI
    + 0.892 * SGI
    + 0.115 * (DEPI ?? 0)
    - 0.172 * (SGAI ?? 0)
    + 4.679 * (TATA ?? 0)
    - 0.327 * (LVGI ?? 0);

  // === Proprietary Flags ===
  const avgAssets = (curr.totalAssets + prev.totalAssets) / 2;
  const accrual = safe(curr.netIncome - curr.operatingCashFlow, avgAssets);

  const revGrow = safe(curr.revenue - prev.revenue, prev.revenue);
  const recGrow = safe(curr.receivables - prev.receivables, prev.receivables);

  const gmCurr = safe(curr.revenue - curr.costOfRevenue, curr.revenue);
  const gmPrev = safe(prev.revenue - prev.costOfRevenue, prev.revenue);

  const fcfGap = safe(
    curr.netIncome - curr.operatingCashFlow,
    Math.abs(curr.netIncome || 1)
  );

  const dsoCurr = safe(curr.receivables * 365, curr.revenue);
  const dsoPrev = safe(prev.receivables * 365, prev.revenue);

  const flags = {
    beneish:     mScore > -1.78,
    accrual:     accrual != null && accrual > 0.10,
    stuffing:    recGrow != null && revGrow != null && (recGrow - revGrow) > 0.15,
    marginErode: gmCurr != null && gmPrev != null && revGrow != null && (gmCurr - gmPrev) < -0.03 && revGrow > 0.05,
    fcfGap:      fcfGap != null && fcfGap > 0.40,
    dsoSpike:    dsoCurr != null && dsoPrev != null && (dsoCurr - dsoPrev) > 10,
  };

  let eqs = 100;
  if (flags.beneish)     eqs -= 35;
  if (flags.accrual)     eqs -= 15;
  if (flags.stuffing)    eqs -= 15;
  if (flags.marginErode) eqs -= 10;
  if (flags.fcfGap)      eqs -= 15;
  if (flags.dsoSpike)    eqs -= 10;

  eqs = Math.max(0, Math.min(100, eqs));

  const EQS_LABELS: Record<string, string> = {
    beneish:    'Beneish M-Score elevated — statistical manipulation probability high',
    accrual:    'High accrual ratio — earnings outpacing cash generation',
    stuffing:   'Receivables outpacing revenue — possible channel stuffing',
    marginErode:'Gross margin compressing during revenue growth',
    fcfGap:     'Net income materially exceeds operating cash flow',
    dsoSpike:   'Days Sales Outstanding rising >10 days — aggressive recognition',
  };

  return {
    eqs,
    mScore: +mScore.toFixed(3),
    flags,
    activeFlags: Object.entries(flags)
      .filter(([, v]) => v)
      .map(([k]) => EQS_LABELS[k]),
  };
}
