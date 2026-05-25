"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Users, Settings, Database,
  ShieldAlert, ArrowLeft, Activity, BarChart3
} from "lucide-react"

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/stats", label: "Analytics", icon: BarChart3 },
  { href: "/admin/database", label: "Database", icon: Database },
  { href: "/admin/logs", label: "System Logs", icon: Activity },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]


export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 bg-surface/60 border-r border-white/[0.04] flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-5 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-alpha-purple/15 border border-alpha-purple/25 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-alpha-purple" />
          </div>
          <div>
            <p className="text-sm font-black text-foreground font-display">Admin Panel</p>
            <p className="text-[10px] text-muted-2">Full control</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(item => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12.5px] font-medium transition-all ${
                isActive
                  ? "bg-alpha-purple/10 text-alpha-purple border border-alpha-purple/15"
                  : "text-muted hover:text-foreground hover:bg-white/[0.03] border border-transparent"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-alpha-purple" : "text-muted-2"}`} />
              <span className="font-display">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/[0.04]">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12.5px] font-medium text-muted hover:text-foreground hover:bg-white/[0.03] transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-muted-2" />
          <span className="font-display">Back to App</span>
        </Link>
      </div>
    </aside>
  )
}
