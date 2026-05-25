"use client"

import { ShieldAlert, RefreshCw } from "lucide-react"

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-warn/15 border border-warn/20 flex items-center justify-center animate-pulse">
          <ShieldAlert className="w-8 h-8 text-warn" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-foreground font-display tracking-tight">Under Maintenance</h1>
          <p className="text-sm text-muted leading-relaxed">
            AlphaLens is currently undergoing scheduled platform upgrades to improve execution speeds and enhance AI capabilities.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-surface-2/40 border border-white/[0.04] text-xs text-muted-2 leading-relaxed">
          Admin access remains open. If you are an administrator, please sign in via your credentials to access control channels.
        </div>
        <div className="pt-4">
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-white/[0.06] text-xs font-bold transition-all text-muted hover:text-foreground cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Check Connection
          </button>
        </div>
      </div>
    </div>
  )
}
