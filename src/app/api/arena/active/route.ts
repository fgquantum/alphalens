import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user details to get real wallet balance and current competitive tier
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { realBalance: true, arenaTier: true, hasFreeEntry: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find active season
    let activeSeason = await db.arenaSeason.findFirst({
      where: { isActive: true },
    });

    // If no active season exists, auto-initialize Season 1 starting June 1, 2026
    if (!activeSeason) {
      activeSeason = await db.arenaSeason.create({
        data: {
          seasonNumber: 1,
          startDate: new Date('2026-06-01T00:00:00Z'),
          endDate: new Date('2026-06-29T00:00:00Z'),
          isActive: true,
          isCompleted: false,
        },
      });
    }

    // Fetch all participants for this season
    const participants = await db.arenaParticipant.findMany({
      where: { seasonId: activeSeason.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        avgReturnPct: 'desc',
      },
    });

    // Fetch details for the logged-in user's entry in this season (if any)
    const userEntry = await db.arenaParticipant.findFirst({
      where: {
        seasonId: activeSeason.id,
        userId: userId,
      },
      include: {
        dailyHistory: {
          orderBy: { date: 'asc' },
        },
      },
    });

    return NextResponse.json({
      activeSeason,
      participants: participants.map(p => ({
        id: p.id,
        userId: p.userId,
        name: p.user.name || p.user.email?.split('@')[0] || 'Trader',
        tier: p.tier,
        budget: p.budget,
        tickers: p.tickers.split(','),
        allocations: JSON.parse(p.allocationsJSON || '{}'),
        currentPrices: JSON.parse(p.currentPricesJSON || '{}'),
        entryPrices: JSON.parse(p.entryPricesJSON || '{}'),
        portfolioValue: p.portfolioValue,
        avgReturnPct: p.avgReturnPct,
        hasPaid: p.hasPaid,
      })),
      userEntry: userEntry ? {
        id: userEntry.id,
        tier: userEntry.tier,
        budget: userEntry.budget,
        tickers: userEntry.tickers.split(','),
        allocations: JSON.parse(userEntry.allocationsJSON || '{}'),
        currentPrices: JSON.parse(userEntry.currentPricesJSON || '{}'),
        entryPrices: JSON.parse(userEntry.entryPricesJSON || '{}'),
        portfolioValue: userEntry.portfolioValue,
        avgReturnPct: userEntry.avgReturnPct,
        hasPaid: userEntry.hasPaid,
        dailyHistory: userEntry.dailyHistory,
      } : null,
      currentUser: {
        realBalance: currentUser.realBalance,
        arenaTier: currentUser.arenaTier,
        hasFreeEntry: currentUser.hasFreeEntry,
      }
    });
  } catch (error: any) {
    console.error('Active arena fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch active arena data' }, { status: 500 });
  }
}
