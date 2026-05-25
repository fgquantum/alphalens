import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { BookMarked, ArrowRight, LogIn } from "lucide-react"
import { WatchlistSection } from "@/components/dashboard/WatchlistSection"

export default async function WatchlistPage() {
  const session = await auth()

  if (!session) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-4 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/15 flex items-center justify-center mx-auto">
          <BookMarked className="w-6 h-6 text-accent" />
        </div>
        <h1 className="text-2xl font-black text-foreground font-display">My Watchlist</h1>
        <p className="text-sm text-muted">Sign in to save and track your favourite tickers with live prices.</p>
        <Link href="/login"
          className="inline-flex items-center gap-2 btn-primary text-sm px-6 py-3">
          <LogIn className="w-4 h-4" /> Sign In to Continue
        </Link>
      </div>
    )
  }

  const items = await db.watchlistItem.findMany({
    where: { userId: session.user.id! },
    orderBy: { addedAt: "desc" },
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/15 flex items-center justify-center">
            <BookMarked className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground font-display tracking-tight">My Watchlist</h1>
            <p className="text-xs text-muted mt-0.5">
              {items.length} saved ticker{items.length !== 1 ? "s" : ""} · live prices · synced to your account
            </p>
          </div>
        </div>
        <Link href="/screener"
          className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-light transition-colors font-medium">
          Browse stocks <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <WatchlistSection initialItems={items.map(i => i.symbol)} />
    </div>
  )
}
