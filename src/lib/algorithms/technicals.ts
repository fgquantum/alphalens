// ============================================================
// AlphaLens v6 — Technical Indicators
// All computed locally from historical price data
// ============================================================

import type { OHLCV, TechnicalIndicators, PivotLevels, FibonacciLevels } from '@/lib/types';

// ── RSI (Wilder's Relative Strength Index) ──────────────────

export function RSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }

  avgGain /= period;
  avgLoss /= period;

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// ── Simple Moving Average ───────────────────────────────────

export function SMA(prices: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }
  return result;
}

export function smaLast(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

// ── Exponential Moving Average ──────────────────────────────

export function EMA(prices: number[], period: number): number[] {
  if (prices.length === 0) return [];
  const k = 2 / (period + 1);
  const result: number[] = [prices[0]];
  for (let i = 1; i < prices.length; i++) {
    result.push(prices[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

export function emaLast(prices: number[], period: number): number {
  const emaArr = EMA(prices, period);
  return emaArr[emaArr.length - 1] || 0;
}

// ── MACD (12/26/9) ──────────────────────────────────────────

export function MACD(prices: number[]): { macd: number[]; signal: number[]; histogram: number[] } {
  const ema12 = EMA(prices, 12);
  const ema26 = EMA(prices, 26);
  const macdLine: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    macdLine.push((ema12[i] || 0) - (ema26[i] || 0));
  }

  const signal = EMA(macdLine, 9);
  const histogram: number[] = [];
  for (let i = 0; i < macdLine.length; i++) {
    histogram.push(macdLine[i] - (signal[i] || 0));
  }

  return { macd: macdLine, signal, histogram };
}

// ── Bollinger Bands ─────────────────────────────────────────

export function BollingerBands(prices: number[], period = 20, mult = 2): { upper: number; middle: number; lower: number }[] {
  const result: { upper: number; middle: number; lower: number }[] = [];
  
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
    const stdDev = Math.sqrt(variance);
    
    result.push({
      upper: mean + mult * stdDev,
      middle: mean,
      lower: mean - mult * stdDev,
    });
  }
  
  return result;
}

// ── ADX (Average Directional Index) ─────────────────────────

export function ADX(ohlc: OHLCV[], period = 14): number {
  if (ohlc.length < period * 2) return 25; // neutral default

  const trueRanges: number[] = [];
  const plusDMs: number[] = [];
  const minusDMs: number[] = [];

  for (let i = 1; i < ohlc.length; i++) {
    const high = ohlc[i].high;
    const low = ohlc[i].low;
    const prevHigh = ohlc[i - 1].high;
    const prevLow = ohlc[i - 1].low;
    const prevClose = ohlc[i - 1].close;

    trueRanges.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
    const plusDM = high - prevHigh > prevLow - low ? Math.max(high - prevHigh, 0) : 0;
    const minusDM = prevLow - low > high - prevHigh ? Math.max(prevLow - low, 0) : 0;
    plusDMs.push(plusDM);
    minusDMs.push(minusDM);
  }

  // Wilder's smoothing
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothPlusDM = plusDMs.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothMinusDM = minusDMs.slice(0, period).reduce((a, b) => a + b, 0);

  const dxValues: number[] = [];

  for (let i = period; i < trueRanges.length; i++) {
    atr = atr - atr / period + trueRanges[i];
    smoothPlusDM = smoothPlusDM - smoothPlusDM / period + plusDMs[i];
    smoothMinusDM = smoothMinusDM - smoothMinusDM / period + minusDMs[i];

    const plusDI = atr > 0 ? (smoothPlusDM / atr) * 100 : 0;
    const minusDI = atr > 0 ? (smoothMinusDM / atr) * 100 : 0;
    const diSum = plusDI + minusDI;
    const dx = diSum > 0 ? (Math.abs(plusDI - minusDI) / diSum) * 100 : 0;
    dxValues.push(dx);
  }

  if (dxValues.length < period) return dxValues[dxValues.length - 1] || 25;

  let adx = dxValues.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < dxValues.length; i++) {
    adx = (adx * (period - 1) + dxValues[i]) / period;
  }

  return Math.round(adx * 100) / 100;
}

// ── ATR (Average True Range) ────────────────────────────────

export function ATR(ohlc: OHLCV[], period = 14): number[] {
  if (ohlc.length < 2) return [0];
  
  const trueRanges: number[] = [];
  for (let i = 1; i < ohlc.length; i++) {
    const tr = Math.max(
      ohlc[i].high - ohlc[i].low,
      Math.abs(ohlc[i].high - ohlc[i - 1].close),
      Math.abs(ohlc[i].low - ohlc[i - 1].close)
    );
    trueRanges.push(tr);
  }

  const result: number[] = [];
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(atr);

  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
    result.push(atr);
  }

  return result;
}

// ── Stochastic Oscillator ───────────────────────────────────

export function Stochastic(ohlc: OHLCV[], kPeriod = 14, dPeriod = 3): { k: number; d: number } {
  if (ohlc.length < kPeriod) return { k: 50, d: 50 };

  const kValues: number[] = [];
  for (let i = kPeriod - 1; i < ohlc.length; i++) {
    const slice = ohlc.slice(i - kPeriod + 1, i + 1);
    const high = Math.max(...slice.map(o => o.high));
    const low = Math.min(...slice.map(o => o.low));
    const k = high !== low ? ((ohlc[i].close - low) / (high - low)) * 100 : 50;
    kValues.push(k);
  }

  const k = kValues[kValues.length - 1] || 50;
  const d = kValues.length >= dPeriod
    ? kValues.slice(-dPeriod).reduce((a, b) => a + b, 0) / dPeriod
    : k;

  return { k: Math.round(k * 100) / 100, d: Math.round(d * 100) / 100 };
}

// ── VWAP (Volume Weighted Average Price) ────────────────────

export function VWAP(ohlc: OHLCV[]): number[] {
  let cumTypicalVolume = 0;
  let cumVolume = 0;
  
  return ohlc.map(bar => {
    const typical = (bar.high + bar.low + bar.close) / 3;
    cumTypicalVolume += typical * bar.volume;
    cumVolume += bar.volume;
    return cumVolume > 0 ? cumTypicalVolume / cumVolume : typical;
  });
}

// ── OBV (On Balance Volume) ─────────────────────────────────

export function OBV(prices: number[], volumes: number[]): number[] {
  const result: number[] = [0];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > prices[i - 1]) {
      result.push(result[i - 1] + volumes[i]);
    } else if (prices[i] < prices[i - 1]) {
      result.push(result[i - 1] - volumes[i]);
    } else {
      result.push(result[i - 1]);
    }
  }
  return result;
}

// ── Pivot Points ────────────────────────────────────────────

export function PivotPoints(h: number, l: number, c: number): PivotLevels {
  const pp = (h + l + c) / 3;
  return {
    pp,
    r1: 2 * pp - l,
    r2: pp + (h - l),
    r3: h + 2 * (pp - l),
    s1: 2 * pp - h,
    s2: pp - (h - l),
    s3: l - 2 * (h - pp),
  };
}

// ── Fibonacci Retracements ──────────────────────────────────

export function FibonacciRetracements(high: number, low: number): FibonacciLevels {
  const diff = high - low;
  return {
    high,
    low,
    level236: high - diff * 0.236,
    level382: high - diff * 0.382,
    level500: high - diff * 0.500,
    level618: high - diff * 0.618,
    level786: high - diff * 0.786,
  };
}

// ── Keyword-based Sentiment (NO AI) ─────────────────────────

export function scoreSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lower = text.toLowerCase();
  const pos = ['beat', 'exceeded', 'growth', 'upgrade', 'bullish', 'strong', 'surge', 'record',
    'breakout', 'outperform', 'raised', 'optimistic', 'profit', 'innovation', 'soar', 'rally',
    'dividend increase', 'buyback', 'expansion', 'beat expectations', 'all-time high', 'momentum'];
  const neg = ['miss', 'downgrade', 'decline', 'lawsuit', 'bearish', 'weak', 'plunge', 'warning',
    'cut', 'debt', 'loss', 'investigation', 'layoff', 'recall', 'crash', 'default', 'fraud',
    'bankruptcy', 'subpoena', 'sec probe', 'missed expectations', 'sell-off', 'downturn'];
  let s = 0;
  pos.forEach(w => { if (lower.includes(w)) s++; });
  neg.forEach(w => { if (lower.includes(w)) s--; });
  return s > 0 ? 'positive' : s < 0 ? 'negative' : 'neutral';
}

// ── Compute All Technicals ──────────────────────────────────

export function computeAllTechnicals(ohlc: OHLCV[]): TechnicalIndicators {
  const prices = ohlc.map(o => o.close);
  const volumes = ohlc.map(o => o.volume);
  
  const macdResult = MACD(prices);
  const bb = BollingerBands(prices);
  const lastBB = bb[bb.length - 1] || { upper: 0, middle: 0, lower: 0 };
  const vwapArr = VWAP(ohlc);
  const obvArr = OBV(prices, volumes);
  const atrArr = ATR(ohlc);

  return {
    rsi: Math.round(RSI(prices) * 100) / 100,
    sma20: smaLast(prices, 20),
    sma50: smaLast(prices, 50),
    sma200: smaLast(prices, 200),
    ema12: emaLast(prices, 12),
    ema26: emaLast(prices, 26),
    macd: {
      macd: macdResult.macd[macdResult.macd.length - 1] || 0,
      signal: macdResult.signal[macdResult.signal.length - 1] || 0,
      histogram: macdResult.histogram[macdResult.histogram.length - 1] || 0,
    },
    bollingerBands: lastBB,
    adx: ADX(ohlc),
    atr: atrArr[atrArr.length - 1] || 0,
    stochastic: Stochastic(ohlc),
    vwap: vwapArr[vwapArr.length - 1] || 0,
    obv: obvArr[obvArr.length - 1] || 0,
  };
}
