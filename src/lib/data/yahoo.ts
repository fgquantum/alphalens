// ============================================================
// AlphaLens v6 — Yahoo Finance Data Wrapper
// PRIMARY data source — free, no API key required
// ============================================================

import YahooFinance from 'yahoo-finance2';
import type { StockQuote, OHLCV, CompanyProfile, EarningsResult, AnalystRecommendation, Financials, SearchResult, InsiderTransaction, NewsItem } from '@/lib/types';

const yahooFinance = new YahooFinance();

function subtractPeriod(period: string): Date {
  const d = new Date();
  switch (period) {
    case '1d':  d.setDate(d.getDate() - 1); break;
    case '5d':  d.setDate(d.getDate() - 5); break;
    case '1mo': d.setMonth(d.getMonth() - 1); break;
    case '3mo': d.setMonth(d.getMonth() - 3); break;
    case '6mo': d.setMonth(d.getMonth() - 6); break;
    case '1y':  d.setFullYear(d.getFullYear() - 1); break;
    case '2y':  d.setFullYear(d.getFullYear() - 2); break;
    case '5y':  d.setFullYear(d.getFullYear() - 5); break;
    case 'max': d.setFullYear(2000); break;
    default:    d.setFullYear(d.getFullYear() - 1);
  }
  return d;
}

// ── Quote ───────────────────────────────────────────────────

export async function getQuote(symbol: string): Promise<StockQuote> {
  const q = await yahooFinance.quote(symbol) as any;
  return {
    symbol: q.symbol,
    name: q.shortName || q.longName || symbol,
    price: q.regularMarketPrice ?? 0,
    change: q.regularMarketChange ?? 0,
    changePct: q.regularMarketChangePercent ?? 0,
    volume: q.regularMarketVolume ?? 0,
    avgVolume: q.averageDailyVolume3Month ?? 0,
    marketCap: q.marketCap ?? 0,
    pe: q.trailingPE ?? null,
    forwardPe: q.forwardPE ?? null,
    eps: q.epsTrailingTwelveMonths ?? null,
    dividendYield: q.dividendYield ? q.dividendYield * 100 : null,
    beta: q.beta ?? null,
    high52w: q.fiftyTwoWeekHigh ?? 0,
    low52w: q.fiftyTwoWeekLow ?? 0,
    sma50: q.fiftyDayAverage ?? 0,
    sma200: q.twoHundredDayAverage ?? 0,
    sector: (q as Record<string, unknown>).sector as string || null,
    industry: (q as Record<string, unknown>).industry as string || null,
    exchange: q.fullExchangeName || null,
    currency: q.currency || 'USD',
  };
}

// ── Historical Prices ───────────────────────────────────────

export async function getHistory(symbol: string, period = '1y'): Promise<OHLCV[]> {
  const interval = period === '1d' ? '5m' as const : '1d' as const;
  const result = await yahooFinance.historical(symbol, {
    period1: subtractPeriod(period),
    period2: new Date(),
    interval: interval as any,
  }) as any;
  return result.map((bar: any) => ({
    date: bar.date.toISOString().split('T')[0],
    open: bar.open ?? 0,
    high: bar.high ?? 0,
    low: bar.low ?? 0,
    close: bar.close ?? 0,
    volume: bar.volume ?? 0,
  }));
}

// ── Full Profile (quoteSummary) ─────────────────────────────

export async function getFullProfile(symbol: string) {
  try {
    const summary = await yahooFinance.quoteSummary(symbol, {
      modules: [
        'defaultKeyStatistics', 'financialData', 'earningsHistory', 'earningsTrend',
        'recommendationTrend', 'institutionOwnership', 'insiderTransactions',
        'majorHoldersBreakdown', 'incomeStatementHistory', 'balanceSheetHistory',
        'cashflowStatementHistory', 'assetProfile',
      ],
    }) as any;
    return summary;
  } catch {
    return null;
  }
}

// ── Parsed Company Profile ──────────────────────────────────

export async function getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
  const summary = await getFullProfile(symbol);
  if (!summary?.assetProfile) return null;
  const p = summary.assetProfile;
  const q = await yahooFinance.quote(symbol) as any;
  return {
    symbol,
    name: q.shortName || q.longName || symbol,
    description: p.longBusinessSummary || '',
    sector: p.sector || '',
    industry: p.industry || '',
    country: p.country || '',
    employees: p.fullTimeEmployees || null,
    website: p.website || '',
    ceo: '',
    exchange: q.fullExchangeName || '',
    logo: null,
  };
}

// ── Financials Extraction ───────────────────────────────────

export async function getFinancials(symbol: string): Promise<Financials[]> {
  const summary = await getFullProfile(symbol);
  if (!summary) return [];

  const incStatements = summary.incomeStatementHistory?.incomeStatementHistory || [];
  const balSheets = summary.balanceSheetHistory?.balanceSheetHistory || [];
  const cfStatements = summary.cashflowStatementHistory?.cashflowStatements || [];
  const finData = summary.financialData;

  const results: Financials[] = [];

  for (let i = 0; i < Math.min(incStatements.length, 4); i++) {
    const inc = incStatements[i] as Record<string, unknown> || {};
    const bal = (balSheets[i] || {}) as Record<string, unknown>;
    const cf = (cfStatements[i] || {}) as Record<string, unknown>;

    const revenue = (inc.totalRevenue as number) || 0;
    const costOfRevenue = (inc.costOfRevenue as number) || 0;
    const grossProfit = revenue - costOfRevenue;
    const netIncome = (inc.netIncome as number) || 0;
    const operatingIncome = (inc.operatingIncome as number) || 0;
    const totalAssets = (bal.totalAssets as number) || 1; // avoid div by 0
    const totalLiabilities = (bal.totalLiab as number) || 0;
    const totalEquity = (bal.totalStockholderEquity as number) || 1;
    const operatingCashFlow = (cf.totalCashFromOperatingActivities as number) || 0;
    const capex = Math.abs((cf.capitalExpenditures as number) || 0);

    results.push({
      revenue,
      costOfRevenue,
      grossProfit,
      grossMargin: revenue ? grossProfit / revenue : 0,
      operatingIncome,
      operatingMargin: revenue ? operatingIncome / revenue : 0,
      netIncome,
      netMargin: revenue ? netIncome / revenue : 0,
      eps: (inc.dilutedEPS as number) || 0,
      ebitda: (inc.ebitda as number) || operatingIncome,
      sgaExpense: (inc.sellingGeneralAdministrative as number) || 0,

      totalAssets,
      totalLiabilities,
      totalEquity,
      currentAssets: (bal.totalCurrentAssets as number) || 0,
      currentLiabilities: (bal.totalCurrentLiabilities as number) || 1,
      cash: (bal.cash as number) || 0,
      longTermDebt: (bal.longTermDebt as number) || 0,
      shortTermDebt: (bal.shortTermBorrowings as number) || 0,
      sharesOutstanding: (bal.commonStock as number) || 0,
      ppe: (bal.propertyPlantEquipment as number) || 0,
      receivables: (bal.netReceivables as number) || 0,
      depreciation: (cf.depreciation as number) || 0,

      operatingCashFlow,
      capitalExpenditure: capex,
      freeCashFlow: operatingCashFlow - capex,

      roa: totalAssets ? netIncome / totalAssets : 0,
      roe: totalEquity ? netIncome / totalEquity : 0,
      currentRatio: (bal.totalCurrentLiabilities as number) ? (bal.totalCurrentAssets as number || 0) / (bal.totalCurrentLiabilities as number) : 0,
      debtToEquity: totalEquity ? totalLiabilities / totalEquity : 0,
      assetTurnover: totalAssets ? revenue / totalAssets : 0,

      period: (inc.endDate as Date)?.toISOString?.()?.split('T')[0] || '',
      year: (inc.endDate as Date)?.getFullYear?.() || new Date().getFullYear(),
    });
  }

  // Add current ratios from financialData if available
  if (results.length > 0 && finData) {
    results[0].roa = (finData as Record<string, unknown>).returnOnAssets as number || results[0].roa;
    results[0].roe = (finData as Record<string, unknown>).returnOnEquity as number || results[0].roe;
    results[0].currentRatio = (finData as Record<string, unknown>).currentRatio as number || results[0].currentRatio;
    results[0].debtToEquity = (finData as Record<string, unknown>).debtToEquity as number ? ((finData as Record<string, unknown>).debtToEquity as number / 100) : results[0].debtToEquity;
  }

  return results;
}

// ── Earnings ────────────────────────────────────────────────

export async function getEarnings(symbol: string): Promise<EarningsResult[]> {
  const summary = await getFullProfile(symbol);
  if (!summary?.earningsHistory?.history) return [];
  return summary.earningsHistory.history.map((e: Record<string, unknown>) => ({
    actual: (e.epsActual as number) ?? null,
    estimate: (e.epsEstimate as number) ?? null,
    surprise: (e.epsDifference as number) ?? null,
    surprisePercent: (e.surprisePercent as number) ? (e.surprisePercent as number) * 100 : null,
    period: (e.quarter as Date)?.toISOString?.()?.split('T')[0] || '',
  }));
}

// ── Analyst Recommendations ─────────────────────────────────

export async function getRecommendations(symbol: string): Promise<AnalystRecommendation[]> {
  const summary = await getFullProfile(symbol);
  if (!summary?.recommendationTrend?.trend) return [];
  return summary.recommendationTrend.trend.map((r: Record<string, number | string>) => ({
    buy: (r.buy as number) || 0,
    hold: (r.hold as number) || 0,
    sell: (r.sell as number) || 0,
    strongBuy: (r.strongBuy as number) || 0,
    strongSell: (r.strongSell as number) || 0,
    period: (r.period as string) || '',
  }));
}

// ── Insider Transactions ────────────────────────────────────

export async function getInsiderTransactions(symbol: string): Promise<InsiderTransaction[]> {
  const summary = await getFullProfile(symbol);
  if (!summary?.insiderTransactions?.transactions) return [];
  return summary.insiderTransactions.transactions.slice(0, 20).map((t: Record<string, unknown>) => ({
    name: (t.filerName as string) || '',
    title: (t.filerRelation as string) || '',
    date: (t.startDate as Date)?.toISOString?.()?.split('T')[0] || '',
    transactionType: (t.transactionText as string) || '',
    shares: (t.shares as number) || 0,
    value: (t.value as number) || 0,
  }));
}

// ── Search ──────────────────────────────────────────────────

export async function searchTickers(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 1) return [];
  try {
    const r = await yahooFinance.search(query) as any;
    return (r.quotes || [])
      .filter((q: Record<string, unknown>) => ['EQUITY', 'ETF'].includes(q.quoteType as string))
      .slice(0, 10)
      .map((q: Record<string, unknown>) => ({
        symbol: (q.symbol as string) || '',
        name: (q.shortname as string) || (q.longname as string) || '',
        type: (q.quoteType as string) || '',
        exchange: (q.exchange as string) || '',
      }));
  } catch {
    return [];
  }
}

// ── News (from Yahoo) ───────────────────────────────────────

export async function getNews(symbol: string): Promise<NewsItem[]> {
  try {
    const result = await yahooFinance.search(symbol, { newsCount: 10 }) as any;
    return (result.news || []).map((n: Record<string, unknown>) => ({
      title: (n.title as string) || '',
      summary: '',
      url: (n.link as string) || '',
      source: (n.publisher as string) || '',
      publishedAt: (n.providerPublishTime as Date)?.toISOString?.() || '',
      sentiment: 'neutral' as const,
      tickers: [symbol],
      image: (n.thumbnail as any)?.resolutions?.[0] ? 
        ((n.thumbnail as any).resolutions[0].url) : null,
    }));
  } catch {
    return [];
  }
}
