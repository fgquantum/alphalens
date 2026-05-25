// ============================================================
// AlphaLens v6 — Finnhub Data Wrapper
// FALLBACK data source — 60 calls/min free tier
// ============================================================

const FINNHUB = 'https://finnhub.io/api/v1';
const FKEY = process.env.FINNHUB_API_KEY || '';

async function finnhubFetch<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${FINNHUB}${endpoint}&token=${FKEY}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Finnhub ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ── Quote ───────────────────────────────────────────────────

interface FinnhubQuote {
  c: number; h: number; l: number; o: number; pc: number; t: number;
}

export async function finnhubQuote(symbol: string) {
  const q = await finnhubFetch<FinnhubQuote>(`/quote?symbol=${symbol}`);
  return {
    symbol,
    price: q.c,
    high: q.h,
    low: q.l,
    open: q.o,
    previousClose: q.pc,
    change: q.c - q.pc,
    changePct: q.pc ? ((q.c - q.pc) / q.pc) * 100 : 0,
    timestamp: q.t,
  };
}

// ── Company Profile ─────────────────────────────────────────

interface FinnhubProfile {
  name: string; ticker: string; logo: string; finnhubIndustry: string;
  marketCapitalization: number; country: string; exchange: string;
  weburl: string; ipo: string; phone: string;
}

export async function finnhubCompanyProfile(symbol: string) {
  return finnhubFetch<FinnhubProfile>(`/stock/profile2?symbol=${symbol}`);
}

// ── Analyst Recommendations ─────────────────────────────────

interface FinnhubRecommendation {
  buy: number; hold: number; sell: number;
  strongBuy: number; strongSell: number; period: string;
}

export async function finnhubRecommendations(symbol: string) {
  return finnhubFetch<FinnhubRecommendation[]>(`/stock/recommendation?symbol=${symbol}`);
}

// ── Earnings ────────────────────────────────────────────────

interface FinnhubEarning {
  actual: number; estimate: number; surprise: number;
  surprisePercent: number; period: string; symbol: string;
}

export async function finnhubEarnings(symbol: string) {
  return finnhubFetch<FinnhubEarning[]>(`/stock/earnings?symbol=${symbol}`);
}

// ── Insider Transactions ────────────────────────────────────

export async function finnhubInsiderTransactions(symbol: string) {
  const result = await finnhubFetch<{ data: Record<string, unknown>[] }>(
    `/stock/insider-transactions?symbol=${symbol}`
  );
  return result.data || [];
}

// ── Peers ───────────────────────────────────────────────────

export async function finnhubPeers(symbol: string) {
  return finnhubFetch<string[]>(`/stock/peers?symbol=${symbol}`);
}

// ── Company News ────────────────────────────────────────────

interface FinnhubNews {
  headline: string; summary: string; url: string; source: string;
  datetime: number; image: string; category: string; related: string;
}

export async function finnhubNews(symbol: string) {
  const to = new Date().toISOString().split('T')[0];
  const from = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  return finnhubFetch<FinnhubNews[]>(
    `/company-news?symbol=${symbol}&from=${from}&to=${to}`
  );
}
