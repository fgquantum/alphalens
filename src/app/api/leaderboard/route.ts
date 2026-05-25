import { NextResponse } from 'next/server';
import { getLeaderboardStats } from '@/lib/data/router';

const WATCHED_TICKERS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK-B',
  'JPM', 'V', 'LLY', 'WMT', 'PG', 'UNH', 'HD', 'DIS', 'NFLX', 'ADBE', 
  'CRM', 'AMD', 'INTC', 'PYPL', 'COST', 'PEP', 'AVGO', 'CSCO', 'ABBV',
  'CVX', 'XOM', 'QCOM', 'TXN', 'MRK', 'PFE'
];

export async function GET() {
  try {
    const stocks = await getLeaderboardStats(WATCHED_TICKERS);
    return NextResponse.json(stocks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 });
  }
}
