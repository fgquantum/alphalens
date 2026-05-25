import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { BarChart3, Users, BookMarked, TrendingUp, Calendar } from "lucide-react"

export default async function AdminStatsPage() {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") redirect("/dashboard")

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalUsers, newUsersLast30, newUsersLast7,
    totalWatchlist, planCounts, recentSignups,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    db.watchlistItem.count(),
    db.user.groupBy({ by: ["plan"], _count: { plan: true } }),
    // Last 14 days signups grouped by day
    db.user.findMany({
      where: { createdAt: { gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const planMap = Object.fromEntries(planCounts.map(p => [p.plan, p._count.plan]))

  // Build daily signup counts for last 14 days
  const dailyCounts: Record<string, number> = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    dailyCounts[key] = 0
  }
  recentSignups.forEach(u => {
    const key = new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    if (key in dailyCounts) dailyCounts[key]++
  })

  const maxCount = Math.max(...Object.values(dailyCounts), 1)

  const PLAN_COLORS: Record<string, string> = {
    free: "#8892A4", pro: "#3B82F6", elite: "#F5A623"
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center gap-2.5">
        <BarChart3 className="w-5 h-5 text-accent" />
        <h1 className="text-2xl font-black text-foreground font-display tracking-tight">Analytics</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: totalUsers, sub: "All time", icon: Users, color: "#3B82F6" },
          { label: "New (30d)", value: newUsersLast30, sub: "Last 30 days", icon: TrendingUp, color: "#00D97E" },
          { label: "New (7d)", value: newUsersLast7, sub: "Last 7 days", icon: Calendar, color: "#8B5CF6" },
          { label: "Watchlist Items", value: totalWatchlist, sub: "Total saved", icon: BookMarked, color: "#F5A623" },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-2 font-display uppercase tracking-wider">{stat.label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${stat.color}12`, border: `1px solid ${stat.color}20` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-3xl font-black font-mono" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[10px] text-muted-2 mt-1">{stat.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Signup Chart */}
      <div className="stat-card space-y-4">
        <h3 className="text-sm font-bold text-foreground font-display">Daily Signups — Last 14 Days</h3>
        <div className="flex items-end gap-1.5 h-32">
          {Object.entries(dailyCounts).map(([day, count]) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-1 group">
              <span className="text-[9px] text-muted-2 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                {count}
              </span>
              <div className="w-full rounded-t-sm transition-all"
                style={{
                  height: `${Math.max(4, (count / maxCount) * 96)}px`,
                  background: count > 0 ? "rgba(0,217,126,0.6)" : "rgba(255,255,255,0.04)",
                  border: count > 0 ? "1px solid rgba(0,217,126,0.3)" : "1px solid rgba(255,255,255,0.04)",
                }} />
              <span className="text-[8px] text-muted-2 font-mono rotate-45 origin-left whitespace-nowrap hidden md:block">
                {day}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Plan Breakdown */}
      <div className="stat-card space-y-4">
        <h3 className="text-sm font-bold text-foreground font-display">Plan Breakdown</h3>
        <div className="grid grid-cols-3 gap-4">
          {["free", "pro", "elite"].map(plan => {
            const count = planMap[plan] ?? 0
            const pct = totalUsers > 0 ? ((count / totalUsers) * 100).toFixed(1) : "0"
            const color = PLAN_COLORS[plan]
            return (
              <div key={plan} className="p-4 rounded-xl border text-center"
                style={{ background: `${color}06`, borderColor: `${color}20` }}>
                <p className="text-2xl font-black font-mono" style={{ color }}>{count}</p>
                <p className="text-xs font-bold font-display capitalize mt-1" style={{ color }}>{plan}</p>
                <p className="text-[10px] text-muted-2 mt-0.5">{pct}% of users</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
