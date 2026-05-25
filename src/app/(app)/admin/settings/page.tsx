import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Settings, Database, Key, Shield, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { getSystemSetting } from "@/lib/settings"
import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm"

export default async function AdminSettingsPage() {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") redirect("/dashboard")

  // Fetch stateful system settings
  const [maintenanceMode, allowSignups, announcement, aiModel] = await Promise.all([
    getSystemSetting("MAINTENANCE_MODE", "false"),
    getSystemSetting("ALLOW_SIGNUPS", "true"),
    getSystemSetting("DASHBOARD_ANNOUNCEMENT", ""),
    getSystemSetting("AI_MODEL", "llama-3.3-70b-versatile"),
  ])

  // Check which env vars are configured
  const envStatus = {
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    GROQ_API_KEY: !!process.env.GROQ_API_KEY,
    FINNHUB_API_KEY: !!process.env.FINNHUB_API_KEY,
    FRED_API_KEY: !!process.env.FRED_API_KEY,
    DATABASE_URL: !!process.env.DATABASE_URL,
  }

  const StatusIcon = ({ ok, warn }: { ok: boolean; warn?: boolean }) => {
    if (ok) return <CheckCircle2 className="w-4 h-4 text-bull" />
    if (warn) return <AlertCircle className="w-4 h-4 text-warn" />
    return <XCircle className="w-4 h-4 text-bear" />
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center gap-2.5">
        <Settings className="w-5 h-5 text-alpha-purple" />
        <h1 className="text-2xl font-black text-foreground font-display tracking-tight">Site Settings</h1>
      </div>

      {/* Stateful Config Form */}
      <AdminSettingsForm
        initialSettings={{
          MAINTENANCE_MODE: maintenanceMode,
          ALLOW_SIGNUPS: allowSignups,
          DASHBOARD_ANNOUNCEMENT: announcement,
          AI_MODEL: aiModel,
        }}
      />

      {/* Environment / API Keys */}
      <div className="stat-card space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-muted-2" />
          <h3 className="text-sm font-bold text-foreground font-display">Environment & API Keys</h3>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Configure these in your <code className="text-accent font-mono bg-surface-2/60 px-1.5 py-0.5 rounded">.env.local</code> file.
          Keys are never exposed to the client.
        </p>
        <div className="space-y-2">
          {[
            { key: "AUTH_SECRET", label: "Auth Secret", desc: "Required for NextAuth JWT signing", required: true },
            { key: "GROQ_API_KEY", label: "Groq API Key", desc: "Powers AI stock summaries and macro reports", required: false },
            { key: "FINNHUB_API_KEY", label: "Finnhub API Key", desc: "Fallback data provider for quotes and news", required: false },
            { key: "FRED_API_KEY", label: "FRED API Key", desc: "Federal Reserve macro economic data", required: false },
            { key: "DATABASE_URL", label: "Database URL", desc: "Prisma database connection string", required: true },
          ].map(item => {
            const ok = envStatus[item.key as keyof typeof envStatus]
            return (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-surface-2/30 border border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <StatusIcon ok={ok} warn={!ok && !item.required} />
                  <div>
                    <p className="text-sm font-mono font-semibold text-foreground">{item.key}</p>
                    <p className="text-[10px] text-muted">{item.desc}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                  ok
                    ? "bg-bull/10 text-bull border border-bull/20"
                    : item.required
                      ? "bg-bear/10 text-bear border border-bear/20"
                      : "bg-warn/10 text-warn border border-warn/20"
                }`}>
                  {ok ? "Configured" : item.required ? "Missing" : "Optional"}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Database Info */}
      <div className="stat-card space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-muted-2" />
          <h3 className="text-sm font-bold text-foreground font-display">Database Details</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Provider", value: "SQLite" },
            { label: "ORM", value: "Prisma v6" },
            { label: "Location", value: "prisma/dev.db" },
            { label: "Status", value: "Connected" },
          ].map(item => (
            <div key={item.label} className="p-3 rounded-xl bg-surface-2/30 border border-white/[0.04]">
              <p className="text-[9px] text-muted-2 uppercase tracking-wider font-display">{item.label}</p>
              <p className="text-sm font-mono font-semibold text-foreground mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Auth Config */}
      <div className="stat-card space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-muted-2" />
          <h3 className="text-sm font-bold text-foreground font-display">Authentication Info</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Provider", value: "NextAuth v5" },
            { label: "Strategy", value: "JWT" },
            { label: "Auth Method", value: "Credentials" },
            { label: "Password Hash", value: "bcrypt (10 rounds)" },
          ].map(item => (
            <div key={item.label} className="p-3 rounded-xl bg-surface-2/30 border border-white/[0.04]">
              <p className="text-[9px] text-muted-2 uppercase tracking-wider font-display">{item.label}</p>
              <p className="text-sm font-mono font-semibold text-foreground mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
