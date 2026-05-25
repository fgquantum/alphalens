import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

// GET /api/votes?symbol=AAPL — get vote counts + user's vote
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get("symbol")?.toUpperCase()
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 })

  const session = await auth()

  const [bullCount, bearCount, userVote] = await Promise.all([
    db.vote.count({ where: { symbol, vote: "bull" } }),
    db.vote.count({ where: { symbol, vote: "bear" } }),
    session?.user?.id
      ? db.vote.findUnique({ where: { userId_symbol: { userId: session.user.id, symbol } } })
      : null,
  ])

  return NextResponse.json({
    symbol,
    bull: bullCount,
    bear: bearCount,
    total: bullCount + bearCount,
    userVote: userVote?.vote ?? null,
  })
}

// POST /api/votes — cast or change vote
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to vote" }, { status: 401 })

  const { symbol, vote } = await req.json()
  if (!symbol || !["bull", "bear"].includes(vote)) {
    return NextResponse.json({ error: "symbol and vote (bull|bear) required" }, { status: 400 })
  }

  const sym = symbol.toUpperCase()

  // Upsert — user can change their vote
  await db.vote.upsert({
    where: { userId_symbol: { userId: session.user.id, symbol: sym } },
    create: { userId: session.user.id, symbol: sym, vote },
    update: { vote },
  })

  const [bull, bear] = await Promise.all([
    db.vote.count({ where: { symbol: sym, vote: "bull" } }),
    db.vote.count({ where: { symbol: sym, vote: "bear" } }),
  ])

  return NextResponse.json({ symbol: sym, bull, bear, total: bull + bear, userVote: vote })
}

// DELETE /api/votes?symbol=AAPL — remove vote
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get("symbol")?.toUpperCase()
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 })

  await db.vote.deleteMany({ where: { userId: session.user.id, symbol } })
  return NextResponse.json({ success: true })
}
