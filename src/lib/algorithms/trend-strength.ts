// ============================================================
// AlphaLens v11 — Trend Strength Index™ (TSI) v2
// Six-component directional conviction score
// Tells you if a price trend is real, orderly, and sustainable
// ============================================================

import type { OHLCV, TSIResult } from '@/lib/types';

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function SMA(data: number[], period: number): number {
  if (data.length < period) return data.length > 0 ? data[data.length - 1] : 0;
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function std(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

// True Range
function TR(h: OHLCV, prevClose: number): number {
  return Math.max(h.high - h.low, Math.abs(h.high - prevClose), Math.abs(h.low - prevClose));
}

// ADX computation (Wilder smoothed)
function computeADX(history: OHLCV[], period: number = 14): number {
  if (history.length < period * 2) return 25; // neutral default

  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];

  for (let i = 1; i < history.length; i++) {
    const curr = history[i];
    const prev = history[i - 1];
    const upMove = curr.high - prev.high;
    const downMove = prev.low - curr.low;
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    tr.push(TR(curr, prev.close));
  }

  // Wilder smoothed averages
  let atr = mean(tr.slice(0, period));
  let pdi = mean(plusDM.slice(0, period));
  let mdi = mean(minusDM.slice(0, period));
  const dx: number[] = [];

  for (let i = period; i < tr.length; i++) {
    atr = (atr * (period - 1) + tr[i]) / period;
    pdi = (pdi * (period - 1) + plusDM[i]) / period;
    mdi = (mdi * (period - 1) + minusDM[i]) / period;
    const pdiNorm = atr > 0 ? (pdi / atr) * 100 : 0;
    const mdiNorm = atr > 0 ? (mdi / atr) * 100 : 0;
    const sum = pdiNorm + mdiNorm;
    dx.push(sum > 0 ? (Math.abs(pdiNorm - mdiNorm) / sum) * 100 : 0);
  }

  if (dx.length < period) return mean(dx) || 25;
  let adx = mean(dx.slice(0, period));
  for (let i = period; i < dx.length; i++) {
    adx = (adx * (period - 1) + dx[i]) / period;
  }
  return adx;
}

// DI+ and DI- (directional indicators)
function computeDI(history: OHLCV[], period: number = 14): { diP: number; diM: number } {
  if (history.length < period + 1) return { diP: 25, diM: 25 };

  let pdiSum = 0, mdiSum = 0, trSum = 0;
  for (let i = 1; i <= period; i++) {
    const curr = history[history.length - i];
    const prev = history[history.length - i - 1];
    if (!curr || !prev) continue;
    const upMove = curr.high - prev.high;
    const downMove = prev.low - curr.low;
    pdiSum += (upMove > downMove && upMove > 0) ? upMove : 0;
    mdiSum += (downMove > upMove && downMove > 0) ? downMove : 0;
    trSum += TR(curr, prev.close);
  }

  return {
    diP: trSum > 0 ? (pdiSum / trSum) * 100 : 25,
    diM: trSum > 0 ? (mdiSum / trSum) * 100 : 25,
  };
}

// Bollinger Band Width
function computeBBWidth(history: OHLCV[], period: number = 20, mult: number = 2): number[] {
  const closes = history.map(c => c.close);
  const widths: number[] = [];
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const m = mean(slice);
    const s = std(slice);
    const upper = m + mult * s;
    const lower = m - mult * s;
    widths.push(m > 0 ? (upper - lower) / m : 0);
  }
  return widths;
}

// R² (coefficient of determination) — how "orderly" is the trend
function computeR2(closes: number[]): number {
  const n = closes.length;
  if (n < 10) return 0.5;
  const xs = Array.from({ length: n }, (_, i) => i);
  const mx = mean(xs);
  const my = mean(closes);
  let ssXY = 0, ssXX = 0, ssYY = 0;
  for (let i = 0; i < n; i++) {
    ssXY += (xs[i] - mx) * (closes[i] - my);
    ssXX += (xs[i] - mx) ** 2;
    ssYY += (closes[i] - my) ** 2;
  }
  if (ssXX === 0 || ssYY === 0) return 0;
  const r = ssXY / Math.sqrt(ssXX * ssYY);
  return clamp(r * r, 0, 1);
}

export function computeTrendStrength(history: OHLCV[]): TSIResult {
  if (!history || history.length < 60) {
    return {
      tsi: 50,
      label: 'Insufficient history',
      components: { adx: 5, bb: 5, volume: 5, maStack: 5, di: 5, r2: 5 },
    };
  }

  const closes = history.map(c => c.close);
  const price = closes[closes.length - 1];

  // Component 1: ADX — trend strength regardless of direction
  const adx = computeADX(history, 14);

  // Component 2: Bollinger Band width — expanding bands = trending
  const bbWidth = computeBBWidth(history, 20, 2);
  const bbAvg = mean(bbWidth.slice(-20));
  const bbCurrent = bbWidth[bbWidth.length - 1] || 0;

  // Component 3: Volume confirmation
  const recentVol = mean(history.slice(-5).map(c => c.volume));
  const baseVol = mean(history.slice(-30).map(c => c.volume));
  const priceUp = closes[closes.length - 1] > closes[closes.length - 10];

  // Component 4: MA stack alignment
  const sma20 = SMA(closes, 20);
  const sma50 = SMA(closes, 50);
  const sma200 = SMA(closes, Math.min(200, closes.length));
  const bull = price > sma20 && sma20 > sma50 && sma50 > sma200;
  const bear = price < sma20 && sma20 < sma50 && sma50 < sma200;

  // Component 5: Directional imbalance
  const { diP, diM } = computeDI(history, 14);

  // Component 6: R² — statistical orderliness of 60-day price path
  const r2 = computeR2(closes.slice(-60));

  const components = {
    adx:      clamp((adx / 50) * 10, 0, 10),
    bb:       clamp((bbCurrent / Math.max(bbAvg, 0.001)) * 5, 0, 10),
    volume:   clamp((recentVol / Math.max(baseVol, 1)) * (priceUp ? 5 : 3), 0, 10),
    maStack:  bull ? 10 : bear ? 0 : 5,
    di:       clamp(((diP - diM) / 40 + 0.5) * 10, 0, 10),
    r2:       r2 * 10,
  };

  const tsi = Math.round(clamp(
    components.adx * 0.25 +
    components.bb * 0.15 +
    components.volume * 0.15 +
    components.maStack * 0.20 +
    components.di * 0.15 +
    components.r2 * 0.10,
    0, 10
  ) * 10);

  const label = tsi >= 80 ? 'Strong Trend'
    : tsi >= 60 ? 'Developing'
    : tsi >= 40 ? 'Mixed'
    : tsi >= 20 ? 'Weakening'
    : 'Ranging';

  return { tsi, label, components };
}
