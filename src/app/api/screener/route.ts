import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { cached, TTL } from '@/lib/cache';
import { getMockQuote } from '@/lib/data/router';

const yahooFinance = new YahooFinance();

const POPULAR_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK-B',
  'JPM', 'V', 'JNJ', 'WMT', 'PG', 'MA', 'HD', 'DIS',
  'NFLX', 'ADBE', 'CRM', 'AMD', 'INTC', 'PYPL', 'COST', 'PEP',
  'UNH', 'XOM', 'LLY', 'BAC', 'AVGO', 'KO',
];

const SECTOR_MAP: Record<string, string> = {
  'AAPL': 'Technology', 'MSFT': 'Technology', 'NVDA': 'Technology', 'AMD': 'Technology',
  'ADBE': 'Technology', 'CRM': 'Technology', 'INTC': 'Technology', 'AVGO': 'Technology',
  'PYPL': 'Financial Services', 'JPM': 'Financial Services', 'V': 'Financial Services',
  'MA': 'Financial Services', 'BRK-B': 'Financial Services', 'BAC': 'Financial Services',
  'AMZN': 'Consumer Cyclical', 'TSLA': 'Consumer Cyclical', 'HD': 'Consumer Cyclical',
  'GOOGL': 'Communication Services', 'META': 'Communication Services',
  'NFLX': 'Communication Services', 'DIS': 'Communication Services',
  'WMT': 'Consumer Defensive', 'PG': 'Consumer Defensive', 'COST': 'Consumer Defensive',
  'PEP': 'Consumer Defensive', 'KO': 'Consumer Defensive',
  'JNJ': 'Healthcare', 'UNH': 'Healthcare', 'LLY': 'Healthcare',
  'XOM': 'Energy',
};

export async function GET() {
  try {
    const data = await cached('api:screener', TTL.screener, async () => {
      const symbols = POPULAR_STOCKS;

      const quotes = await Promise.allSettled(
        symbols.map(s => yahooFinance.quote(s) as any)
      );

      const results = quotes.map((q, i) => {
        const symbol = symbols[i];
        let v: any;
        if (q.status === 'fulfilled' && q.value) {
          v = q.value;
        } else {
          // Robust check: if live query failed, fall back to mock data
          const m = getMockQuote(symbol);
          v = {
            symbol: symbol,
            shortName: m.name,
            longName: m.name,
            regularMarketPrice: m.price,
            regularMarketChangePercent: m.changePct,
            regularMarketChange: m.change,
            marketCap: m.marketCap,
            regularMarketVolume: m.volume,
            averageDailyVolume3Month: m.avgVolume,
            trailingPE: m.pe,
            forwardPE: m.forwardPe,
            epsTrailingTwelveMonths: m.eps,
            trailingAnnualDividendYield: m.dividendYield ? m.dividendYield / 100 : null,
            beta: m.beta,
            fiftyTwoWeekHigh: m.high52w,
            fiftyTwoWeekLow: m.low52w,
            priceToBook: null,
            fiftyDayAverage: m.sma50,
            twoHundredDayAverage: m.sma200,
          };
        }

        // Proxy score (real scoring uses the 12-algorithm pipeline on detail page)
        const pe = v.trailingPE || 15;
        const growth = v.epsTrailingTwelveMonths > 0 ? 80 : 40;
        const profit = v.regularMarketChangePercent > 0 ? 70 : 40;
        let proxyScore = Math.floor((pe < 20 ? 80 : pe < 30 ? 60 : 45) * 0.3 + growth * 0.4 + profit * 0.3);
        proxyScore = Math.max(15, Math.min(99, proxyScore));
        const grade = proxyScore >= 90 ? 'A+' : proxyScore >= 80 ? 'A' : proxyScore >= 70 ? 'B+' : proxyScore >= 60 ? 'B' : proxyScore >= 50 ? 'C+' : proxyScore >= 40 ? 'C' : proxyScore >= 30 ? 'D' : 'F';
        const signal = proxyScore >= 85 ? 'Strong Buy' : proxyScore >= 70 ? 'Buy' : proxyScore >= 55 ? 'Watch' : proxyScore >= 40 ? 'Neutral' : proxyScore >= 25 ? 'Caution' : 'Avoid';

        // Extract maximum available metrics from Yahoo quote
        const fiftyTwoWeekHigh = v.fiftyTwoWeekHigh ?? null;
        const fiftyTwoWeekLow = v.fiftyTwoWeekLow ?? null;
        const distFromHigh = fiftyTwoWeekHigh && v.regularMarketPrice
          ? +((v.regularMarketPrice - fiftyTwoWeekHigh) / fiftyTwoWeekHigh * 100).toFixed(1)
          : null;

        return {
          symbol: v.symbol,
          name: v.shortName || v.longName || v.symbol,
          price: v.regularMarketPrice ?? 0,
          changePct: v.regularMarketChangePercent ?? 0,
          changeAbs: v.regularMarketChange ?? 0,
          marketCap: v.marketCap ?? 0,
          volume: v.regularMarketVolume ?? 0,
          avgVolume: v.averageDailyVolume3Month ?? v.averageDailyVolume10Day ?? 0,
          pe: v.trailingPE ?? null,
          forwardPE: v.forwardPE ?? null,
          eps: v.epsTrailingTwelveMonths ?? null,
          dividendYield: v.trailingAnnualDividendYield ? +(v.trailingAnnualDividendYield * 100).toFixed(2) : null,
          beta: v.beta ?? null,
          fiftyTwoWeekHigh,
          fiftyTwoWeekLow,
          distFromHigh,
          priceToBook: v.priceToBook ?? null,
          fiftyDayAverage: v.fiftyDayAverage ?? null,
          twoHundredDayAverage: v.twoHundredDayAverage ?? null,
          alphaScore: proxyScore,
          grade,
          signal,
          sector: SECTOR_MAP[v.symbol as string] || v.sector || 'Unknown',
        };
      });

      // Insights
      const avgPE = results.length ? Math.round(results.reduce((a, r) => a + (r.pe || 15), 0) / results.length) : 15;
      const sectorCounts: Record<string, number> = {};
      results.forEach(r => { sectorCounts[r.sector] = (sectorCounts[r.sector] || 0) + 1; });
      const topSector = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Technology';
      const bullish = results.filter(r => r.changePct > 0).length;
      const bearish = results.length - bullish;

      return {
        stocks: results,
        insights: {
          message: bullish > bearish
            ? `Market breadth is positive with ${bullish}/${results.length} stocks in the green. ${topSector} leads.`
            : `Market breadth is weak with ${bearish}/${results.length} stocks under pressure. Defensive positioning favored.`,
          topSector,
          avgPE,
          totalStocks: results.length,
          bullishCount: bullish,
          bearishCount: bearish,
        },
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API SCREENER] Fatal error fetching screener:', error);
    return NextResponse.json({ error: 'Failed to fetch screener data' }, { status: 500 });
  }
}
