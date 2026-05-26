import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getQuote } from '@/lib/data/yahoo';

const BUDGETS: Record<string, number> = {
  Silver: 10000,
  Gold: 20000,
  Platinum: 50000,
  Diamond: 100000,
};

const ENTRY_FEES: Record<string, number> = {
  Silver: 1.0,
  Gold: 2.0,
  Platinum: 3.0,
  Diamond: 5.0,
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { allocations, tier } = body as { allocations: Record<string, number>; tier?: string };

    if (!allocations) {
      return NextResponse.json({ error: 'Allocations are required' }, { status: 400 });
    }

    const tickers = Object.keys(allocations).map(t => t.toUpperCase().trim());
    
    // 1. Validate exactly 5 tickers
    if (tickers.length !== 5) {
      return NextResponse.json({ error: 'You must select exactly 5 tickers.' }, { status: 400 });
    }

    // 2. Validate allocations sum to 100%
    const totalAlloc = Object.values(allocations).reduce((sum, val) => sum + val, 0);
    if (Math.abs(totalAlloc - 100) > 0.01) {
      return NextResponse.json({ error: 'Allocations must sum up exactly to 100%.' }, { status: 400 });
    }

    // Load user and check balance
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Determine selected tier and fee
    const targetTier = tier && ['Silver', 'Gold', 'Platinum', 'Diamond'].includes(tier) ? tier : (user.arenaTier || 'Silver');
    
    // Check if free entry applies (user has free entry and is joining their allowed tier)
    const isFreeEntry = user.hasFreeEntry && targetTier === user.arenaTier;
    const requiredFee = isFreeEntry ? 0.0 : (ENTRY_FEES[targetTier] || 1.0);

    if (user.realBalance < requiredFee) {
      return NextResponse.json({ error: `Insufficient wallet balance. You need at least ${requiredFee.toFixed(2)}€ to join this arena.` }, { status: 403 });
    }

    // Find active season
    const activeSeason = await db.arenaSeason.findFirst({
      where: { isActive: true },
    });

    if (!activeSeason) {
      return NextResponse.json({ error: 'No active season found.' }, { status: 404 });
    }

    // Check if user already joined this season
    const existingEntry = await db.arenaParticipant.findFirst({
      where: {
        seasonId: activeSeason.id,
        userId: userId,
      },
    });

    if (existingEntry) {
      return NextResponse.json({ error: 'You have already joined this season.' }, { status: 409 });
    }

    // 4. Fetch entry prices for all 5 tickers
    const entryPrices: Record<string, number> = {};
    for (const symbol of tickers) {
      try {
        const quote = await getQuote(symbol);
        entryPrices[symbol] = quote.price > 0 ? quote.price : 100.0; // fallback to 100 if quote fails
      } catch (e) {
        console.warn(`Failed to fetch quote for ${symbol}, using fallback`, e);
        entryPrices[symbol] = 100.0; // fallback
      }
    }

    const budget = BUDGETS[targetTier] || 10000;

    // Start a transaction: deduct fee, consume free entry, create participant
    await db.$transaction(async (tx) => {
      // Deduct fee and update user tier/free entry status
      await tx.user.update({
        where: { id: userId },
        data: {
          realBalance: {
            decrement: requiredFee,
          },
          arenaTier: targetTier,
          ...(isFreeEntry ? { hasFreeEntry: false } : {}),
        },
      });

      // Create participant entry
      const participant = await tx.arenaParticipant.create({
        data: {
          seasonId: activeSeason.id,
          userId: userId,
          tier: targetTier,
          budget: budget,
          tickers: tickers.join(','),
          allocationsJSON: JSON.stringify(allocations),
          entryPricesJSON: JSON.stringify(entryPrices),
          currentPricesJSON: JSON.stringify(entryPrices),
          hasPaid: true,
          portfolioValue: budget,
          avgReturnPct: 0.0,
        },
      });

      // Create initial daily performance record as a baseline
      await tx.arenaDailyPerformance.create({
        data: {
          participantId: participant.id,
          date: new Date(),
          portfolioValue: budget,
          avgReturnPct: 0.0,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Join arena error:', error);
    return NextResponse.json({ error: 'Failed to join season' }, { status: 500 });
  }
}
