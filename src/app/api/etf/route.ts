import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { cached, TTL } from '@/lib/cache';

const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsQuery = searchParams.get('symbols');
  
  if (!symbolsQuery) {
    return NextResponse.json({ error: 'Missing symbols' }, { status: 400 });
  }

  const symbols = symbolsQuery.split(',').slice(0, 5); // limit to 5 ETFs at once
  
  try {
    const results: Record<string, any[]> = {};
    const names: Record<string, string> = {};
    
    await Promise.all(symbols.map(async (sym) => {
      try {
        const cachedData = await cached(`etf:${sym.toUpperCase()}`, TTL.etfHoldings, async () => {
          try {
            const q = await yahooFinance.quote(sym) as any;
            const name = q.shortName || q.longName || sym;
            
            const summary = await yahooFinance.quoteSummary(sym, { modules: ['topHoldings'] }) as any;
            const holdings = summary?.topHoldings?.holdings
              ? summary.topHoldings.holdings.map((h: any) => ({
                  symbol: h.symbol,
                  name: h.holdingName,
                  percent: h.holdingPercent * 100 // Convert ratio to percent
                }))
              : [];
            return { name, holdings };
          } catch (fetchError) {
            console.warn(`[API ETF] Failed to fetch live data for ${sym}, generating mock holdings.`, fetchError);
            const mockHoldings = [
              { symbol: 'AAPL', name: 'Apple Inc.', percent: 7.2 },
              { symbol: 'MSFT', name: 'Microsoft Corp.', percent: 6.8 },
              { symbol: 'NVDA', name: 'NVIDIA Corp.', percent: 5.5 },
              { symbol: 'AMZN', name: 'Amazon.com Inc.', percent: 3.9 },
              { symbol: 'META', name: 'Meta Platforms Inc.', percent: 2.4 }
            ];
            return { name: `${sym.toUpperCase()} ETF (Mock Data)`, holdings: mockHoldings };
          }
        });
        
        names[sym] = cachedData.name;
        results[sym] = cachedData.holdings;
      } catch (e) {
        results[sym] = [];
        names[sym] = sym;
      }
    }));

    return NextResponse.json({ data: results, names });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch ETF data' }, { status: 500 });
  }
}
