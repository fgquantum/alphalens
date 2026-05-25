import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Users, Search, ShieldAlert, Star, Zap, Crown, ArrowRight } from "lucide-react"
import { AdminUserSearch } from "@/components/admin/AdminUserSearch"

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; plan?: string; page?: string }>
}) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") redirect("/dashboard")

  const params = await searchParams
  const q = params.q ?? ""
  const roleFilter = params.role ?? ""
  const planFilter = params.plan ?? ""
  const page = Math.max(1, parseInt(params.page ?? "1"))
  const perPage = 20

  const where = {
    ...(q ? {
      OR: [
        { email: { contains: q } },
        { name: { contains: q } },
      ]
    } : {}),
    ...(roleFilter ? { role: roleFilter } : {}),
    ...(planFilter ? { plan: planFilter } : {}),
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true, name: true, email: true, role: true, plan: true,
        createdAt: true, updatedAt: true,
        _count: { select: { watchlist: true } },
      },
    }),
    db.user.count({ where }),
  ])

  const totalPages = Math.ceil(total / perPage)

  const PLAN_COLORS: Record<string, string> = {
    free: "#8892A4", pro: "#3B82F6", elite: "#F5A623"
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Users className="w-5 h-5 text-alpha-blue" />
          <h1 className="text-2xl font-black text-foreground font-display tracking-tight">User Management</h1>
          <span className="text-xs font-mono text-muted-2 bg-surface-2/60 px-2 py-0.5 rounded-lg border border-white/[0.04]">
            {total} total
          </span>
        </div>
      </div>

      {/* Search + Filters */}
      <AdminUserSearch initialQ={q} initialRole={roleFilter} initialPlan={planFilter} />

      {/* Table */}
      <div className="stat-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Plan</th>
                <th>Watchlist</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted">
                    <Search className="w-8 h-8 mx-auto mb-2 text-muted-2" />
                    <p className="text-sm">No users match your filters</p>
                  </td>
                </tr>
              ) : users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent/15 to-alpha-blue/15 flex items-center justify-center text-[11px] font-black text-accent border border-white/[0.04]">
                        {(user.name?.[0] || user.email?.[0] || "?").toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-foreground">{user.name || <span className="text-muted-2 italic">No name</span>}</span>
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
                  <td className="text-muted text-xs font-mono text-center">{user._count.watchlist}</td>
                  <td className="text-muted text-xs font-mono">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <Link href={`/admin/users/${user.id}`}
                      className="flex items-center gap-1 text-[11px] text-accent hover:text-accent-light font-medium transition-colors">
                      Edit <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04]">
            <span className="text-xs text-muted-2 font-mono">
              Page {page} of {totalPages} · {total} users
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/admin/users?q=${q}&role=${roleFilter}&plan=${planFilter}&page=${page - 1}`}
                  className="px-3 py-1.5 rounded-lg bg-surface-2/60 border border-white/[0.06] text-xs text-muted hover:text-foreground transition-colors">
                  ← Prev
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/admin/users?q=${q}&role=${roleFilter}&plan=${planFilter}&page=${page + 1}`}
                  className="px-3 py-1.5 rounded-lg bg-surface-2/60 border border-white/[0.06] text-xs text-muted hover:text-foreground transition-colors">
                  Next →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
