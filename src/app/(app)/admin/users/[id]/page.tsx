import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, User, Mail, Shield, Star, BookMarked, Calendar } from "lucide-react"
import { AdminUserEditor } from "@/components/admin/AdminUserEditor"

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") redirect("/dashboard")

  const { id } = await params

  const user = await db.user.findUnique({
    where: { id },
    include: {
      watchlist: { orderBy: { addedAt: "desc" } },
      _count: { select: { watchlist: true } },
    },
  })

  if (!user) notFound()

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <Link href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-alpha-blue/20 border border-accent/20 flex items-center justify-center text-xl font-black text-accent font-display">
          {(user.name?.[0] || user.email?.[0] || "?").toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-black text-foreground font-display">{user.name || "Unnamed User"}</h1>
          <p className="text-sm text-muted font-mono">{user.email}</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Role", value: user.role, icon: Shield, color: user.role === "ADMIN" ? "#8B5CF6" : "#8892A4" },
          { label: "Plan", value: user.plan, icon: Star, color: user.plan === "elite" ? "#F5A623" : user.plan === "pro" ? "#3B82F6" : "#8892A4" },
          { label: "Watchlist", value: `${user._count.watchlist} items`, icon: BookMarked, color: "#00D97E" },
          { label: "Joined", value: new Date(user.createdAt).toLocaleDateString(), icon: Calendar, color: "#3B82F6" },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="stat-card flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${stat.color}12`, border: `1px solid ${stat.color}20` }}>
                <Icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-[9px] text-muted-2 uppercase tracking-wider font-display">{stat.label}</p>
                <p className="text-sm font-bold font-mono" style={{ color: stat.color }}>{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit Form */}
      <AdminUserEditor
        userId={user.id}
        initialName={user.name ?? ""}
        initialEmail={user.email ?? ""}
        initialRole={user.role}
        initialPlan={user.plan}
      />

      {/* Watchlist */}
      {user.watchlist.length > 0 && (
        <div className="stat-card space-y-3">
          <h3 className="text-sm font-bold text-foreground font-display flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-accent" />
            Watchlist ({user._count.watchlist} items)
          </h3>
          <div className="flex flex-wrap gap-2">
            {user.watchlist.map(item => (
              <Link key={item.id} href={`/stock/${item.symbol}`}
                className="px-3 py-1.5 rounded-xl bg-surface-2/40 border border-white/[0.04] hover:border-accent/15 text-xs font-mono font-bold text-foreground hover:text-accent transition-all">
                {item.symbol}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
