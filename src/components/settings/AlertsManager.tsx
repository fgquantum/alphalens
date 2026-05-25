"use client"

import { useState, useTransition } from "react"
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, AlertCircle, CheckCircle2, TrendingUp, TrendingDown, Activity, Zap } from "lucide-react"

interface Alert {
  id: string
  symbol: string
  type: string
  targetValue: number
  isActive: boolean
  triggeredAt: string | null
  createdAt: string
}

interface Props {
  initialAlerts: Alert[]
  limit: number
  currentCount: number
}

const ALERT_TYPES = [
  { value: "price_above", label: "Price Above", icon: TrendingUp, color: "#00D97E" },
  { value: "price_below", label: "Price Below", icon: TrendingDown, color: "#FF4D6D" },
  { value: "alpha_change", label: "AlphaScore Change", icon: Activity, color: "#8B5CF6" },
  { value: "volume_spike", label: "Volume Spike", icon: Zap, color: "#F5A623" },
]

export function AlertsManager({ initialAlerts, limit, currentCount }: Props) {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts)
  const [symbol, setSymbol] = useState("")
  const [type, setType] = useState("price_above")
  const [targetValue, setTargetValue] = useState("")
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isPending, startTransition] = useTransition()

  const activeCount = alerts.filter(a => a.isActive).length
  const atLimit = limit !== -1 && activeCount >= limit

  const addAlert = async () => {
    if (!symbol.trim() || !targetValue) return
    setAdding(true)
    setError("")
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbol.toUpperCase(), type, targetValue: parseFloat(targetValue) }),
      })
      const data = await res.json()
      if (res.ok) {
        setAlerts(prev => [data, ...prev])
        setSymbol("")
        setTargetValue("")
        setSuccess("Alert created")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(data.error || "Failed to create alert")
      }
    } catch {
      setError("Network error")
    }
    setAdding(false)
  }

  const deleteAlert = async (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
    try {
      await fetch(`/api/alerts?id=${id}`, { method: "DELETE" })
    } catch {
      // silent
    }
  }

  const toggleAlert = async (id: string, isActive: boolean) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isActive } : a))
    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      })
    } catch {
      // revert
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, isActive: !isActive } : a))
    }
  }

  const typeConfig = (t: string) => ALERT_TYPES.find(x => x.value === t) ?? ALERT_TYPES[0]

  return (
    <div className="stat-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-warn" />
          <h3 className="text-sm font-bold text-foreground font-display">Price Alerts</h3>
          <span className="text-[10px] text-muted-2 font-mono bg-surface-2/60 px-1.5 py-0.5 rounded-md border border-white/[0.04]">
            {activeCount} / {limit === -1 ? "∞" : limit} active
          </span>
        </div>
      </div>

      {/* Status messages */}
      {success && (
        <div className="flex items-center gap-2 bg-bull/8 border border-bull/20 text-bull px-3 py-2 rounded-xl text-xs">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-bear/8 border border-bear/20 text-bear px-3 py-2 rounded-xl text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}

      {/* Add alert form */}
      {!atLimit ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            type="text"
            value={symbol}
            onChange={e => setSymbol(e.target.value.toUpperCase().replace(/[^A-Z0-9.-]/g, ""))}
            placeholder="Ticker (AAPL)"
            className="bg-surface-2/60 border border-white/[0.06] rounded-xl py-2.5 px-3 text-sm font-mono text-foreground placeholder:text-muted-2 placeholder:font-sans outline-none focus:border-accent/40 transition-all"
            maxLength={10}
          />
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="bg-surface-2/60 border border-white/[0.06] rounded-xl py-2.5 px-3 text-sm text-muted outline-none focus:border-accent/40 transition-all cursor-pointer font-display"
          >
            {ALERT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <input
            type="number"
            value={targetValue}
            onChange={e => setTargetValue(e.target.value)}
            placeholder={type.includes("price") ? "Price ($)" : type === "alpha_change" ? "Score (0-100)" : "Multiplier (2x)"}
            className="bg-surface-2/60 border border-white/[0.06] rounded-xl py-2.5 px-3 text-sm font-mono text-foreground placeholder:text-muted-2 placeholder:font-sans outline-none focus:border-accent/40 transition-all"
            step="0.01"
          />
          <button
            onClick={addAlert}
            disabled={adding || !symbol.trim() || !targetValue}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-warn/10 border border-warn/20 text-warn hover:bg-warn/15 transition-all text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            {adding ? "..." : "Add Alert"}
          </button>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-warn/8 border border-warn/15 text-xs text-warn">
          Alert limit reached ({limit} active alerts on {limit === 5 ? "free" : "pro"} plan). Delete an alert to add a new one.
        </div>
      )}

      {/* Alert list */}
      {alerts.length === 0 ? (
        <div className="py-8 text-center">
          <Bell className="w-8 h-8 text-muted-2 mx-auto mb-2" />
          <p className="text-sm text-muted">No alerts set</p>
          <p className="text-xs text-muted-2 mt-1">Add a ticker above to get notified when conditions are met</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => {
            const cfg = typeConfig(alert.type)
            const Icon = cfg.icon
            return (
              <div key={alert.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  alert.isActive
                    ? "bg-surface-2/30 border-white/[0.04]"
                    : "bg-surface-2/10 border-white/[0.02] opacity-60"
                }`}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}20` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-foreground">{alert.symbol}</span>
                    <span className="text-[10px] text-muted font-display">{cfg.label}</span>
                    <span className="text-[10px] font-mono font-bold" style={{ color: cfg.color }}>
                      {alert.type.includes("price") ? `$${alert.targetValue.toFixed(2)}` : alert.targetValue}
                    </span>
                  </div>
                  {alert.triggeredAt && (
                    <p className="text-[10px] text-warn mt-0.5">
                      Triggered {new Date(alert.triggeredAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleAlert(alert.id, !alert.isActive)}
                    className="text-muted-2 hover:text-accent transition-colors">
                    {alert.isActive
                      ? <ToggleRight className="w-5 h-5 text-accent" />
                      : <ToggleLeft className="w-5 h-5" />
                    }
                  </button>
                  <button onClick={() => deleteAlert(alert.id)}
                    className="text-muted-2 hover:text-bear transition-colors p-0.5">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
