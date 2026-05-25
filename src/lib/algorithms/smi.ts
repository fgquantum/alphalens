// ============================================================
// AlphaLens v11 — Smart Money Index™ (SMI)
// Institutional end-of-day accumulation vs retail gap/news reaction
// Rising SMI + flat price = stealth institutional buying
// ============================================================

import type { OHLCV, SMIResult } from '@/lib/types';

function EMA(data: number[], period: number): number {
  if (data.length === 0) return 0;
  const k = 2 / (period + 1);
  let ema = data[0];
  for (let i = 1; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function computeSMI(history: OHLCV[]): SMIResult {
  if (history.length < 30) {
    return { smi: 50, label: 'Insufficient data', trend: 'flat' };
  }

  const sm: number[] = [];
  const dm: number[] = [];

  for (let i = 1; i < history.length; i++) {
    const bar = history[i];
    const prev = history[i - 1];
    const range = bar.high - bar.low;

    if (range < 0.001) continue;

    // Smart money: end-of-day direction (institutional, methodical)
    sm.push((bar.close - bar.open) / range);
    // Dumb money: gap reaction (retail, emotional, news-driven)
    dm.push((bar.open - prev.close) / range);
  }

  if (sm.length < 20) {
    return { smi: 50, label: 'Insufficient data', trend: 'flat' };
  }

  const smE = EMA(sm, 20);
  const dmE = EMA(dm, 20);
  const smi = Math.round(clamp(((smE - dmE) + 0.5) * 100, 0, 100));

  // Trend: compare current vs 10-bar-ago SMI
  const smP = EMA(sm.slice(0, -10), 20);
  const dmP = EMA(dm.slice(0, -10), 20);
  const prev = clamp(((smP - dmP) + 0.5) * 100, 0, 100);
  const trend = smi > prev + 3 ? 'rising' as const : smi < prev - 3 ? 'falling' as const : 'flat' as const;

  const label = smi >= 75 ? 'Strong Institutional Accumulation'
    : smi >= 60 ? 'Mild Institutional Buying'
    : smi >= 40 ? 'Neutral'
    : smi >= 25 ? 'Distribution Pressure'
    : 'Heavy Institutional Selling';

  return { smi, label, trend };
}
