"use client"

import { useRouter, usePathname } from "next/navigation"
import { useState, useTransition } from "react"
import { Search, X } from "lucide-react"

interface Props {
  initialQ: string
  initialRole: string
  initialPlan: string
}

export function AdminUserSearch({ initialQ, initialRole, initialPlan }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [q, setQ] = useState(initialQ)
  const [role, setRole] = useState(initialRole)
  const [plan, setPlan] = useState(initialPlan)

  const apply = (newQ = q, newRole = role, newPlan = plan) => {
    const params = new URLSearchParams()
    if (newQ) params.set("q", newQ)
    if (newRole) params.set("role", newRole)
    if (newPlan) params.set("plan", newPlan)
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const clear = () => {
    setQ(""); setRole(""); setPlan("")
    startTransition(() => router.push(pathname))
  }

  const hasFilters = q || role || plan

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-2" />
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && apply()}
          placeholder="Search name or email..."
          className="w-full bg-surface-2/60 border border-white/[0.06] rounded-xl py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-2 outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition-all"
        />
      </div>

      {/* Role filter */}
      <select
        value={role}
        onChange={e => { setRole(e.target.value); apply(q, e.target.value, plan) }}
        className="px-3 py-2.5 rounded-xl bg-surface-2/60 border border-white/[0.06] text-sm text-muted outline-none focus:border-accent/40 transition-all cursor-pointer font-display"
      >
        <option value="">All Roles</option>
        <option value="USER">User</option>
        <option value="ADMIN">Admin</option>
      </select>

      {/* Plan filter */}
      <select
        value={plan}
        onChange={e => { setPlan(e.target.value); apply(q, role, e.target.value) }}
        className="px-3 py-2.5 rounded-xl bg-surface-2/60 border border-white/[0.06] text-sm text-muted outline-none focus:border-accent/40 transition-all cursor-pointer font-display"
      >
        <option value="">All Plans</option>
        <option value="free">Free</option>
        <option value="pro">Pro</option>
        <option value="elite">Elite</option>
      </select>

      {/* Search button */}
      <button
        onClick={() => apply()}
        disabled={isPending}
        className="px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent hover:bg-accent/15 transition-all text-sm font-semibold disabled:opacity-50"
      >
        {isPending ? "..." : "Search"}
      </button>

      {/* Clear */}
      {hasFilters && (
        <button onClick={clear}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-surface-2/60 border border-white/[0.06] text-xs text-muted hover:text-foreground transition-all">
          <X className="w-3.5 h-3.5" /> Clear
        </button>
      )}
    </div>
  )
}
