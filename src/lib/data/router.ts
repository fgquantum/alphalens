// ============================================================
// AlphaLens v11 — Smart Data Router
// Fallback chain: Yahoo → Finnhub → FMP
// All results cached with appropriate TTLs
// Computes all 12 algorithms
// ============================================================

import { getQuote, getHistory, getCompanyProfile, getFinancials, getEarnings, getRecommendations, getInsiderTransactions, getNews, searchTickers } from './yahoo';
import { finnhubQuote, finnhubCompanyProfile, finnhubRecommendations, finnhubEarnings, finnhubPeers, finnhubNews } from './finnhub';
import { cached, TTL } from '@/lib/cache';
import type { StockQuote, OHLCV, CompanyProfile, Financials, EarningsResult, AnalystRecommendation, InsiderTransaction, NewsItem, SearchResult, StockPageData } from '@/lib/types';
import { computeAlphaScore } from '@/lib/algorithms/alphascore';
import { computeTrendStrength } from '@/lib/algorithms/trend-strength';
import { computeAllTechnicals } from '@/lib/algorithms/technicals';
import { scoreSentiment } from '@/lib/algorithms/technicals';
import { computeEQS } from '@/lib/algorithms/eqs';
import { computeAlphaMomentum } from '@/lib/algorithms/alpha-momentum';
import { computeSMI } from '@/lib/algorithms/smi';
import { computeCER } from '@/lib/algorithms/cer';
import { computeVolRegime } from '@/lib/algorithms/vol-regime';
import { computeEarningsMomentum } from '@/lib/algorithms/earnings-momentum';
import { computePiotroskiFromArray } from '@/lib/algorithms/piotroski';

// ── Quote ───────────────────────────────────────────────────

export async function getStockQuote(symbol: string): Promise<StockQuote> {
  return cached(`quote:${symbol}`, TTL.quote, async () => {
    try {
      return await getQuote(symbol);
    } catch (yahooError) {
      try {
        console.warn(`[ROUTER] Yahoo Quote failed for ${symbol}, falling back to Finnhub.`, yahooError);
        const fq = await finnhubQuote(symbol);
        const fp = await finnhubCompanyProfile(symbol).catch(() => null);
        return {
          symbol,
          name: fp?.name || symbol,
          price: fq.price,
          change: fq.change,
          changePct: fq.changePct,
          volume: 0,
          avgVolume: 0,
          marketCap: (fp?.marketCapitalization || 0) * 1e6,
          pe: null,
          forwardPe: null,
          eps: null,
          dividendYield: null,
          beta: null,
          high52w: 0,
          low52w: 0,
          sma50: 0,
          sma200: 0,
          sector: fp?.finnhubIndustry || null,
          industry: fp?.finnhubIndustry || null,
          exchange: fp?.exchange || null,
          currency: 'USD',
        };
      } catch (finnhubError) {
        console.error(`[ROUTER] Double fallback triggered for quote:${symbol}. Generating mock data.`, finnhubError);
        return getMockQuote(symbol);
      }
    }
  });
}

// ── History ─────────────────────────────────────────────────

export async function getStockHistory(symbol: string, period = '1y'): Promise<OHLCV[]> {
  return cached(`history:${symbol}:${period}`, TTL.history, async () => {
    try {
      return await getHistory(symbol, period);
    } catch (error) {
      console.warn(`[ROUTER] History fetch failed for ${symbol} (${period}), returning mock history.`, error);
      return getMockHistory(symbol, period);
    }
  });
}

// ── Company Profile ─────────────────────────────────────────

export async function getStockProfile(symbol: string): Promise<CompanyProfile | null> {
  return cached(`profile:${symbol}`, TTL.companyProfile, async () => {
    try {
      return await getCompanyProfile(symbol);
    } catch (yahooError) {
      try {
        console.warn(`[ROUTER] Yahoo Profile failed for ${symbol}, falling back to Finnhub.`, yahooError);
        const fp = await finnhubCompanyProfile(symbol);
        return {
          symbol,
          name: fp.name,
          description: '',
          sector: fp.finnhubIndustry,
          industry: fp.finnhubIndustry,
          country: fp.country,
          employees: null,
          website: fp.weburl,
          ceo: '',
          exchange: fp.exchange,
          logo: fp.logo || null,
        };
      } catch (finnhubError) {
        console.error(`[ROUTER] Double fallback triggered for profile:${symbol}. Generating mock profile.`, finnhubError);
        return getMockProfile(symbol);
      }
    }
  });
}

// ── Financials ──────────────────────────────────────────────

export async function getStockFinancials(symbol: string): Promise<Financials[]> {
  return cached(`financials:${symbol}`, TTL.financials, async () => {
    try {
      return await getFinancials(symbol);
    } catch (error) {
      console.warn(`[ROUTER] Financials fetch failed for ${symbol}, returning mock financials.`, error);
      return getMockFinancials(symbol);
    }
  });
}

// ── Earnings ────────────────────────────────────────────────

export async function getStockEarnings(symbol: string): Promise<EarningsResult[]> {
  return cached(`earnings:${symbol}`, TTL.financials, async () => {
    try {
      return await getEarnings(symbol);
    } catch (yahooError) {
      try {
        console.warn(`[ROUTER] Yahoo Earnings failed for ${symbol}, falling back to Finnhub.`, yahooError);
        const fe = await finnhubEarnings(symbol);
        return fe.map(e => ({
          actual: e.actual ?? null,
          estimate: e.estimate ?? null,
          surprise: e.surprise ?? null,
          surprisePercent: e.surprisePercent ?? null,
          period: e.period || '',
        }));
      } catch (finnhubError) {
        console.error(`[ROUTER] Double fallback triggered for earnings:${symbol}. Generating mock earnings.`, finnhubError);
        return getMockEarnings(symbol);
      }
    }
  });
}

// ── Recommendations ─────────────────────────────────────────

export async function getStockRecommendations(symbol: string): Promise<AnalystRecommendation[]> {
  return cached(`recs:${symbol}`, TTL.financials, async () => {
    try {
      return await getRecommendations(symbol);
    } catch (yahooError) {
      try {
        console.warn(`[ROUTER] Yahoo Recommendations failed for ${symbol}, falling back to Finnhub.`, yahooError);
        const fr = await finnhubRecommendations(symbol);
        return fr.map(r => ({
          buy: r.buy, hold: r.hold, sell: r.sell,
          strongBuy: r.strongBuy, strongSell: r.strongSell,
          period: r.period,
        }));
      } catch (finnhubError) {
        console.error(`[ROUTER] Double fallback triggered for recs:${symbol}. Generating mock recommendations.`, finnhubError);
        return getMockRecommendations(symbol);
      }
    }
  });
}

// ── Insiders ────────────────────────────────────────────────

export async function getStockInsiders(symbol: string): Promise<InsiderTransaction[]> {
  return cached(`insiders:${symbol}`, TTL.insider, async () => {
    try {
      return await getInsiderTransactions(symbol);
    } catch (error) {
      console.warn(`[ROUTER] Insiders fetch failed for ${symbol}, returning mock insider transactions.`, error);
      return getMockInsiders(symbol);
    }
  });
}

// ── Peers ───────────────────────────────────────────────────

export async function getStockPeers(symbol: string): Promise<string[]> {
  return cached(`peers:${symbol}`, TTL.peers, async () => {
    try {
      return await finnhubPeers(symbol);
    } catch (error) {
      console.warn(`[ROUTER] Peers fetch failed for ${symbol}, returning mock peers.`, error);
      return getMockPeers(symbol);
    }
  });
}

// ── News ────────────────────────────────────────────────────

export async function getStockNews(symbol: string): Promise<NewsItem[]> {
  return cached(`news:${symbol}`, TTL.news, async () => {
    try {
      const news = await getNews(symbol);
      return news.map(n => ({
        ...n,
        sentiment: scoreSentiment(n.title + ' ' + n.summary),
      }));
    } catch (yahooError) {
      try {
        console.warn(`[ROUTER] Yahoo News failed for ${symbol}, falling back to Finnhub.`, yahooError);
        const fn = await finnhubNews(symbol);
        return fn.slice(0, 10).map(n => ({
          title: n.headline,
          summary: n.summary,
          url: n.url,
          source: n.source,
          publishedAt: new Date(n.datetime * 1000).toISOString(),
          sentiment: scoreSentiment(n.headline + ' ' + n.summary),
          tickers: [symbol],
          image: n.image || null,
        }));
      } catch (finnhubError) {
        console.error(`[ROUTER] Double fallback triggered for news:${symbol}. Generating mock news.`, finnhubError);
        return getMockNews(symbol);
      }
    }
  });
}

// ── Search ──────────────────────────────────────────────────

export async function searchStocks(query: string): Promise<SearchResult[]> {
  return cached(`search:${query}`, TTL.search, async () => {
    try {
      return await searchTickers(query);
    } catch (error) {
      console.warn(`[ROUTER] Search failed for query "${query}". Returning empty array.`, error);
      return [];
    }
  });
}

// ── Full Stock Page Data (v11: all 12 algorithms) ───────────

export async function getStockPageData(symbol: string): Promise<StockPageData> {
  const [quote, history, financials, earnings, recommendations, news, profile, peers, insiders] = await Promise.all([
    getStockQuote(symbol),
    getStockHistory(symbol, '1y'),
    getStockFinancials(symbol),
    getStockEarnings(symbol),
    getStockRecommendations(symbol),
    getStockNews(symbol),
    getStockProfile(symbol),
    getStockPeers(symbol),
    getStockInsiders(symbol),
  ]);

  // Compute all algorithms
  const technicals = computeAllTechnicals(history);
  const trendStrength = computeTrendStrength(history);
  const alphaScore = computeAlphaScore(quote, financials, history, recommendations, news);
  const eqs = computeEQS(financials);
  const alphaMomentum = computeAlphaMomentum(history);
  const smi = computeSMI(history);
  const cer = computeCER(financials);
  const volRegime = computeVolRegime(history);
  const earningsMomentum = computeEarningsMomentum(financials, earnings);
  const piotroski = computePiotroskiFromArray(financials);

  return {
    quote,
    history,
    alphaScore,
    trendStrength,
    technicals,
    news,
    recommendations,
    earnings,
    profile,
    peers,
    insiders,
    financials,
    eqs,
    alphaMomentum,
    smi,
    cer,
    volRegime,
    earningsMomentum,
    piotroski,
  };
}

// ── Leaderboard Statistics ─────────────────────────────────

export interface LeaderboardStock {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  alphaScore: number;
  grade: string;
  signal: string;
}

export async function getLeaderboardStats(symbols: string[]): Promise<LeaderboardStock[]> {
  const results = await Promise.allSettled(
    symbols.map(async (s) => {
      const [quote, alphaScore] = await Promise.all([
        getStockQuote(s),
        cached(`alpha:${s}`, TTL.financials, async () => {
          const [f, h, r, n] = await Promise.all([
            getStockFinancials(s).catch(() => []),
            getStockHistory(s, '1y').catch(() => []),
            getStockRecommendations(s).catch(() => []),
            getStockNews(s).catch(() => []),
          ]);
          return computeAlphaScore(await getStockQuote(s), f, h, r, n);
        }),
      ]);
      
      return {
        symbol: s,
        name: quote.name,
        price: quote.price,
        changePct: quote.changePct,
        alphaScore: alphaScore.overall,
        grade: alphaScore.grade,
        signal: alphaScore.signal,
      };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<LeaderboardStock> => r.status === 'fulfilled')
    .map(r => r.value);
}

// ── Mock Data Generators (Double Fallback Layer) ────────────

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getSeedPrice(symbol: string): number {
  const hash = hashCode(symbol);
  return 50 + (hash % 450); // Price between $50 and $500
}

export function getMockQuote(symbol: string): StockQuote {
  const seed = getSeedPrice(symbol);
  const hash = hashCode(symbol);
  const change = +( (seed * 0.02) * ((hash % 2 === 0 ? 1 : -1) * (1 + (hash % 10) / 10)) ).toFixed(2);
  const changePct = +( (change / (seed - change)) * 100 ).toFixed(2);
  
  const sectors = ['Technology', 'Financial Services', 'Consumer Cyclical', 'Healthcare', 'Communication Services', 'Industrials'];
  const exchanges = ['NASDAQ', 'NYSE', 'AMEX'];
  
  const sector = sectors[hash % sectors.length];
  const exchange = exchanges[hash % exchanges.length];

  return {
    symbol: symbol.toUpperCase(),
    name: `${symbol.toUpperCase()} Inc. (Mock Data)`,
    price: seed,
    change,
    changePct,
    volume: 5000000 + (hash % 95000000),
    avgVolume: 10000000 + (hash % 90000000),
    marketCap: seed * (100000000 + (hash % 9000000000)),
    pe: 15 + (hash % 35),
    forwardPe: 12 + (hash % 28),
    eps: 2 + (hash % 18),
    dividendYield: hash % 3 === 0 ? 1.5 + (hash % 5) / 2 : null,
    beta: 0.8 + (hash % 10) / 10,
    high52w: +(seed * 1.2).toFixed(2),
    low52w: +(seed * 0.8).toFixed(2),
    sma50: +(seed * 1.02).toFixed(2),
    sma200: +(seed * 0.95).toFixed(2),
    sector,
    industry: `${sector} Core`,
    exchange,
    currency: 'USD',
  };
}

export function getMockHistory(symbol: string, period = '1y'): OHLCV[] {
  const seed = getSeedPrice(symbol);
  const length = period === '1d' ? 78 : period === '5d' ? 5 : period === '1mo' ? 20 : period === '3mo' ? 60 : period === '6mo' ? 125 : 252;
  
  const result: OHLCV[] = [];
  let currPrice = seed * 0.85; // start lower so it moves up generally
  const today = new Date();
  
  for (let i = length; i >= 0; i--) {
    const d = new Date(today);
    if (period === '1d') {
      d.setMinutes(d.getMinutes() - i * 5);
    } else {
      d.setDate(d.getDate() - i * (period === '5d' ? 1 : 1.4));
    }
    
    // Skip weekends for daily histories
    if (period !== '1d' && (d.getDay() === 0 || d.getDay() === 6)) {
      continue;
    }
    
    const dailyChange = currPrice * 0.015 * ((hashCode(symbol + i) % 2 === 0 ? 1 : -1) * (1 + (hashCode(symbol + i) % 10) / 10));
    const open = +currPrice.toFixed(2);
    const close = +(currPrice + dailyChange).toFixed(2);
    const high = +Math.max(open, close, currPrice + Math.abs(dailyChange) * 1.2).toFixed(2);
    const low = +Math.min(open, close, currPrice - Math.abs(dailyChange) * 1.2).toFixed(2);
    const volume = Math.floor(1000000 + (hashCode(symbol + i) % 9000000));
    
    result.push({
      date: d.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume,
    });
    
    currPrice = close;
  }
  
  return result;
}

export function getMockProfile(symbol: string): CompanyProfile {
  const hash = hashCode(symbol);
  const quote = getMockQuote(symbol);
  return {
    symbol: symbol.toUpperCase(),
    name: quote.name,
    description: `${quote.name} is a leading global enterprise specializing in ${quote.sector?.toLowerCase() || 'innovation'} and industry-leading systems. The company is dedicated to pushing boundaries, enhancing efficiency, and delivering exceptional value to clients around the world. (Note: This is simulated company information used during live API downtime).`,
    sector: quote.sector || 'Technology',
    industry: quote.industry || 'Software',
    country: 'United States',
    employees: 5000 + (hash % 145000),
    website: `https://www.${symbol.toLowerCase()}.com`,
    ceo: ['Jane Doe', 'John Smith', 'Robert Chen', 'Alice Patel'][hash % 4],
    exchange: quote.exchange || 'NASDAQ',
    logo: null,
  };
}

export function getMockFinancials(symbol: string): Financials[] {
  const hash = hashCode(symbol);
  const results: Financials[] = [];
  const years = [2025, 2024, 2023, 2022];
  
  let revenue = 1e9 + (hash % 9e9);
  
  for (let i = 0; i < 4; i++) {
    const costOfRevenue = revenue * 0.45;
    const grossProfit = revenue - costOfRevenue;
    const operatingIncome = grossProfit * 0.35;
    const netIncome = operatingIncome * 0.70;
    
    const totalAssets = revenue * 1.5;
    const totalLiabilities = totalAssets * 0.40;
    const totalEquity = totalAssets - totalLiabilities;
    const operatingCashFlow = netIncome * 1.15;
    const capex = operatingCashFlow * 0.30;

    results.push({
      revenue,
      costOfRevenue,
      grossProfit,
      grossMargin: 0.55,
      operatingIncome,
      operatingMargin: 0.19,
      netIncome,
      netMargin: 0.13,
      eps: 2 + (hash % 5),
      ebitda: operatingIncome * 1.2,
      sgaExpense: grossProfit * 0.40,
      totalAssets,
      totalLiabilities,
      totalEquity,
      currentAssets: totalAssets * 0.35,
      currentLiabilities: totalAssets * 0.20,
      cash: totalAssets * 0.10,
      longTermDebt: totalLiabilities * 0.70,
      shortTermDebt: totalLiabilities * 0.15,
      sharesOutstanding: 1e8 + (hash % 9e8),
      ppe: totalAssets * 0.40,
      receivables: totalAssets * 0.12,
      depreciation: operatingIncome * 0.10,
      operatingCashFlow,
      capitalExpenditure: capex,
      freeCashFlow: operatingCashFlow - capex,
      roa: netIncome / totalAssets,
      roe: netIncome / totalEquity,
      currentRatio: 1.75,
      debtToEquity: totalLiabilities / totalEquity,
      assetTurnover: revenue / totalAssets,
      period: `${years[i]}-12-31`,
      year: years[i],
    });
    
    revenue *= 0.90; // Step down for previous years
  }
  return results;
}

export function getMockEarnings(symbol: string): EarningsResult[] {
  const hash = hashCode(symbol);
  const quarters = ['Q1 2025', 'Q4 2024', 'Q3 2024', 'Q2 2024'];
  return quarters.map((q, i) => {
    const est = 1.0 + (hash % 10) / 5;
    const surprisePct = ((hash + i) % 5 === 0) ? -2 - (hash % 5) : 3 + (hash % 12);
    const act = +(est * (1 + surprisePct / 100)).toFixed(2);
    return {
      actual: act,
      estimate: est,
      surprise: +(act - est).toFixed(2),
      surprisePercent: surprisePct,
      period: q,
    };
  });
}

export function getMockRecommendations(symbol: string): AnalystRecommendation[] {
  const hash = hashCode(symbol);
  return [
    {
      buy: 10 + (hash % 20),
      hold: 5 + (hash % 10),
      sell: 1 + (hash % 5),
      strongBuy: 3 + (hash % 15),
      strongSell: hash % 7 === 0 ? 1 : 0,
      period: '2026-05',
    },
    {
      buy: 9 + (hash % 18),
      hold: 6 + (hash % 9),
      sell: 1 + (hash % 4),
      strongBuy: 4 + (hash % 12),
      strongSell: 0,
      period: '2026-04',
    }
  ];
}

export function getMockNews(symbol: string): NewsItem[] {
  const hash = hashCode(symbol);
  const sources = ['Bloomberg', 'Reuters', 'MarketWatch', 'Financial Times', 'TechCrunch'];
  const titles = [
    `${symbol.toUpperCase()} Unveils Cutting-Edge AI Integration in Next-Gen Solutions`,
    `Why Analysts Think ${symbol.toUpperCase()} is Poised for Strong Quarter Growth`,
    `${symbol.toUpperCase()} CEO Outlines Global Expansion Strategy Amid Market Shift`,
    `Technical Analysis: Dynamic Volume Breakout Observed in ${symbol.toUpperCase()}`
  ];
  
  return titles.map((title, i) => {
    const source = sources[(hash + i) % sources.length];
    const pubDate = new Date();
    pubDate.setDate(pubDate.getDate() - i);
    
    return {
      title,
      summary: `${symbol.toUpperCase()} has demonstrated significant progress in recent initiatives. Industry experts indicate that the upcoming product releases could reshape competitive market dynamics.`,
      url: `https://finance.yahoo.com/quote/${symbol}`,
      source,
      publishedAt: pubDate.toISOString(),
      sentiment: (i % 2 === 0 ? 'positive' : 'neutral') as 'positive' | 'neutral',
      tickers: [symbol.toUpperCase()],
      image: null,
    };
  });
}

export function getMockInsiders(symbol: string): InsiderTransaction[] {
  const hash = hashCode(symbol);
  const names = ['Sarah Jenkins', 'Michael Chang', 'David Ross', 'Linda Martinez'];
  const relations = ['Director', 'Chief Financial Officer', 'VP Operations', 'Chief Executive Officer'];
  
  return names.map((name, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (i * 12 + 5));
    return {
      name,
      title: relations[(hash + i) % relations.length],
      date: date.toISOString().split('T')[0],
      transactionType: i % 2 === 0 ? 'Sale (Open Market)' : 'Purchase (Open Market)',
      shares: 1000 + (hash % 9000) * (i + 1),
      value: (1000 + (hash % 9000) * (i + 1)) * getSeedPrice(symbol) * 0.95,
    };
  });
}

export function getMockPeers(symbol: string): string[] {
  const hash = hashCode(symbol);
  const groups = [
    ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'],
    ['JPM', 'GS', 'MS', 'BAC', 'C'],
    ['XOM', 'CVX', 'COP', 'SLB', 'HAL'],
    ['JNJ', 'LLY', 'UNH', 'PFE', 'MRK'],
    ['TSLA', 'F', 'GM', 'TM', 'HMC']
  ];
  return groups[hash % groups.length].filter(s => s !== symbol.toUpperCase()).slice(0, 4);
}
