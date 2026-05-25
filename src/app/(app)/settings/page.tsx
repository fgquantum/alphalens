import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Settings, Bell, User, Shield, BookMarked, MessageSquare, Star, Zap, Crown } from "lucide-react"
import { ProfileEditor } from "@/components/dashboard/ProfileEditor"
import { AlertsManager } from "@/components/settings/AlertsManager"
import { SignOutButton } from "@/components/dashboard/SignOutButton"

const PLAN_LIMITS = {
  free:  { watchlist: 30,  alerts: 5,   aiChat: 20,  label: "Free",  color: "#8892A4" },
  pro:   { watchlist: 500, alerts: 50,  aiChat: 200, label: "Pro",   color: "#3B82F6" },
  elite: { watchlist: -1,  alerts: -1,  aiChat: -1,  label: "Elite", color: "#F5A623" },
}

const fmt = (v: number) => v === -1 ? "Unlimited" : v.toString()

export default async function SettingsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const { user } = session
  const plan = (user.plan ?? "free") as keyof typeof PLAN_LIMITS
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free

  const [dbUser, watchlistCount, alertCount] = await Promise.all([
    db.user.findUnique({ where: { id: user.id! }, select: { createdAt: true, name: true } }),
    db.watchlistItem.count({ where: { userId: user.id! } }),
    db.alert.count({ where: { userId: user.id!, isActive: true } }),
  ])

  const alerts = await db.alert.findMany({
    where: { userId: user.id! },
    orderBy: { createdAt: "desc" },
  })

  const PlanIcon = plan === "elite" ? Crown : plan === "pro" ? Zap : Star

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-alpha-purple/10 border border-alpha-purple/15 flex items-center justify-center">
            <Settings className="w-5 h-5 text-alpha-purple" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground font-display tracking-tight">Settings</h1>
            <p className="text-xs text-muted mt-0.5">Manage your account, alerts, and preferences</p>
          </div>
        </div>
        <SignOutButton />
      </div>

      {/* Profile */}
      <div className="stat-card space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-2" />
          <h3 className="text-sm font-bold text-foreground font-display">Profile</h3>
        </div>

        <ProfileEditor initialName={user.name ?? ""} />

        <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
          <span className="text-xs text-muted-2 font-display uppercase tracking-wider">Email</span>
          <span className="text-sm text-foreground font-mono">{user.email}</span>
        </div>
        <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
          <span className="text-xs text-muted-2 font-display uppercase tracking-wider">Member Since</span>
          <span className="text-sm text-foreground font-mono">
            {dbUser?.createdAt ? new Date(dbUser.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-xs text-muted-2 font-display uppercase tracking-wider">Role</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
            user.role === "ADMIN"
              ? "bg-alpha-purple/10 text-alpha-purple border border-alpha-purple/20"
              : "bg-surface-2 text-muted border border-white/[0.06]"
          }`}>
            {user.role ?? "USER"}
          </span>
        </div>
      </div>

      {/* Plan & Usage */}
      <div className="stat-card space-y-4">
        <div className="flex items-center gap-2">
          <PlanIcon className="w-4 h-4" style={{ color: limits.color }} />
          <h3 className="text-sm font-bold text-foreground font-display">Plan & Usage</h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded-lg ml-auto"
            style={{ background: `${limits.color}12`, color: limits.color, border: `1px solid ${limits.color}25` }}>
            {limits.label}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Watchlist", used: watchlistCount, max: limits.watchlist, icon: BookMarked, color: "#00D97E" },
            { label: "Active Alerts", used: alertCount, max: limits.alerts, icon: Bell, color: "#F5A623" },
            { label: "AI Chat / day", used: 0, max: limits.aiChat, icon: MessageSquare, color: "#8B5CF6" },
          ].map(item => {
            const Icon = item.icon
            const pct = item.max === -1 ? 0 : Math.min(100, (item.used / item.max) * 100)
            return (
              <div key={item.label} className="p-3 rounded-xl bg-surface-2/30 border border-white/[0.04] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                    <span className="text-xs text-muted font-display">{item.label}</span>
                  </div>
                  <span className="text-xs font-mono text-muted-2">
                    {item.used} / {fmt(item.max)}
                  </span>
                </div>
                {item.max !== -1 && (
                  <div className="h-1 rounded-full bg-surface-3/40 overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: pct > 80 ? "#FF4D6D" : item.color }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="p-3 rounded-xl bg-accent/[0.04] border border-accent/10">
          <p className="text-xs text-muted leading-relaxed">
            <span className="text-accent font-semibold">AlphaLens is 100% free.</span> All features are included on the free plan. Pro and Elite plans offer expanded limits for power users.
          </p>
        </div>
      </div>

      {/* Alerts */}
      <AlertsManager
        initialAlerts={alerts.map(a => ({
          id: a.id,
          symbol: a.symbol,
          type: a.type,
          targetValue: a.targetValue,
          isActive: a.isActive,
          triggeredAt: a.triggeredAt?.toISOString() ?? null,
          createdAt: a.createdAt.toISOString(),
        }))}
        limit={limits.alerts}
        currentCount={alertCount}
      />

      {/* Security */}
      <div className="stat-card space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-muted-2" />
          <h3 className="text-sm font-bold text-foreground font-display">Security</h3>
        </div>
        <div className="p-3 rounded-xl bg-surface-2/30 border border-white/[0.04]">
          <p className="text-xs text-muted leading-relaxed">
            Your password is securely hashed with bcrypt. To change your password, sign out and use the forgot password flow on the login page.
          </p>
        </div>
        <div className="flex justify-end">
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}
