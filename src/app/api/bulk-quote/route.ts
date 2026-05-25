import { NextResponse } from 'next/server';
import { getStockQuote } from '@/lib/data/router';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsQuery = searchParams.get('symbols');
  
  if (!symbolsQuery) {
    return NextResponse.json({ error: 'Missing symbols' }, { status: 400 });
  }

  const symbols = symbolsQuery.split(',').slice(0, 50); // limit 50
  
  try {
    const results: Record<string, { price: number, change: number, changePct: number, name: string }> = {};
    
    // We can run in parallel using our robust, cached & fallback-enabled getStockQuote
    const quotes = await Promise.allSettled(
      symbols.map(s => getStockQuote(s))
    );

    quotes.forEach((res, i) => {
      if (res.status === 'fulfilled' && res.value) {
        results[symbols[i]] = {
          price: res.value.price,
          change: res.value.change,
          changePct: res.value.changePct,
          name: res.value.name
        };
      }
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('[API BULK-QUOTE] Fatal error fetching bulk quotes:', error);
    return NextResponse.json({ error: 'Failed to fetch bulk quotes' }, { status: 500 });
  }
}
