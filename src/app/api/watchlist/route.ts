import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const items = await db.watchlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: { addedAt: "desc" },
  })

  return NextResponse.json(items.map(i => i.symbol))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { symbol } = await req.json()
  if (!symbol || typeof symbol !== "string") {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 })
  }

  const sym = symbol.toUpperCase().trim()

  // Check plan limit (free = 30)
  const plan = session.user.plan ?? "free"
  const limit = plan === "free" ? 30 : plan === "pro" ? 500 : -1

  if (limit > 0) {
    const count = await db.watchlistItem.count({ where: { userId: session.user.id } })
    if (count >= limit) {
      return NextResponse.json({ error: `Watchlist limit reached (${limit} for ${plan} plan)` }, { status: 403 })
    }
  }

  try {
    await db.watchlistItem.create({
      data: { userId: session.user.id, symbol: sym },
    })
    return NextResponse.json({ success: true, symbol: sym })
  } catch {
    // Unique constraint = already exists
    return NextResponse.json({ error: "Already in watchlist" }, { status: 409 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get("symbol")?.toUpperCase()

  if (!symbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 })
  }

  await db.watchlistItem.deleteMany({
    where: { userId: session.user.id, symbol },
  })

  return NextResponse.json({ success: true })
}
