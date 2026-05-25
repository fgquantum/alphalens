import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Activity, ShieldAlert, Trash2, Search, Filter, AlertCircle, Info, Calendar } from "lucide-react"
import { clearSystemLogsAction } from "@/app/actions/admin"
import { revalidatePath } from "next/cache"

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; level?: string; action?: string; page?: string }>
}) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") redirect("/dashboard")

  const params = await searchParams
  const q = params.q ?? ""
  const levelFilter = params.level ?? ""
  const actionFilter = params.action ?? ""
  const page = Math.max(1, parseInt(params.page ?? "1"))
  const perPage = 30

  const where = {
    ...(q ? {
      OR: [
        { message: { contains: q } },
        { action: { contains: q } },
      ]
    } : {}),
    ...(levelFilter ? { level: levelFilter } : {}),
    ...(actionFilter ? { action: actionFilter } : {}),
  }

  const [logs, total, actionsList] = await Promise.all([
    db.systemLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.systemLog.count({ where }),
    // Get unique actions for filter list
    db.systemLog.groupBy({
      by: ["action"],
      _count: { action: true },
      where: { action: { not: null } }
    })
  ])

  const totalPages = Math.ceil(total / perPage)

  // Clear logs helper (Server Action handler for button)
  const handleClearLogs = async () => {
    "use server"
    await clearSystemLogsAction()
    revalidatePath("/admin/logs")
  }

  const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string; icon: any }> = {
    info: { bg: "bg-bull/8", text: "text-bull", border: "border-bull/20", icon: Info },
    warn: { bg: "bg-warn/8", text: "text-warn", border: "border-warn/20", icon: AlertCircle },
    error: { bg: "bg-bear/8", text: "text-bear", border: "border-bear/20", icon: ShieldAlert },
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-alpha-purple" />
          <h1 className="text-2xl font-black text-foreground font-display tracking-tight">System Logs</h1>
          <span className="text-xs font-mono text-muted bg-surface-2/60 px-2 py-0.5 rounded-lg border border-white/[0.04]">
            {total} logs
          </span>
        </div>

        {total > 0 && (
          <form action={handleClearLogs}>
            <button
              type="submit"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bear/10 border border-bear/15 hover:bg-bear/15 text-bear text-xs font-bold transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All Logs
            </button>
          </form>
        )}
      </div>

      {/* Filters Form */}
      <div className="stat-card p-4">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-muted-2 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search log messages..."
              className="w-full bg-surface-3/30 border border-white/[0.06] rounded-xl py-2 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-2 outline-none focus:border-accent/40 transition-all font-sans"
            />
          </div>

          <div>
            <select
              name="level"
              defaultValue={levelFilter}
              className="w-full bg-surface-3/30 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-muted outline-none focus:border-accent/40 transition-all"
            >
              <option value="">All Levels</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div className="flex gap-2">
            <select
              name="action"
              defaultValue={actionFilter}
              className="flex-1 bg-surface-3/30 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-muted outline-none focus:border-accent/40 transition-all"
            >
              <option value="">All Actions</option>
              {actionsList.map(a => (
                <option key={a.action} value={a.action || ""}>
                  {a.action}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-accent text-background font-bold text-xs hover:bg-accent-light transition-all flex items-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" />
              Apply
            </button>
          </div>
        </form>
      </div>

      {/* Logs Timeline */}
      <div className="stat-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs border-collapse">
            <thead className="bg-surface-3/30 text-muted uppercase tracking-wider text-[10px] font-bold font-display border-b border-white/[0.04]">
              <tr>
                <th className="px-5 py-3.5 w-24">Level</th>
                <th className="px-5 py-3.5 w-32">Action</th>
                <th className="px-5 py-3.5">Message</th>
                <th className="px-5 py-3.5 w-44">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-muted-2 text-sm font-medium">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-muted-2 opacity-50" />
                    No system events logged
                  </td>
                </tr>
              ) : (
                logs.map(log => {
                  const cfg = LEVEL_COLORS[log.level] || LEVEL_COLORS.info
                  const LogIcon = cfg.icon

                  return (
                    <tr key={log.id} className="hover:bg-white/[0.01] transition-colors select-text">
                      <td className="px-5 py-3.5 font-bold font-display">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          <LogIcon className="w-2.5 h-2.5" />
                          {log.level}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[10px] font-bold text-foreground">
                        {log.action || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-muted leading-relaxed font-sans font-medium text-xs break-all">
                        {log.message}
                        {log.userId && (
                          <span className="text-[10px] text-muted-2 block mt-0.5 font-mono">
                            User ID: {log.userId}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-muted-2 font-mono text-[10px] flex items-center gap-1.5 mt-1 sm:mt-0">
                        <Calendar className="w-3 h-3 text-muted-2" />
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04]">
            <span className="text-xs text-muted-2 font-mono">
              Page {page} of {totalPages} · {total} logs
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/admin/logs?q=${q}&level=${levelFilter}&action=${actionFilter}&page=${page - 1}`}
                  className="px-3 py-1.5 rounded-lg bg-surface-2/60 border border-white/[0.06] text-xs text-muted hover:text-foreground transition-colors">
                  ← Prev
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/admin/logs?q=${q}&level=${levelFilter}&action=${actionFilter}&page=${page + 1}`}
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
