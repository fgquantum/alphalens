import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Mail, Shield, Sparkles, ArrowRight, Star,
  SlidersHorizontal, Trophy, Globe, Briefcase, Swords,
  Layers, ArrowLeftRight, BookMarked, Crown, Zap, Calendar
} from "lucide-react"
import { WatchlistSection } from "@/components/dashboard/WatchlistSection"
import { SignOutButton } from "@/components/dashboard/SignOutButton"
import { ProfileEditor } from "@/components/dashboard/ProfileEditor"
import { getSystemSetting } from "@/lib/settings"

const PLAN_CONFIG = {
  free: {
    label: "Free",
    color: "#8892A4",
    bg: "bg-surface-2",
    border: "border-white/[0.06]",
    icon: Star,
    description: "Full access to all tools",
    limits: [
      ["Watchlist", "30 tickers"],
      ["Screener presets", "8 presets"],
      ["AI Analysis", "Included"],
      ["All 12 Algorithms", "Included"],
    ],
  },
  pro: {
    label: "Pro",
    color: "#3B82F6",
    bg: "bg-alpha-blue/10",
    border: "border-alpha-blue/20",
    icon: Zap,
    description: "Enhanced limits & priority data",
    limits: [
      ["Watchlist", "500 tickers"],
      ["Screener presets", "Unlimited"],
      ["AI Analysis", "Priority"],
      ["All 12 Algorithms", "Included"],
    ],
  },
  elite: {
    label: "Elite",
    color: "#F5A623",
    bg: "bg-alpha-gold/10",
    border: "border-alpha-gold/20",
    icon: Crown,
    description: "Unlimited everything",
    limits: [
      ["Watchlist", "Unlimited"],
      ["Screener presets", "Unlimited"],
      ["AI Analysis", "Priority"],
      ["All 12 Algorithms", "Included"],
    ],
  },
}

const QUICK_LINKS = [
  { href: "/screener",    label: "Stock Screener",  desc: "55-metric institutional screener",    icon: SlidersHorizontal, color: "#00D97E" },
  { href: "/leaderboard", label: "Leaderboard",     desc: "Top gainers, losers, alpha leaders",  icon: Trophy,            color: "#F5A623" },
  { href: "/macro",       label: "Macro Dashboard", desc: "FRED indicators & regime detection",  icon: Globe,             color: "#3B82F6" },
  { href: "/portfolio",   label: "Portfolio Roast", desc: "Health score & risk analysis",        icon: Briefcase,         color: "#8B5CF6" },
  { href: "/battles",     label: "Stock Battles",   desc: "Head-to-head metric comparison",      icon: Swords,            color: "#FF4D6D" },
  { href: "/etf-overlap", label: "ETF X-Ray",       desc: "Holdings overlap analysis",           icon: Layers,            color: "#22C55E" },
  { href: "/compare",     label: "Stock Compare",   desc: "Side-by-side stock analysis",         icon: ArrowLeftRight,    color: "#F97316" },
  { href: "/watchlist",   label: "Full Watchlist",  desc: "Manage all your saved tickers",       icon: BookMarked,        color: "#00D97E" },
]

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const { user } = session
  const plan = (user.plan ?? "free") as keyof typeof PLAN_CONFIG
  const planConfig = PLAN_CONFIG[plan] || PLAN_CONFIG.free
  const PlanIcon = planConfig.icon

  // Fetch real user data from DB (join date + watchlist)
  const [dbUser, watchlistItems, announcement] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id! },
      select: { createdAt: true, name: true },
    }),
    db.watchlistItem.findMany({
      where: { userId: user.id! },
      orderBy: { addedAt: "desc" },
      take: 12,
    }),
    getSystemSetting("DASHBOARD_ANNOUNCEMENT", ""),
  ])

  const joinDate = dbUser?.createdAt
    ? new Date(dbUser.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—"

  const initials = user.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? "U"

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">

      {/* ── Announcement Banner ── */}
      {announcement && (
        <div className="p-4 rounded-2xl bg-alpha-purple/10 border border-alpha-purple/20 text-alpha-purple flex items-center gap-3 shadow-lg select-text">
          <Sparkles className="w-4 h-4 text-alpha-purple shrink-0 animate-pulse" />
          <p className="text-xs sm:text-sm font-semibold leading-relaxed">{announcement}</p>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-alpha-blue/20 border border-accent/20 flex items-center justify-center text-xl font-black text-accent font-display">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground font-display tracking-tight">
              {user.name ? `Hey, ${user.name.split(" ")[0]}` : "Your Dashboard"}
            </h1>
            <p className="text-sm text-muted mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${planConfig.bg} border ${planConfig.border}`}>
            <PlanIcon className="w-3.5 h-3.5" style={{ color: planConfig.color }} />
            <span className="text-xs font-bold font-display" style={{ color: planConfig.color }}>
              {planConfig.label}
            </span>
          </div>
          {user.role === "ADMIN" && (
            <Link href="/admin"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-alpha-purple/10 border border-alpha-purple/20 hover:bg-alpha-purple/15 transition-colors">
              <Shield className="w-3.5 h-3.5 text-alpha-purple" />
              <span className="text-xs font-bold text-alpha-purple font-display">Admin</span>
            </Link>
          )}
          <SignOutButton />
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Plan", value: planConfig.label,
            icon: PlanIcon, color: planConfig.color, href: null,
          },
          {
            label: "Watchlist", value: `${watchlistItems.length} tickers`,
            icon: BookMarked, color: "#00D97E", href: "/watchlist",
          },
          {
            label: "Role", value: user.role ?? "USER",
            icon: Shield, color: user.role === "ADMIN" ? "#8B5CF6" : "#8892A4", href: null,
          },
          {
            label: "Member Since", value: joinDate,
            icon: Calendar, color: "#3B82F6", href: null,
          },
        ].map((stat, i) => {
          const Icon = stat.icon
          const inner = (
            <div className={`stat-card flex items-center gap-3 ${stat.href ? "hover:-translate-y-0.5 transition-all cursor-pointer group" : ""}`}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${stat.color}12`, border: `1px solid ${stat.color}20` }}>
                <Icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-muted-2 uppercase tracking-wider font-display">{stat.label}</p>
                <p className="text-sm font-bold font-mono truncate" style={{ color: stat.color }}>{stat.value}</p>
              </div>
              {stat.href && <ArrowRight className="w-3.5 h-3.5 text-muted-2 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
          )
          return stat.href
            ? <Link key={i} href={stat.href}>{inner}</Link>
            : <div key={i}>{inner}</div>
        })}
      </div>

      {/* ── Account Details + Plan ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Account Info — with editable name */}
        <div className="stat-card space-y-1">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-bold text-foreground font-display">Account Details</h3>
          </div>

          {/* Editable name */}
          <ProfileEditor initialName={user.name ?? ""} />

          <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
            <span className="text-xs text-muted-2 font-display uppercase tracking-wider">Email</span>
            <span className="text-sm text-foreground font-medium flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-muted-2" />
              {user.email}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
            <span className="text-xs text-muted-2 font-display uppercase tracking-wider">Role</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
              user.role === "ADMIN"
                ? "bg-alpha-purple/10 text-alpha-purple border border-alpha-purple/20"
                : "bg-surface-2 text-muted border border-white/[0.06]"
            }`}>
              {user.role ?? "USER"}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
            <span className="text-xs text-muted-2 font-display uppercase tracking-wider">Member Since</span>
            <span className="text-sm text-foreground font-mono">{joinDate}</span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs text-muted-2 font-display uppercase tracking-wider">Plan</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${planConfig.bg} border ${planConfig.border}`}
              style={{ color: planConfig.color }}>
              {planConfig.label}
            </span>
          </div>
        </div>

        {/* Plan Card */}
        <div className="stat-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] pointer-events-none"
            style={{ background: `${planConfig.color}08` }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `${planConfig.color}12`, border: `1px solid ${planConfig.color}20` }}>
                <PlanIcon className="w-4 h-4" style={{ color: planConfig.color }} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground font-display">{planConfig.label} Plan</h3>
                <p className="text-[11px] text-muted">{planConfig.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {planConfig.limits.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-2/40 border border-white/[0.04]">
                  <span className="text-muted-2">{k}</span>
                  <span className="font-semibold" style={{ color: planConfig.color }}>{v}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/[0.04] border border-accent/10 mt-3">
              <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
              <p className="text-[11px] text-muted">
                AlphaLens is <span className="text-accent font-semibold">100% free</span>. All tools included, no credit card needed.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Live Watchlist ── */}
      <WatchlistSection initialItems={watchlistItems.map(w => w.symbol)} />

      {/* ── Quick Access Grid ── */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-foreground font-display uppercase tracking-wider">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group stat-card flex items-start gap-3 hover:-translate-y-0.5 transition-all"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105"
                  style={{ background: `${link.color}12`, border: `1px solid ${link.color}20` }}>
                  <Icon className="w-4 h-4" style={{ color: link.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground font-display group-hover:text-accent transition-colors">{link.label}</p>
                  <p className="text-[10px] text-muted mt-0.5 leading-relaxed">{link.desc}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-2 shrink-0 ml-auto mt-0.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
