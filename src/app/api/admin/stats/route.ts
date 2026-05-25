import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [totalUsers, newUsers30d, totalWatchlist, planCounts, roleCounts] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.watchlistItem.count(),
    db.user.groupBy({ by: ["plan"], _count: { plan: true } }),
    db.user.groupBy({ by: ["role"], _count: { role: true } }),
  ])

  return NextResponse.json({
    totalUsers,
    newUsers30d,
    totalWatchlist,
    plans: Object.fromEntries(planCounts.map(p => [p.plan, p._count.plan])),
    roles: Object.fromEntries(roleCounts.map(r => [r.role, r._count.role])),
  })
}
