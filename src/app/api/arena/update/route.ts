import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getQuote } from '@/lib/data/yahoo';

const PRIZES: Record<string, number> = {
  Silver: 5.0,
  Gold: 10.0,
  Platinum: 20.0,
  Diamond: 100.0,
};

const NEXT_TIERS: Record<string, string> = {
  Silver: 'Gold',
  Gold: 'Platinum',
  Platinum: 'Diamond',
  Diamond: 'Diamond',
};

const PREV_TIERS: Record<string, string> = {
  Diamond: 'Platinum',
  Platinum: 'Gold',
  Gold: 'Silver',
  Silver: 'Silver',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { forceClose, simulatePriceShift } = body as { forceClose?: boolean; simulatePriceShift?: boolean };

    // 1. Fetch active season
    const activeSeason = await db.arenaSeason.findFirst({
      where: { isActive: true },
    });

    if (!activeSeason) {
      return NextResponse.json({ error: 'No active season found to update.' }, { status: 404 });
    }

    // 2. Fetch all active participants
    const participants = await db.arenaParticipant.findMany({
      where: { seasonId: activeSeason.id },
      include: { user: true },
    });

    if (participants.length === 0) {
      // If no participants, we can just check if we need to close the season
      const isSeasonOver = forceClose || new Date() >= new Date(activeSeason.endDate);
      if (isSeasonOver) {
        await closeSeasonAndStartNext(activeSeason);
        return NextResponse.json({ success: true, message: 'Season closed (no participants). New season started.' });
      }
      return NextResponse.json({ success: true, message: 'No participants to update.' });
    }

    // 3. Fetch unique tickers across all participants to optimize Yahoo Finance requests
    const uniqueTickers = new Set<string>();
    participants.forEach(p => {
      p.tickers.split(',').forEach(ticker => {
        if (ticker) uniqueTickers.add(ticker.toUpperCase().trim());
      });
    });

    // 4. Fetch current prices
    const currentPrices: Record<string, number> = {};
    for (const symbol of uniqueTickers) {
      try {
        const quote = await getQuote(symbol);
        let price = quote.price > 0 ? quote.price : 100.0;
        
        // Developer sandbox testing: simulate random price shifts (-3% to +4%) if requested
        if (simulatePriceShift) {
          const shiftPct = 1 + (Math.random() * 7 - 3) / 100; // -3% to +4%
          price = price * shiftPct;
        }

        currentPrices[symbol] = price;
      } catch (e) {
        console.warn(`Failed to fetch quote for ${symbol} during daily update, using fallback`, e);
        // Fallback: use previous price if available in participant record, else 100
        const sampleParticipant = participants.find(p => p.tickers.includes(symbol));
        if (sampleParticipant) {
          const prevPrices = JSON.parse(sampleParticipant.currentPricesJSON || '{}');
          currentPrices[symbol] = prevPrices[symbol] || 100.0;
        } else {
          currentPrices[symbol] = 100.0;
        }
      }
    }

    // 5. Update each participant
    const updatedParticipants = [];
    for (const participant of participants) {
      const tickers = participant.tickers.split(',');
      const allocations = JSON.parse(participant.allocationsJSON || '{}') as Record<string, number>;
      const entryPrices = JSON.parse(participant.entryPricesJSON || '{}') as Record<string, number>;
      
      const participantCurrentPrices: Record<string, number> = {};
      let totalCurrentValue = 0;

      tickers.forEach(ticker => {
        const entryPrice = entryPrices[ticker] || 100.0;
        const currentPrice = currentPrices[ticker] || entryPrice;
        participantCurrentPrices[ticker] = currentPrice;

        const allocPct = allocations[ticker] || 0;
        const investedAmount = participant.budget * (allocPct / 100);
        const returnFactor = currentPrice / entryPrice;
        const currentAssetValue = investedAmount * returnFactor;
        
        totalCurrentValue += currentAssetValue;
      });

      const cumulativeReturn = ((totalCurrentValue - participant.budget) / participant.budget) * 100;

      // Save participant updates
      const updated = await db.arenaParticipant.update({
        where: { id: participant.id },
        data: {
          currentPricesJSON: JSON.stringify(participantCurrentPrices),
          portfolioValue: totalCurrentValue,
          avgReturnPct: cumulativeReturn,
        },
      });

      // Log daily performance record
      await db.arenaDailyPerformance.create({
        data: {
          participantId: participant.id,
          portfolioValue: totalCurrentValue,
          avgReturnPct: cumulativeReturn,
          date: new Date(),
        },
      });

      updatedParticipants.push({
        ...updated,
        user: participant.user,
      });
    }

    // 6. Check if season is over and needs payouts + promotions
    const isSeasonOver = forceClose || new Date() >= new Date(activeSeason.endDate);
    let closeSummary = null;

    if (isSeasonOver) {
      closeSummary = await closeSeasonAndStartNext(activeSeason, updatedParticipants);
    }

    return NextResponse.json({
      success: true,
      message: isSeasonOver ? 'Daily update run and season completed successfully!' : 'Daily 10 PM CET update complete.',
      seasonClosed: isSeasonOver,
      closeSummary,
    });
  } catch (error: any) {
    console.error('Arena daily update error:', error);
    return NextResponse.json({ error: 'Failed to process daily update' }, { status: 500 });
  }
}

// ── Season Closure Handler ──────────────────────────────────────
async function closeSeasonAndStartNext(
  activeSeason: any,
  participants: any[] = []
) {
  const tiers = ['Silver', 'Gold', 'Platinum', 'Diamond'];
  const logEvents: string[] = [];

  // Group participants by tier
  const tierParticipants: Record<string, any[]> = {
    Silver: [],
    Gold: [],
    Platinum: [],
    Diamond: [],
  };

  participants.forEach(p => {
    if (tierParticipants[p.tier]) {
      tierParticipants[p.tier].push(p);
    }
  });

  let seasonWinnerId: string | null = null;
  let highestGlobalReturn = -999;

  // Run payouts & promotions inside a transaction
  await db.$transaction(async (tx) => {
    // Process each tier independently
    for (const tier of tiers) {
      const list = tierParticipants[tier];
      if (list.length === 0) continue;

      // Sort by return pct descending
      list.sort((a, b) => b.avgReturnPct - a.avgReturnPct);

      // Best Performer (Winner)
      const winner = list[0];
      const prize = PRIZES[tier] || 5.0;
      const nextTier = NEXT_TIERS[tier] || tier;

      await tx.user.update({
        where: { id: winner.userId },
        data: {
          realBalance: {
            increment: prize,
          },
          arenaTier: nextTier,
        },
      });

      logEvents.push(`Tier ${tier} Winner: ${winner.user.name || winner.user.email} (+${winner.avgReturnPct.toFixed(2)}% return) gets ${prize}€ and promoted to ${nextTier}`);

      // Track the overall best performer for the entire season
      if (winner.avgReturnPct > highestGlobalReturn) {
        highestGlobalReturn = winner.avgReturnPct;
        seasonWinnerId = winner.userId;
      }

      // Worst Performer (Loser) - only if there is more than 1 player in the tier to make it competitive!
      if (list.length > 1) {
        const loser = list[list.length - 1];
        const prevTier = PREV_TIERS[tier] || tier;

        // Ensure we don't demote if already at Silver
        if (tier !== 'Silver') {
          await tx.user.update({
            where: { id: loser.userId },
            data: {
              arenaTier: prevTier,
            },
          });
          logEvents.push(`Tier ${tier} Loser: ${loser.user.name || loser.user.email} (${loser.avgReturnPct.toFixed(2)}% return) demoted to ${prevTier}`);
        }
      }
    }

    // Mark current season as completed
    await tx.arenaSeason.update({
      where: { id: activeSeason.id },
      data: {
        isActive: false,
        isCompleted: true,
        winnerId: seasonWinnerId,
      },
    });

    // Start next season (starts at the end of the previous, lasts 4 weeks)
    const nextSeasonNumber = activeSeason.seasonNumber + 1;
    const nextStartDate = new Date(activeSeason.endDate);
    const nextEndDate = new Date(nextStartDate.getTime() + 28 * 24 * 60 * 60 * 1000); // +28 days

    await tx.arenaSeason.create({
      data: {
        seasonNumber: nextSeasonNumber,
        startDate: nextStartDate,
        endDate: nextEndDate,
        isActive: true,
        isCompleted: false,
      },
    });
  });

  return {
    logEvents,
    winnerId: seasonWinnerId,
    highestGlobalReturn,
  };
}
