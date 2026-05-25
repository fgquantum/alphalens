import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Users, Database, Activity, ShieldAlert,
  TrendingUp, Star, Zap, Crown, ArrowRight, Settings
} from "lucide-react"

export default async function AdminOverview() {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") redirect("/dashboard")

  const [totalUsers, recentUsers, planCounts, roleCounts] = await Promise.all([
    db.user.count(),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, email: true, role: true, plan: true, createdAt: true },
    }),
    db.user.groupBy({ by: ["plan"], _count: { plan: true } }),
    db.user.groupBy({ by: ["role"], _count: { role: true } }),
  ])

  const watchlistTotal = await db.watchlistItem.count()

  const planMap = Object.fromEntries(planCounts.map(p => [p.plan, p._count.plan]))
  const roleMap = Object.fromEntries(roleCounts.map(r => [r.role, r._count.role]))

  const PLAN_COLORS: Record<string, string> = {
    free: "#8892A4", pro: "#3B82F6", elite: "#F5A623"
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <ShieldAlert className="w-5 h-5 text-alpha-purple" />
            <h1 className="text-2xl font-black text-foreground font-display tracking-tight">Admin Overview</h1>
          </div>
          <p className="text-sm text-muted">Logged in as <span className="text-foreground font-medium">{session.user.email}</span></p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-alpha-purple/10 border border-alpha-purple/20">
          <span className="w-1.5 h-1.5 rounded-full bg-alpha-purple animate-pulse" />
          <span className="text-xs font-bold text-alpha-purple font-display">System Active</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: totalUsers, icon: Users, color: "#3B82F6", href: "/admin/users" },
          { label: "Watchlist Items", value: watchlistTotal, icon: Activity, color: "#00D97E", href: null },
          { label: "Admin Accounts", value: roleMap["ADMIN"] ?? 0, icon: ShieldAlert, color: "#8B5CF6", href: "/admin/users" },
          { label: "DB Status", value: "Healthy", icon: Database, color: "#22C55E", href: null },
        ].map((stat, i) => {
          const Icon = stat.icon
          const card = (
            <div className="stat-card flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${stat.color}12`, border: `1px solid ${stat.color}20` }}>
                <Icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-muted-2 uppercase tracking-wider font-display">{stat.label}</p>
                <p className="text-xl font-black font-mono" style={{ color: stat.color }}>{stat.value}</p>
              </div>
              {stat.href && <ArrowRight className="w-4 h-4 text-muted-2 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
          )
          return stat.href ? (
            <Link key={i} href={stat.href}>{card}</Link>
          ) : (
            <div key={i}>{card}</div>
          )
        })}
      </div>

      {/* Plan Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="stat-card space-y-4">
          <h3 className="text-sm font-bold text-foreground font-display flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" /> Plan Distribution
          </h3>
          <div className="space-y-3">
            {[
              { plan: "free", label: "Free", icon: Star },
              { plan: "pro", label: "Pro", icon: Zap },
              { plan: "elite", label: "Elite", icon: Crown },
            ].map(({ plan, label, icon: Icon }) => {
              const count = planMap[plan] ?? 0
              const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0
              const color = PLAN_COLORS[plan]
              return (
                <div key={plan} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium" style={{ color }}>
                      <Icon className="w-3 h-3" /> {label}
                    </span>
                    <span className="font-mono text-muted">{count} users ({pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-3/40 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="stat-card space-y-3">
          <h3 className="text-sm font-bold text-foreground font-display">Quick Actions</h3>
          {[
            { href: "/admin/users", label: "Manage Users", desc: "Edit roles, plans, and accounts", icon: Users, color: "#3B82F6" },
            { href: "/admin/stats", label: "View Analytics", desc: "Usage stats and growth metrics", icon: Activity, color: "#00D97E" },
            { href: "/admin/database", label: "Database Console", desc: "Run raw SQL queries and schemas", icon: Database, color: "#10B981" },
            { href: "/admin/logs", label: "System Audit Logs", desc: "Monitor and search admin event logs", icon: Activity, color: "#F59E0B" },
            { href: "/admin/settings", label: "Site Settings", desc: "Feature flags and system variables", icon: Settings, color: "#8B5CF6" },
          ].map(item => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-2/30 border border-white/[0.04] hover:border-white/[0.08] hover:-translate-y-0.5 transition-all group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${item.color}12`, border: `1px solid ${item.color}20` }}>
                  <Icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors font-display">{item.label}</p>
                  <p className="text-[10px] text-muted">{item.desc}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Users */}
      <div className="stat-card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
          <h3 className="text-sm font-bold text-foreground font-display">Recent Registrations</h3>
          <Link href="/admin/users" className="text-xs text-accent hover:text-accent-light flex items-center gap-1 transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Plan</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted text-sm">No users yet</td>
                </tr>
              ) : recentUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-surface-3/40 flex items-center justify-center text-[11px] font-black text-accent border border-white/[0.04]">
                        {(user.name?.[0] || user.email?.[0] || "?").toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-foreground">{user.name || "—"}</span>
                    </div>
                  </td>
                  <td className="text-muted text-xs font-mono">{user.email}</td>
                  <td>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                      user.role === "ADMIN"
                        ? "bg-alpha-purple/10 text-alpha-purple border border-alpha-purple/20"
                        : "bg-surface-2 text-muted border border-white/[0.04]"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-surface-2 border border-white/[0.04]"
                      style={{ color: PLAN_COLORS[user.plan] ?? "#8892A4" }}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="text-muted text-xs font-mono">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <Link href={`/admin/users/${user.id}`}
                      className="text-[11px] text-accent hover:text-accent-light font-medium transition-colors">
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
