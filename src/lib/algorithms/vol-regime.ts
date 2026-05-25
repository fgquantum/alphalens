// ============================================================
// AlphaLens v11 — Volatility Regime™
// 5-state classification of the stock's current volatility vs history
// Not a risk score — a regime classification that contextualizes signals
// ============================================================

import type { OHLCV, VolRegimeResult } from '@/lib/types';

function std(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

export function computeVolRegime(history: OHLCV[]): VolRegimeResult {
  const closes = history.map(c => c.close);

  if (closes.length < 63) {
    return {
      volRegime: 'NORMAL',
      volRegimeLabel: 'Insufficient History',
      vol5d: 0, vol21d: 0, vol252d: 0, volPercentile: 50,
    };
  }

  const returns = closes.map((c, i, a) => i === 0 ? 0 : (c - a[i - 1]) / a[i - 1]);
  const recentReturns = returns.slice(-Math.min(252, returns.length));

  const vol5d   = std(recentReturns.slice(-5))  * Math.sqrt(252) * 100;
  const vol21d  = std(recentReturns.slice(-21)) * Math.sqrt(252) * 100;
  const vol63d  = std(recentReturns.slice(-63)) * Math.sqrt(252) * 100;
  const vol252d = std(recentReturns) * Math.sqrt(252) * 100;

  // Percentile of current 5d vol vs rolling 5d vol over 1Y
  const rollingVols: number[] = [];
  for (let i = 5; i < recentReturns.length; i++) {
    rollingVols.push(std(recentReturns.slice(i - 5, i)) * Math.sqrt(252) * 100);
  }
  const pctile = rollingVols.length > 0
    ? rollingVols.filter(v => v < vol5d).length / rollingVols.length
    : 0.5;

  type VolRegime = 'COMPRESSION' | 'EXPANSION' | 'ELEVATED' | 'NORMAL' | 'CRISIS';

  const regime: VolRegime =
    vol252d > 0 && vol5d < vol252d * 0.5 ? 'COMPRESSION' :
    vol252d > 0 && vol5d > vol252d * 2.5 ? 'CRISIS' :
    vol252d > 0 && vol5d > vol252d * 1.5 ? 'ELEVATED' :
    vol5d > vol21d ? 'EXPANSION' :
    'NORMAL';

  const labels: Record<VolRegime, string> = {
    COMPRESSION: 'Vol Compression — Breakout Incoming',
    EXPANSION:   'Vol Expanding — Trend Accelerating',
    ELEVATED:    'Elevated Volatility — Heightened Risk',
    NORMAL:      'Normal Volatility Range',
    CRISIS:      'Crisis Volatility — Exercise Caution',
  };

  return {
    volRegime: regime,
    volRegimeLabel: labels[regime],
    vol5d:  +vol5d.toFixed(1),
    vol21d: +vol21d.toFixed(1),
    vol252d: +vol252d.toFixed(1),
    volPercentile: Math.round(pctile * 100),
  };
}
