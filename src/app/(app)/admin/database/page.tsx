import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Database } from "lucide-react"
import { AdminDatabaseConsole } from "@/components/admin/AdminDatabaseConsole"

export default async function AdminDatabasePage() {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") redirect("/dashboard")

  // Fetch counts for all main tables to display in sidebar
  const [
    users,
    watchlists,
    alerts,
    votes,
    settings,
    logs,
    accounts,
    sessions,
  ] = await Promise.all([
    db.user.count(),
    db.watchlistItem.count(),
    db.alert.count(),
    db.vote.count(),
    db.systemSetting.count(),
    db.systemLog.count(),
    db.account.count(),
    db.session.count(),
  ])

  const tables = [
    { name: "User", count: users },
    { name: "WatchlistItem", count: watchlists },
    { name: "Alert", count: alerts },
    { name: "Vote", count: votes },
    { name: "SystemSetting", count: settings },
    { name: "SystemLog", count: logs },
    { name: "Account", count: accounts },
    { name: "Session", count: sessions },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Database className="w-5 h-5 text-accent" />
        <h1 className="text-2xl font-black text-foreground font-display tracking-tight">Database Control</h1>
        <span className="text-xs font-mono text-muted bg-surface-2/60 px-2 py-0.5 rounded-lg border border-white/[0.04]">
          SQLite Engine
        </span>
      </div>

      <AdminDatabaseConsole tables={tables} />
    </div>
  )
}
