// ============================================================
// AlphaLens v11 — Core TypeScript Interfaces
// ============================================================

// ── Stock Data ──────────────────────────────────────────────

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  pe: number | null;
  forwardPe: number | null;
  eps: number | null;
  dividendYield: number | null;
  beta: number | null;
  high52w: number;
  low52w: number;
  sma50: number;
  sma200: number;
  sector: string | null;
  industry: string | null;
  exchange: string | null;
  currency: string;
}

export interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Financials {
  // Income Statement
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  grossMargin: number;
  operatingIncome: number;
  operatingMargin: number;
  netIncome: number;
  netMargin: number;
  eps: number;
  ebitda: number;
  sgaExpense: number;

  // Balance Sheet
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  currentAssets: number;
  currentLiabilities: number;
  cash: number;
  longTermDebt: number;
  shortTermDebt: number;
  sharesOutstanding: number;
  ppe: number;
  receivables: number;
  depreciation: number;

  // Cash Flow
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;

  // Ratios
  roa: number;
  roe: number;
  currentRatio: number;
  debtToEquity: number;
  assetTurnover: number;

  // Period
  period: string;
  year: number;
}

export interface CompanyProfile {
  symbol: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  country: string;
  employees: number | null;
  website: string;
  ceo: string;
  exchange: string;
  logo: string | null;
}

export interface NewsItem {
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  tickers: string[];
  image: string | null;
}

export interface AnalystRecommendation {
  buy: number;
  hold: number;
  sell: number;
  strongBuy: number;
  strongSell: number;
  period: string;
}

export interface EarningsResult {
  actual: number | null;
  estimate: number | null;
  surprise: number | null;
  surprisePercent: number | null;
  period: string;
}

export interface InsiderTransaction {
  name: string;
  title: string;
  date: string;
  transactionType: string;
  shares: number;
  value: number;
}

// ── v11 Algorithm Results ───────────────────────────────────

export interface AlphaScoreResult {
  overall: number;         // 0-100
  grade: string;           // A+ through F
  signal: string;          // STRONG_BUY → AVOID
  fairValue: number | null;
  fairValueDiff: number | null; // % difference from current price
  subScores: {
    value: number;         // 0-25
    quality: number;       // 0-25
    growth: number;        // 0-20
    momentum: number;      // 0-15
    safety: number;        // 0-10
    dividend: number;      // 0-5
  };
  activeFlags: string[];   // v11: red flag list
  topDimension: string;    // which dimension scores highest
  keyFactors: {
    bull: string[];        // top 3 bullish factors
    bear: string[];        // top 3 bearish factors
  };
  computedAt: string;
}

export interface TSIResult {
  tsi: number;             // 0-100
  label: string;
  components: {
    adx: number;
    bb: number;
    volume: number;
    maStack: number;
    di: number;
    r2: number;
  };
}

export interface EQSResult {
  eqs: number;             // 0-100
  mScore: number;
  flags: {
    beneish: boolean;
    accrual: boolean;
    stuffing: boolean;
    marginErode: boolean;
    fcfGap: boolean;
    dsoSpike: boolean;
  };
  activeFlags: string[];
}

export interface AlphaMomentumResult {
  rank: number;            // 0-100 (percentile)
  sectorRank: number;
  ret12m1m: number | null;
  ret6m1m: number | null;
  ret3m1m: number | null;
}

export interface SMIResult {
  smi: number;             // 0-100
  label: string;
  trend: 'rising' | 'falling' | 'flat';
}

export interface CERResult {
  cer: number;             // 0-100
  label: string;
}

export interface VolRegimeResult {
  volRegime: 'COMPRESSION' | 'EXPANSION' | 'ELEVATED' | 'NORMAL' | 'CRISIS';
  volRegimeLabel: string;
  vol5d: number;
  vol21d: number;
  vol252d: number;
  volPercentile: number;
}

export interface EarningsMomentumResult {
  earnMomentum: number;    // 0-100
  earnMomentumLabel: string;
  components: {
    revisionScore: number;
    beatScore: number;
    revSurprise: number;
    accelScore: number;
  };
}

export interface MacroRegime {
  regime: 'GOLDILOCKS' | 'OVERHEATING' | 'STAGFLATION' | 'RECESSION' | 'RECOVERY' | 'UNCERTAINTY';
  label: string;
  description: string;
  sectorPlaybook: Record<string, string>;
  indicators: {
    cpi: number | null;
    gdp: number | null;
    fedRate: number | null;
    yieldSpread: number | null;
    unemployment: number | null;
  };
}

export interface PiotroskiResult {
  score: number;           // 0-9
  grade: string;
  breakdown: {
    positiveNetIncome: boolean;
    positiveCashFlow: boolean;
    roaIncreasing: boolean;
    cashFlowGtIncome: boolean;
    decreasingLeverage: boolean;
    improvingLiquidity: boolean;
    noDilution: boolean;
    improvingMargins: boolean;
    improvingEfficiency: boolean;
  };
}

export interface BeneishResult {
  mScore: number;
  isLikelyManipulator: boolean;
  variables: {
    DSRI: number;
    GMI: number;
    AQI: number;
    SGI: number;
    DEPI: number;
    SGAI: number;
    LVGI: number;
    TATA: number;
  };
  flags: string[];
}

export interface TechnicalIndicators {
  rsi: number;
  sma20: number;
  sma50: number;
  sma200: number;
  ema12: number;
  ema26: number;
  macd: { macd: number; signal: number; histogram: number };
  bollingerBands: { upper: number; middle: number; lower: number };
  adx: number;
  atr: number;
  stochastic: { k: number; d: number };
  vwap: number;
  obv: number;
}

export interface PivotLevels {
  pp: number;
  r1: number; r2: number; r3: number;
  s1: number; s2: number; s3: number;
}

export interface FibonacciLevels {
  high: number;
  low: number;
  level236: number;
  level382: number;
  level500: number;
  level618: number;
  level786: number;
}

// ── Macro ───────────────────────────────────────────────────

export interface MacroIndicator {
  key: string;
  name: string;
  current: number | null;
  previous: number | null;
  trend: { date: string; value: number }[];
  unit: string;
}

// ── Portfolio ───────────────────────────────────────────────

export interface PortfolioPosition {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  gain: number;
  gainPct: number;
  weight: number;
  dayChange: number;
  dayChangePct: number;
}

// ── Plan Gating ─────────────────────────────────────────────

export type PlanTier = 'free' | 'pro' | 'elite';

export const PLAN_LIMITS: Record<PlanTier, Record<string, number>> = {
  free:  { watchlist: 30, screens: 5, alerts: 3, exports: 0 },
  pro:   { watchlist: 500, screens: 50, alerts: -1, exports: -1 },
  elite: { watchlist: -1, screens: -1, alerts: -1, exports: -1 },
};

// ── API Responses ───────────────────────────────────────────

export interface StockPageData {
  quote: StockQuote;
  history: OHLCV[];
  alphaScore: AlphaScoreResult;
  trendStrength: TSIResult;
  technicals: TechnicalIndicators;
  news: NewsItem[];
  recommendations: AnalystRecommendation[];
  earnings: EarningsResult[];
  profile: CompanyProfile | null;
  peers: string[];
  insiders: InsiderTransaction[];
  financials: Financials[];
  // v11 new algorithm results
  eqs: EQSResult | null;
  alphaMomentum: AlphaMomentumResult;
  smi: SMIResult;
  cer: CERResult;
  volRegime: VolRegimeResult;
  earningsMomentum: EarningsMomentumResult;
  piotroski: PiotroskiResult;
}

export interface ScreenerFilters {
  sector?: string;
  minMarketCap?: number;
  maxMarketCap?: number;
  minPe?: number;
  maxPe?: number;
  minAlphaScore?: number;
  maxAlphaScore?: number;
  minDividendYield?: number;
  maxDividendYield?: number;
  minBeta?: number;
  maxBeta?: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange?: string;
}
