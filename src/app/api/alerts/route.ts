import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

const ALERT_LIMITS: Record<string, number> = { free: 5, pro: 50, elite: -1 }

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const alerts = await db.alert.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(alerts)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { symbol, type, targetValue } = await req.json()
  if (!symbol || !type || targetValue === undefined) {
    return NextResponse.json({ error: "symbol, type, and targetValue required" }, { status: 400 })
  }

  const validTypes = ["price_above", "price_below", "alpha_change", "volume_spike"]
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid alert type" }, { status: 400 })
  }

  const plan = session.user.plan ?? "free"
  const limit = ALERT_LIMITS[plan] ?? 5
  if (limit > 0) {
    const count = await db.alert.count({ where: { userId: session.user.id, isActive: true } })
    if (count >= limit) {
      return NextResponse.json({ error: `Alert limit reached (${limit} for ${plan} plan)` }, { status: 403 })
    }
  }

  const alert = await db.alert.create({
    data: {
      userId: session.user.id,
      symbol: symbol.toUpperCase(),
      type,
      targetValue: parseFloat(targetValue),
    },
  })
  return NextResponse.json(alert)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  await db.alert.deleteMany({ where: { id, userId: session.user.id } })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, isActive } = await req.json()
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const alert = await db.alert.updateMany({
    where: { id, userId: session.user.id },
    data: { isActive },
  })
  return NextResponse.json(alert)
}
