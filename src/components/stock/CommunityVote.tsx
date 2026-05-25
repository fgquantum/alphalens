"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Users } from "lucide-react"

interface VoteData {
  bull: number
  bear: number
  total: number
  userVote: "bull" | "bear" | null
}

export function CommunityVote({ symbol }: { symbol: string }) {
  const [data, setData] = useState<VoteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Check auth + fetch votes in parallel
    Promise.all([
      fetch(`/api/votes?symbol=${symbol}`).then(r => r.json()),
      fetch("/api/auth/session").then(r => r.json()),
    ]).then(([votes, session]) => {
      setData(votes)
      setIsLoggedIn(!!session?.user)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [symbol])

  const vote = async (v: "bull" | "bear") => {
    if (!isLoggedIn || voting) return
    setVoting(true)

    // Optimistic update
    const prev = data
    if (data) {
      const wasVoted = data.userVote === v
      setData({
        ...data,
        bull: v === "bull" ? (wasVoted ? data.bull - 1 : data.bull + 1) : (data.userVote === "bull" ? data.bull - 1 : data.bull),
        bear: v === "bear" ? (wasVoted ? data.bear - 1 : data.bear + 1) : (data.userVote === "bear" ? data.bear - 1 : data.bear),
        total: wasVoted ? data.total - 1 : data.total + (data.userVote ? 0 : 1),
        userVote: wasVoted ? null : v,
      })
    }

    try {
      if (data?.userVote === v) {
        // Remove vote
        await fetch(`/api/votes?symbol=${symbol}`, { method: "DELETE" })
      } else {
        const res = await fetch("/api/votes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol, vote: v }),
        })
        if (res.ok) {
          const updated = await res.json()
          setData(updated)
        } else if (res.status === 401) {
          setIsLoggedIn(false)
          setData(prev)
        }
      }
    } catch {
      setData(prev)
    }
    setVoting(false)
  }

  if (loading) {
    return (
      <div className="stat-card animate-pulse">
        <div className="h-4 w-32 bg-surface-3/30 rounded mb-3" />
        <div className="flex gap-2">
          <div className="h-10 flex-1 bg-surface-3/20 rounded-xl" />
          <div className="h-10 flex-1 bg-surface-3/20 rounded-xl" />
        </div>
      </div>
    )
  }

  const bullPct = data && data.total > 0 ? Math.round((data.bull / data.total) * 100) : 50
  const bearPct = 100 - bullPct

  return (
    <div className="stat-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-2" />
          <h3 className="text-sm font-bold text-foreground font-display">Community Sentiment</h3>
        </div>
        {data && data.total > 0 && (
          <span className="text-[10px] text-muted-2 font-mono">{data.total} vote{data.total !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Vote buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => vote("bull")}
          disabled={voting || !isLoggedIn}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all ${
            data?.userVote === "bull"
              ? "bg-bull/15 border-bull/30 text-bull"
              : "bg-surface-2/40 border-white/[0.06] text-muted hover:bg-bull/8 hover:border-bull/20 hover:text-bull"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <TrendingUp className="w-4 h-4" />
          Bullish
          {data && <span className="text-[11px] opacity-70">({data.bull})</span>}
        </button>
        <button
          onClick={() => vote("bear")}
          disabled={voting || !isLoggedIn}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all ${
            data?.userVote === "bear"
              ? "bg-bear/15 border-bear/30 text-bear"
              : "bg-surface-2/40 border-white/[0.06] text-muted hover:bg-bear/8 hover:border-bear/20 hover:text-bear"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <TrendingDown className="w-4 h-4" />
          Bearish
          {data && <span className="text-[11px] opacity-70">({data.bear})</span>}
        </button>
      </div>

      {/* Sentiment bar */}
      {data && data.total > 0 && (
        <div className="space-y-1.5">
          <div className="flex overflow-hidden rounded-full h-2">
            <div className="bg-bull transition-all" style={{ width: `${bullPct}%` }} />
            <div className="bg-bear transition-all flex-1" />
          </div>
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-bull font-bold">{bullPct}% Bull</span>
            <span className="text-bear font-bold">{bearPct}% Bear</span>
          </div>
        </div>
      )}

      {!isLoggedIn && (
        <p className="text-[10px] text-muted-2 text-center">
          <a href="/login" className="text-accent hover:text-accent-light transition-colors">Sign in</a> to cast your vote
        </p>
      )}
    </div>
  )
}
