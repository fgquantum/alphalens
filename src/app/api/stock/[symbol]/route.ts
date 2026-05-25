import { NextRequest, NextResponse } from 'next/server';
import { getStockPageData } from '@/lib/data/router';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const resolvedParams = await params;
    const symbol = resolvedParams?.symbol || '';
    
    console.log(`[API STOCK] Received request for symbol:`, symbol);

    if (!symbol) {
      return NextResponse.json({ error: 'No symbol provided' }, { status: 400 });
    }

    const data = await getStockPageData(symbol.toUpperCase());
    
    console.log(`[API STOCK] Successfully fetched data for:`, symbol);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[API STOCK] Error fetching stock data:`, error);
    return NextResponse.json(
      { error: `Failed to fetch data`, details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
