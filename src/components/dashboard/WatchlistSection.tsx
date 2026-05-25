"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { BookMarked, Plus, X, TrendingUp, TrendingDown, Search, RefreshCw, ExternalLink } from "lucide-react"

interface QuoteData {
  price: number
  change: number
  changePct: number
  name: string
}

interface WatchlistSectionProps {
  initialItems: string[]
}

export function WatchlistSection({ initialItems }: WatchlistSectionProps) {
  const [items, setItems] = useState<string[]>(initialItems)
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({})
  const [input, setInput] = useState("")
  const [adding, setAdding] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const fetchQuotes = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return
    try {
      const res = await fetch(`/api/bulk-quote?symbols=${symbols.join(",")}`)
      if (res.ok) {
        const data = await res.json()
        setQuotes(data)
      }
    } catch {
      // silent — prices are best-effort
    }
  }, [])

  // Load prices on mount and when items change
  useEffect(() => {
    fetchQuotes(items)
  }, [items, fetchQuotes])

  const refresh = async () => {
    setRefreshing(true)
    await fetchQuotes(items)
    setRefreshing(false)
  }

  const addSymbol = async () => {
    const sym = input.trim().toUpperCase()
    if (!sym || items.includes(sym)) { setInput(""); return }
    setAdding(true)
    setError("")
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: sym }),
      })
      if (res.ok) {
        setItems(prev => [sym, ...prev])
        setInput("")
        // Fetch quote for the new symbol
        fetchQuotes([sym])
      } else {
        const data = await res.json()
        setError(data.error || "Failed to add")
      }
    } catch {
      setError("Network error")
    }
    setAdding(false)
  }

  const removeSymbol = async (sym: string) => {
    // Optimistic remove
    setItems(prev => prev.filter(s => s !== sym))
    try {
      await fetch(`/api/watchlist?symbol=${sym}`, { method: "DELETE" })
    } catch {
      // Revert on failure
      setItems(prev => [sym, ...prev])
    }
  }

  const planLimit = 30 // free plan default shown in UI

  return (
    <div className="stat-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold text-foreground font-display">Watchlist</h3>
          <span className="text-[10px] text-muted-2 font-mono bg-surface-2/60 px-1.5 py-0.5 rounded-md border border-white/[0.04]">
            {items.length} / {planLimit}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={refreshing}
            className="p-1.5 rounded-lg text-muted-2 hover:text-accent hover:bg-accent/8 transition-all disabled:opacity-40"
            title="Refresh prices"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <Link href="/screener" className="text-[11px] text-accent hover:text-accent-light flex items-center gap-1 transition-colors">
            <TrendingUp className="w-3 h-3" /> Browse
          </Link>
        </div>
      </div>

      {/* Add input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-2" />
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase().replace(/[^A-Z0-9.-]/g, ""))}
            onKeyDown={e => e.key === "Enter" && addSymbol()}
            placeholder="Add ticker (AAPL, NVDA...)"
            className="w-full bg-surface-2/60 border border-white/[0.06] rounded-xl py-2.5 pl-9 pr-4 text-sm font-mono text-foreground placeholder:text-muted-2 placeholder:font-sans outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition-all"
            maxLength={10}
          />
        </div>
        <button
          onClick={addSymbol}
          disabled={adding || !input.trim()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent hover:bg-accent/15 transition-all text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          {adding ? "..." : "Add"}
        </button>
      </div>

      {error && <p className="text-xs text-bear">{error}</p>}

      {/* Watchlist items */}
      {items.length === 0 ? (
        <div className="py-10 text-center">
          <BookMarked className="w-8 h-8 text-muted-2 mx-auto mb-2" />
          <p className="text-sm text-muted">Your watchlist is empty</p>
          <p className="text-xs text-muted-2 mt-1">Add tickers above to track live prices here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {items.map(sym => {
            const q = quotes[sym]
            const isUp = q ? q.changePct >= 0 : null
            return (
              <div
                key={sym}
                className="group flex items-center justify-between px-3 py-2.5 rounded-xl bg-surface-2/40 border border-white/[0.04] hover:border-accent/15 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-surface-3/40 flex items-center justify-center text-[10px] font-black text-accent border border-white/[0.04] shrink-0">
                    {sym[0]}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/stock/${sym}`}
                      className="font-mono font-bold text-sm text-foreground hover:text-accent transition-colors flex items-center gap-1"
                    >
                      {sym}
                      <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
                    </Link>
                    {q?.name && (
                      <p className="text-[9px] text-muted-2 truncate max-w-[100px]">{q.name}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {q ? (
                    <div className="text-right">
                      <p className="text-sm font-mono font-bold text-foreground">
                        ${q.price.toFixed(2)}
                      </p>
                      <p className={`text-[10px] font-bold flex items-center justify-end gap-0.5 ${isUp ? "text-bull" : "text-bear"}`}>
                        {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        {isUp ? "+" : ""}{q.changePct.toFixed(2)}%
                      </p>
                    </div>
                  ) : (
                    <div className="text-right">
                      <div className="h-4 w-14 bg-surface-3/30 rounded animate-pulse" />
                      <div className="h-3 w-10 bg-surface-3/20 rounded animate-pulse mt-1" />
                    </div>
                  )}
                  <button
                    onClick={() => removeSymbol(sym)}
                    className="text-muted-2 hover:text-bear transition-colors opacity-0 group-hover:opacity-100 p-0.5"
                    title="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
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
