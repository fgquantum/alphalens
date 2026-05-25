// ============================================================
// AlphaLens v11 — AlphaScore™ Engine
// 54 metrics, 6 dimensions, sector-relative percentile scoring
// Red flag penalty system, DCF upside premium
// ============================================================

import type { StockQuote, Financials, OHLCV, AnalystRecommendation, NewsItem, AlphaScoreResult } from '@/lib/types';
import { RSI, smaLast, MACD, ADX, scoreSentiment } from './technicals';
import { computePiotroskiFromArray } from './piotroski';
import { computeBeneishFromArray } from './beneish';

// ── Types ───────────────────────────────────────────────────

interface Weighted { s: number; w: number; }

// ── Weights (v11: out of 100) ───────────────────────────────

const WEIGHTS = { value: 25, quality: 25, growth: 20, momentum: 15, safety: 10, dividend: 5 };

// ── Utility ─────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function wAvg(items: Weighted[]): number {
  const totalW = items.reduce((sum, i) => sum + i.w, 0);
  if (totalW === 0) return 5;
  return items.reduce((sum, i) => sum + (i.s * i.w), 0) / totalW;
}

// Sector-relative percentile scoring (the heart of AlphaScore differentiation)
// val vs median: ratio * 5 gives: 5 = at median, 10 = 2× better, 0 = 2× worse
function P(val: number | null, median: number | null, dir: 'hi' | 'lo', w: number): Weighted {
  if (val == null || !isFinite(val) || !median || median === 0) return { s: 5, w };
  const ratio = dir === 'hi' ? val / median : median / val;
  return { s: clamp(ratio * 5, 0, 10), w };
}

function DCF(price: number | null, fair: number | null, w: number): Weighted {
  if (!price || !fair || price <= 0) return { s: 5, w };
  const upside = (fair - price) / price;
  return { s: clamp((upside + 0.5) * 10, 0, 10), w };
}

function ACCEL(yoy: number | null, cagr3y: number | null, w: number): Weighted {
  if (!yoy || !cagr3y) return { s: 5, w };
  const accel = yoy - cagr3y;
  return { s: clamp((accel / 10 + 0.5) * 10, 0, 10), w };
}

function EQS_bonus(eqs: number | null, w: number): Weighted {
  if (eqs == null) return { s: 5, w };
  return { s: eqs / 10, w };
}

function INSIDER_signal(net: number | null, count: number | null, w: number): Weighted {
  if (!net || !count) return { s: 5, w };
  const direction = net > 0 ? 1 : net < 0 ? -1 : 0;
  const magnitude = clamp(Math.abs(net) / 10_000_000, 0, 1);
  return { s: clamp(5 + direction * magnitude * 4, 0, 10), w };
}

function TSI_to_score(tsi: number | null, w: number): Weighted {
  return { s: tsi != null ? tsi / 10 : 5, w };
}

function MA_stack(p: number | null, s20: number | null, s50: number | null, s200: number | null, w: number): Weighted {
  if (!p || !s20 || !s50 || !s200) return { s: 5, w };
  const bull = p > s20 && s20 > s50 && s50 > s200;
  const bear = p < s20 && s20 < s50 && s50 < s200;
  return { s: bull ? 10 : bear ? 0 : 5, w };
}

function RSI_zone(rsi: number | null, w: number): Weighted {
  if (!rsi) return { s: 5, w };
  if (rsi >= 50 && rsi <= 70) return { s: 8, w };
  if (rsi > 70 && rsi <= 80) return { s: 6, w };
  if (rsi < 50 && rsi >= 40) return { s: 6, w };
  if (rsi > 80) return { s: 3, w };
  if (rsi < 30) return { s: 4, w };
  return { s: 5, w };
}

function VOL_trend(volRatio: number | null, ret1m: number | null, w: number): Weighted {
  if (!volRatio || !ret1m) return { s: 5, w };
  return { s: volRatio > 1 && ret1m > 0 ? 9 : volRatio > 1 && ret1m < 0 ? 2 : 5, w };
}

function ALTMAN_Z(z: number | null, w: number): Weighted {
  if (z == null) return { s: 5, w };
  return { s: z > 3 ? 10 : z > 1.8 ? 5 : z > 1 ? 2 : 0, w };
}

function M_SCORE_penalty(m: number | null, w: number): Weighted {
  if (m == null) return { s: 5, w };
  return { s: m > -1.78 ? 0 : m > -2.22 ? 6 : 10, w };
}

function CONSEC_div(years: number | null, w: number): Weighted {
  if (!years) return { s: 5, w };
  return { s: clamp(years / 5 * 10, 0, 10), w };
}

// ── Red Flags ───────────────────────────────────────────────

function buildRedFlags(f: Financials | null, beneishM: number | null, insiderNet: number): string[] {
  const flags: string[] = [];
  if (!f) return flags;

  if (beneishM != null && beneishM > -1.78) {
    flags.push(`Beneish M-Score ${beneishM.toFixed(2)} — manipulation risk`);
  }
  if (insiderNet < -5_000_000) {
    flags.push(`Heavy insider selling: $${Math.abs(insiderNet / 1e6).toFixed(1)}M net`);
  }
  if (f.debtToEquity > 3) {
    flags.push(`Extreme leverage: D/E ${f.debtToEquity.toFixed(1)}`);
  }
  if (f.freeCashFlow < 0 && f.netIncome > 0) {
    flags.push('Negative FCF despite positive earnings');
  }
  if (f.currentRatio < 0.8) {
    flags.push(`Liquidity risk: current ratio ${f.currentRatio.toFixed(2)}`);
  }
  return flags;
}

// ── Grade & Signal ──────────────────────────────────────────

function deriveGrade(s: number): string {
  if (s >= 90) return 'A+';
  if (s >= 80) return 'A';
  if (s >= 70) return 'B+';
  if (s >= 60) return 'B';
  if (s >= 50) return 'C+';
  if (s >= 40) return 'C';
  if (s >= 30) return 'D';
  return 'F';
}

function deriveSignal(s: number): string {
  if (s >= 85) return 'STRONG_BUY';
  if (s >= 70) return 'BUY';
  if (s >= 55) return 'WATCH';
  if (s >= 40) return 'NEUTRAL';
  if (s >= 25) return 'CAUTION';
  return 'AVOID';
}

function signalLabel(s: string): string {
  const map: Record<string, string> = {
    STRONG_BUY: 'Strong Buy', BUY: 'Buy', WATCH: 'Watch',
    NEUTRAL: 'Neutral', CAUTION: 'Caution', AVOID: 'Avoid',
  };
  return map[s] || s;
}

// ── Dimension Helpers ───────────────────────────────────────

function normalize(value: number, low: number, high: number, invert = false): number {
  if (high === low) return 50;
  const n = ((value - low) / (high - low)) * 100;
  const clamped = clamp(n, 0, 100);
  return invert ? 100 - clamped : clamped;
}

// ── VALUE (0-25) ────────────────────────────────────────────

function scoreValue(quote: StockQuote, f: Financials | null): { score: number; fairValue: number | null; factors: string[] } {
  const factors: string[] = [];
  const scores: number[] = [];

  if (quote.pe && quote.pe > 0) {
    scores.push(normalize(quote.pe, 5, 40, true));
    if (quote.pe < 15) factors.push(`Low P/E of ${quote.pe.toFixed(1)} suggests value`);
    if (quote.pe > 30) factors.push(`High P/E of ${quote.pe.toFixed(1)} — premium valuation`);
  }

  if (quote.forwardPe && quote.forwardPe > 0) {
    scores.push(normalize(quote.forwardPe, 5, 35, true));
    if (quote.pe && quote.forwardPe < quote.pe * 0.85) {
      factors.push('Forward P/E signals earnings growth expectation');
    }
  }

  if (f) {
    const pb = f.totalEquity > 0 ? quote.marketCap / f.totalEquity : 0;
    if (pb > 0) scores.push(normalize(pb, 0.5, 10, true));

    const ps = f.revenue > 0 ? quote.marketCap / f.revenue : 0;
    if (ps > 0) scores.push(normalize(ps, 0.5, 15, true));

    const ev = quote.marketCap + f.longTermDebt + f.shortTermDebt - f.cash;
    if (f.ebitda > 0) {
      const evEbitda = ev / f.ebitda;
      scores.push(normalize(evEbitda, 3, 25, true));
      if (evEbitda < 10) factors.push(`EV/EBITDA ${evEbitda.toFixed(1)}x — below average`);
    }

    if (f.revenue > 0) {
      const evRev = ev / f.revenue;
      scores.push(normalize(evRev, 0.5, 10, true));
    }

    // Earnings yield
    if (quote.pe && quote.pe > 0) {
      const earningsYield = (1 / quote.pe) * 100;
      scores.push(normalize(earningsYield, 2, 12, false));
    }
  }

  // DCF Fair Value
  let fairValue: number | null = null;
  if (f && f.freeCashFlow > 0 && f.sharesOutstanding > 0) {
    const discountRate = 0.09;
    const terminalGrowth = 0.025;
    let dynamicGrowthRate = 0.08;
    let fcf = f.freeCashFlow;
    let totalPV = 0;

    for (let i = 1; i <= 10; i++) {
      fcf *= (1 + dynamicGrowthRate);
      totalPV += fcf / Math.pow(1 + discountRate, i);
    }

    const terminalValue = (fcf * (1 + terminalGrowth)) / (discountRate - terminalGrowth);
    totalPV += terminalValue / Math.pow(1 + discountRate, 10);
    fairValue = Math.round((totalPV / f.sharesOutstanding) * 100) / 100;

    if (fairValue > 0 && quote.price > 0) {
      const diff = ((fairValue - quote.price) / quote.price) * 100;
      if (diff > 15) factors.push(`DCF implies ${diff.toFixed(0)}% upside`);
      if (diff < -15) factors.push(`Price exceeds DCF value by ${Math.abs(diff).toFixed(0)}%`);
      scores.push(normalize(diff, -40, 40, false));
    }
  }

  const raw = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50;
  return { score: clamp(Math.round(raw * 0.25), 0, 25), fairValue, factors };
}

// ── QUALITY (0-25) ──────────────────────────────────────────

function scoreQuality(f: Financials | null, financials: Financials[]): { score: number; factors: string[] } {
  const factors: string[] = [];
  const scores: number[] = [];

  if (!f) return { score: 12, factors: ['No financial data'] };

  const roe = f.roe * 100;
  scores.push(normalize(roe, 0, 30, false));
  if (roe > 20) factors.push(`Strong ROE of ${roe.toFixed(1)}%`);
  if (roe < 5) factors.push(`Weak ROE of ${roe.toFixed(1)}%`);

  const roa = f.roa * 100;
  scores.push(normalize(roa, 0, 15, false));

  const gm = f.grossMargin * 100;
  scores.push(normalize(gm, 10, 70, false));
  if (gm > 50) factors.push(`High gross margin ${gm.toFixed(1)}%`);

  const om = f.operatingMargin * 100;
  scores.push(normalize(om, -5, 30, false));

  const nm = f.netMargin * 100;
  scores.push(normalize(nm, -10, 25, false));

  // FCF margin
  if (f.revenue > 0) {
    const fcfMargin = (f.freeCashFlow / f.revenue) * 100;
    scores.push(normalize(fcfMargin, -5, 20, false));
    if (fcfMargin > 15) factors.push(`Strong FCF margin ${fcfMargin.toFixed(1)}%`);
    if (f.freeCashFlow < 0) factors.push('Negative free cash flow');
  }

  // Debt efficiency
  scores.push(normalize(f.debtToEquity, 0, 3, true));
  if (f.debtToEquity < 0.5) factors.push(`Conservative leverage D/E ${f.debtToEquity.toFixed(2)}`);
  if (f.debtToEquity > 2) factors.push(`High leverage D/E ${f.debtToEquity.toFixed(2)}`);

  // Asset turnover
  scores.push(normalize(f.assetTurnover, 0.1, 1.5, false));

  // Piotroski
  const piotroski = computePiotroskiFromArray(financials);
  scores.push(normalize(piotroski.score, 0, 9, false));
  if (piotroski.score >= 7) factors.push(`Piotroski F-Score ${piotroski.score}/9 — strong`);
  if (piotroski.score <= 2) factors.push(`Piotroski F-Score ${piotroski.score}/9 — weak`);

  // Beneish
  const beneish = computeBeneishFromArray(financials);
  if (beneish.isLikelyManipulator) {
    scores.push(15);
    factors.push('Beneish M-Score flags manipulation risk');
  } else {
    scores.push(75);
  }

  const raw = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50;
  return { score: clamp(Math.round(raw * 0.25), 0, 25), factors };
}

// ── GROWTH (0-20) ───────────────────────────────────────────

function scoreGrowth(financials: Financials[], quote: StockQuote): { score: number; factors: string[] } {
  const factors: string[] = [];
  const scores: number[] = [];

  if (financials.length >= 2) {
    const curr = financials[0];
    const prev = financials[1];

    if (prev.revenue > 0) {
      const revGrowth = ((curr.revenue - prev.revenue) / prev.revenue) * 100;
      scores.push(normalize(revGrowth, -5, 25, false));
      if (revGrowth > 15) factors.push(`Revenue growth ${revGrowth.toFixed(1)}% YoY`);
    }

    if (financials.length >= 3) {
      const revs = financials.slice(0, 3).map(f => f.revenue);
      if (revs[0] > revs[1] && revs[1] > revs[2]) {
        scores.push(90);
        factors.push('3-year consistent revenue expansion');
      }
    }

    if (prev.eps > 0) {
      const epsGrowth = ((curr.eps - prev.eps) / prev.eps) * 100;
      scores.push(normalize(epsGrowth, -10, 30, false));
      if (epsGrowth > 20) factors.push(`EPS growth ${epsGrowth.toFixed(1)}%`);
    }

    const marginDelta = (curr.netMargin - prev.netMargin) * 100;
    scores.push(normalize(marginDelta, -3, 3, false));
    if (marginDelta > 1) factors.push('Margins expanding');

    // FCF growth
    if (prev.freeCashFlow > 0) {
      const fcfGrowth = ((curr.freeCashFlow - prev.freeCashFlow) / prev.freeCashFlow) * 100;
      scores.push(normalize(fcfGrowth, -20, 40, false));
    }
  }

  // PEG
  if (quote.pe && quote.pe > 0 && financials.length >= 2) {
    const prev = financials[1];
    const curr = financials[0];
    if (prev.eps > 0) {
      const epsGrowth = ((curr.eps - prev.eps) / prev.eps) * 100;
      if (epsGrowth > 0) {
        const peg = quote.pe / epsGrowth;
        scores.push(normalize(peg, 0.5, 3, true));
        if (peg < 1) factors.push(`PEG ${peg.toFixed(2)} — growth undervalued`);
      }
    }
  }

  const raw = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50;
  return { score: clamp(Math.round(raw * 0.20), 0, 20), factors };
}

// ── MOMENTUM (0-15) ─────────────────────────────────────────

function scoreMomentum(quote: StockQuote, history: OHLCV[]): { score: number; factors: string[] } {
  const factors: string[] = [];
  const scores: number[] = [];
  const prices = history.map(h => h.close);

  if (prices.length < 20) return { score: 7, factors: ['Insufficient price history'] };

  const rsi = RSI(prices);
  if (rsi >= 50 && rsi <= 70) scores.push(75);
  else if (rsi > 70 && rsi <= 80) scores.push(60);
  else if (rsi > 80) { scores.push(30); factors.push(`RSI ${rsi.toFixed(0)} — overbought`); }
  else if (rsi < 30) { scores.push(35); factors.push(`RSI ${rsi.toFixed(0)} — oversold`); }
  else if (rsi >= 40) scores.push(60);
  else scores.push(40);

  const macdResult = MACD(prices);
  const lastHist = macdResult.histogram[macdResult.histogram.length - 1] || 0;
  if (lastHist > 0) { scores.push(70); factors.push('MACD bullish'); }
  else scores.push(30);

  const sma50 = quote.sma50 || smaLast(prices, 50);
  if (sma50 > 0 && quote.price > 0) {
    const vs50 = ((quote.price - sma50) / sma50) * 100;
    scores.push(normalize(vs50, -15, 15, false));
    if (vs50 > 5) factors.push(`${vs50.toFixed(1)}% above SMA50`);
    if (vs50 < -5) factors.push(`${Math.abs(vs50).toFixed(1)}% below SMA50`);
  }

  const sma200 = quote.sma200 || smaLast(prices, Math.min(200, prices.length));
  if (sma200 > 0 && quote.price > 0) {
    const vs200 = ((quote.price - sma200) / sma200) * 100;
    scores.push(normalize(vs200, -20, 20, false));
  }

  // MA stack alignment
  const sma20 = smaLast(prices, 20);
  if (quote.price > sma20 && sma20 > sma50 && sma50 > sma200) {
    scores.push(90);
    factors.push('Bullish MA alignment');
  } else if (quote.price < sma20 && sma20 < sma50 && sma50 < sma200) {
    scores.push(10);
    factors.push('Bearish MA alignment');
  } else {
    scores.push(50);
  }

  // 52-week range position
  if (quote.high52w > quote.low52w) {
    const rangePos = ((quote.price - quote.low52w) / (quote.high52w - quote.low52w)) * 100;
    scores.push(normalize(rangePos, 10, 90, false));
  }

  // Volume confirmation
  if (quote.volume > 0 && quote.avgVolume > 0) {
    const volRatio = quote.volume / quote.avgVolume;
    if (volRatio > 1.5 && quote.change > 0) { scores.push(80); factors.push('Volume surge on upward move'); }
    else if (volRatio > 1.5 && quote.change < 0) { scores.push(20); factors.push('Volume surge on downward move'); }
    else scores.push(50);
  }

  const raw = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50;
  return { score: clamp(Math.round(raw * 0.15), 0, 15), factors };
}

// ── SAFETY (0-10) ───────────────────────────────────────────

function scoreSafety(quote: StockQuote, f: Financials | null): { score: number; factors: string[] } {
  const factors: string[] = [];
  const scores: number[] = [];

  if (quote.beta !== null) {
    scores.push(normalize(quote.beta, 0.5, 2.0, true));
    if (quote.beta < 0.8) factors.push(`Low beta ${quote.beta.toFixed(2)}`);
    if (quote.beta > 1.5) factors.push(`High beta ${quote.beta.toFixed(2)}`);
  }

  if (f) {
    scores.push(normalize(f.debtToEquity, 0, 3, true));
    scores.push(normalize(f.currentRatio, 0.5, 3, false));
    if (f.currentRatio > 2) factors.push('Strong liquidity');
    if (f.currentRatio < 1) factors.push('Liquidity risk');

    if (f.longTermDebt > 0 && f.operatingIncome > 0) {
      const interestCoverage = f.operatingIncome / (f.longTermDebt * 0.04);
      scores.push(normalize(interestCoverage, 1, 10, false));
    } else if (f.longTermDebt === 0) {
      scores.push(85);
    }

    // Altman Z-Score approximation
    if (f.totalAssets > 0) {
      const wcTA = (f.currentAssets - f.currentLiabilities) / f.totalAssets;
      const reTA = (f.totalEquity * 0.5) / f.totalAssets;
      const ebitTA = (f.ebitda || f.operatingIncome) / f.totalAssets;
      const mvBV = quote.marketCap / Math.max(f.totalLiabilities, 1);
      const sTA = f.revenue / f.totalAssets;
      const altmanZ = 1.2 * wcTA + 1.4 * reTA + 3.3 * ebitTA + 0.6 * mvBV + sTA;
      scores.push(altmanZ > 3 ? 90 : altmanZ > 1.8 ? 50 : 15);
    }
  }

  // Market cap safety tier
  if (quote.marketCap > 200e9) scores.push(85);
  else if (quote.marketCap > 10e9) scores.push(70);
  else if (quote.marketCap > 2e9) scores.push(55);
  else scores.push(35);

  const raw = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50;
  return { score: clamp(Math.round(raw * 0.10), 0, 10), factors };
}

// ── DIVIDEND (0-5) ──────────────────────────────────────────

function scoreDividend(quote: StockQuote): { score: number; factors: string[] } {
  const factors: string[] = [];
  if (!quote.dividendYield || quote.dividendYield <= 0) return { score: 0, factors: [] };

  const scores: number[] = [];
  scores.push(normalize(quote.dividendYield, 0, 6, false));
  if (quote.dividendYield > 3) factors.push(`Dividend yield ${quote.dividendYield.toFixed(2)}%`);

  const raw = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50;
  return { score: clamp(Math.round(raw * 0.05), 0, 5), factors };
}

// ── Max Dimension ───────────────────────────────────────────

function maxDimension(dims: Record<string, number>): string {
  let max = -1;
  let name = 'value';
  for (const [k, v] of Object.entries(dims)) {
    if (v > max) { max = v; name = k; }
  }
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// ── MAIN: Compute AlphaScore v11 ────────────────────────────

export function computeAlphaScore(
  quote: StockQuote,
  financials: Financials[],
  history: OHLCV[],
  recommendations: AnalystRecommendation[],
  news: NewsItem[]
): AlphaScoreResult {
  const f = financials.length > 0 ? financials[0] : null;

  const value    = scoreValue(quote, f);
  const quality  = scoreQuality(f, financials);
  const growth   = scoreGrowth(financials, quote);
  const momentum = scoreMomentum(quote, history);
  const safety   = scoreSafety(quote, f);
  const dividend = scoreDividend(quote);

  // Raw composite (sum of dimension scores already capped)
  let total = value.score + quality.score + growth.score + momentum.score + safety.score + dividend.score;

  // Red flag penalties
  const beneish = computeBeneishFromArray(financials);
  const insiderNet = 0; // Would come from insider data
  const activeFlags = buildRedFlags(f, beneish.mScore, insiderNet);
  const flagPenalty = activeFlags.length * 3;
  total = clamp(total - Math.min(flagPenalty, 15), 0, 100);

  // Collect all factors
  const allFactors = [
    ...value.factors, ...quality.factors, ...growth.factors,
    ...momentum.factors, ...safety.factors, ...dividend.factors,
  ];

  const bullFactors = allFactors.filter(f =>
    f.toLowerCase().includes('strong') || f.toLowerCase().includes('growth') ||
    f.toLowerCase().includes('upside') || f.toLowerCase().includes('low p/e') ||
    f.toLowerCase().includes('positive') || f.toLowerCase().includes('bullish') ||
    f.toLowerCase().includes('above') || f.toLowerCase().includes('conservative') ||
    f.toLowerCase().includes('undervalued') || f.toLowerCase().includes('low beta') ||
    f.toLowerCase().includes('expansion') || f.toLowerCase().includes('high gross') ||
    f.toLowerCase().includes('dividend')
  ).slice(0, 3);

  const bearFactors = allFactors.filter(f =>
    f.toLowerCase().includes('weak') || f.toLowerCase().includes('risk') ||
    f.toLowerCase().includes('decline') || f.toLowerCase().includes('negative') ||
    f.toLowerCase().includes('overvaluation') || f.toLowerCase().includes('bearish') ||
    f.toLowerCase().includes('below') || f.toLowerCase().includes('high beta') ||
    f.toLowerCase().includes('manipulation') || f.toLowerCase().includes('overbought') ||
    f.toLowerCase().includes('premium') || f.toLowerCase().includes('exceeds') ||
    f.toLowerCase().includes('high leverage') || f.toLowerCase().includes('liquidity risk')
  ).slice(0, 3);

  const signal = deriveSignal(total);

  return {
    overall: clamp(total, 0, 100),
    grade: deriveGrade(total),
    signal: signalLabel(signal),
    fairValue: value.fairValue,
    fairValueDiff: value.fairValue && quote.price > 0
      ? Math.round(((value.fairValue - quote.price) / quote.price) * 10000) / 100
      : null,
    subScores: {
      value: value.score,
      quality: quality.score,
      growth: growth.score,
      momentum: momentum.score,
      safety: safety.score,
      dividend: dividend.score,
    },
    activeFlags,
    topDimension: maxDimension({
      value: value.score, quality: quality.score,
      growth: growth.score, momentum: momentum.score,
      safety: safety.score,
    }),
    keyFactors: {
      bull: bullFactors.length > 0 ? bullFactors : ['Metrics are generally average'],
      bear: [
        ...bearFactors,
        ...(financials.length === 0 ? ['Limited financial data — results based on market data'] : [])
      ].slice(0, 3)
    },
    computedAt: new Date().toISOString(),
  };
}
