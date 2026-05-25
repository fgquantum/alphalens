"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-2/60 border border-white/[0.06] hover:border-bear/20 hover:bg-bear/5 text-muted hover:text-bear transition-all text-xs font-medium font-display"
    >
      <LogOut className="w-3.5 h-3.5" />
      Sign Out
    </button>
  )
}
