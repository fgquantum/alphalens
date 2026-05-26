import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const MOCK_TRADERS = [
  { name: '@quant_draft', email: 'draft@mock.alphalens', tier: 'Diamond', tickers: ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'AVGO'], alloc: [30, 20, 20, 15, 15] },
  { name: '@midnight_alpha', email: 'midnight@mock.alphalens', tier: 'Diamond', tickers: ['AMZN', 'META', 'NFLX', 'GOOGL', 'NVDA'], alloc: [25, 25, 20, 15, 15] },
  { name: '@vol_whisperer', email: 'vol@mock.alphalens', tier: 'Platinum', tickers: ['LLY', 'V', 'MSFT', 'AAPL', 'TSLA'], alloc: [40, 20, 15, 15, 10] },
  { name: '@mean_reverter', email: 'mean@mock.alphalens', tier: 'Platinum', tickers: ['COST', 'PG', 'WMT', 'PEP', 'KO'], alloc: [30, 20, 20, 15, 15] },
  { name: '@edge_hunter', email: 'edge@mock.alphalens', tier: 'Gold', tickers: ['AMD', 'QCOM', 'TXN', 'INTC', 'MU'], alloc: [35, 25, 15, 15, 10] },
  { name: '@factor_guy', email: 'factor@mock.alphalens', tier: 'Gold', tickers: ['XOM', 'CVX', 'JPM', 'BAC', 'GS'], alloc: [20, 20, 20, 20, 20] },
  { name: '@low_beta_pro', email: 'lowbeta@mock.alphalens', tier: 'Silver', tickers: ['UNH', 'JNJ', 'PFE', 'MRK', 'ABBV'], alloc: [25, 25, 20, 15, 15] },
  { name: '@vwap_only', email: 'vwap@mock.alphalens', tier: 'Silver', tickers: ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'META'], alloc: [20, 20, 20, 20, 20] },
];

const BUDGETS: Record<string, number> = {
  Silver: 10000,
  Gold: 20000,
  Platinum: 50000,
  Diamond: 100000,
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { action, tier } = body as { action: 'promote' | 'seed' | 'reset'; tier?: string };

    // ── ACTION: Promote / Demote Self ──
    if (action === 'promote') {
      if (!tier || !['Silver', 'Gold', 'Platinum', 'Diamond'].includes(tier)) {
        return NextResponse.json({ error: 'Invalid tier specified' }, { status: 400 });
      }

      const { freeEntry } = body as { freeEntry?: boolean };

      await db.user.update({
        where: { id: userId },
        data: { 
          arenaTier: tier,
          ...(freeEntry !== undefined ? { hasFreeEntry: freeEntry } : {}),
        },
      });

      return NextResponse.json({ success: true, message: `Successfully changed your arena tier to ${tier}${freeEntry ? ' with Free Entry' : ''}` });
    }

    // ── ACTION: Seed Mock Ecosystem ──
    if (action === 'seed') {
      const activeSeason = await db.arenaSeason.findFirst({
        where: { isActive: true },
      });

      if (!activeSeason) {
        return NextResponse.json({ error: 'No active season found to seed' }, { status: 404 });
      }

      const seededNames: string[] = [];

      for (const trader of MOCK_TRADERS) {
        // Find or create mock user
        let mockUser = await db.user.findUnique({
          where: { email: trader.email },
        });

        if (!mockUser) {
          mockUser = await db.user.create({
            data: {
              name: trader.name,
              email: trader.email,
              arenaTier: trader.tier,
              realBalance: 50.0,
            },
          });
        } else {
          // Sync tier
          await db.user.update({
            where: { id: mockUser.id },
            data: { arenaTier: trader.tier },
          });
        }

        // Check if participant already entered
        const existingParticipant = await db.arenaParticipant.findFirst({
          where: {
            seasonId: activeSeason.id,
            userId: mockUser.id,
          },
        });

        if (existingParticipant) continue;

        // Formulate prices and allocations
        const budget = BUDGETS[trader.tier] || 10000;
        const entryPrices: Record<string, number> = {};
        const allocations: Record<string, number> = {};

        trader.tickers.forEach((symbol, i) => {
          entryPrices[symbol] = 100.0; // simple starting baseline price
          allocations[symbol] = trader.alloc[i];
        });

        // Generate baseline return % (-2% to +3%)
        const randomReturn = Math.random() * 5 - 2; // e.g. +1.5%
        const portfolioValue = budget * (1 + randomReturn / 100);

        // Create participant
        const participant = await db.arenaParticipant.create({
          data: {
            seasonId: activeSeason.id,
            userId: mockUser.id,
            tier: trader.tier,
            budget: budget,
            tickers: trader.tickers.join(','),
            allocationsJSON: JSON.stringify(allocations),
            entryPricesJSON: JSON.stringify(entryPrices),
            currentPricesJSON: JSON.stringify(entryPrices),
            portfolioValue: portfolioValue,
            avgReturnPct: randomReturn,
            hasPaid: true,
          },
        });

        // Add 5 days of history for beautiful UI charts
        for (let day = 0; day < 5; day++) {
          const dayDate = new Date();
          dayDate.setDate(dayDate.getDate() - (5 - day));
          
          const dayReturn = (randomReturn / 5) * (day + 1) + (Math.random() * 2 - 1);
          const dayValue = budget * (1 + dayReturn / 100);

          await db.arenaDailyPerformance.create({
            data: {
              participantId: participant.id,
              date: dayDate,
              portfolioValue: dayValue,
              avgReturnPct: dayReturn,
            },
          });
        }

        seededNames.push(trader.name);
      }

      return NextResponse.json({
        success: true,
        message: `Successfully seeded ${seededNames.length} mock competitors across all leagues.`,
        seeded: seededNames,
      });
    }

    // ── ACTION: Reset All Arena Data ──
    if (action === 'reset') {
      await db.$transaction([
        db.arenaDailyPerformance.deleteMany({}),
        db.arenaParticipant.deleteMany({}),
        db.arenaSeason.deleteMany({}),
      ]);

      // Re-create Season 1 starting June 1, 2026
      const activeSeason = await db.arenaSeason.create({
        data: {
          seasonNumber: 1,
          startDate: new Date('2026-06-01T00:00:00Z'),
          endDate: new Date('2026-06-29T00:00:00Z'),
          isActive: true,
          isCompleted: false,
        },
      });

      // Restore user state to defaults (balance 100€, Silver tier)
      await db.user.update({
        where: { id: userId },
        data: {
          realBalance: 100.0,
          arenaTier: 'Silver',
          hasFreeEntry: false,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Arena database successfully reset to clean state (Season 1 active starting June 1, 2026; balance restored to 100€; tier reset to Silver).',
        activeSeason,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Arena sandbox error:', error);
    return NextResponse.json({ error: 'Sandbox action failed' }, { status: 500 });
  }
}
