"use client"

import { useState, useTransition } from "react"
import { executeSqlQueryAction } from "@/app/actions/admin"
import { Database, Play, AlertCircle, CheckCircle2, ChevronRight, FileCode2, TableProperties, HelpCircle } from "lucide-react"

interface Props {
  tables: Array<{ name: string; count: number }>
}

export function AdminDatabaseConsole({ tables }: Props) {
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState("SELECT * FROM User LIMIT 10;")
  const [result, setResult] = useState<{
    success: boolean
    type?: "select" | "execute"
    data?: any[]
    affected?: number
    error?: string
  } | null>(null)

  const runQuery = () => {
    if (!query.trim()) return
    setResult(null)
    startTransition(async () => {
      const res = await executeSqlQueryAction(query)
      setResult(res)
    })
  }

  const loadPreset = (preset: string) => {
    setQuery(preset)
  }

  const renderTableResult = (data: any[]) => {
    if (data.length === 0) {
      return (
        <div className="p-8 text-center text-muted text-sm">
          Query returned 0 rows.
        </div>
      )
    }

    const headers = Object.keys(data[0])

    return (
      <div className="overflow-x-auto border border-white/[0.04] rounded-xl bg-surface-2/10">
        <table className="w-full text-left text-xs font-mono select-text border-collapse">
          <thead className="bg-surface-3/60 text-muted uppercase tracking-wider border-b border-white/[0.06]">
            <tr>
              {headers.map(h => (
                <th key={h} className="px-4 py-3 font-bold border-r border-white/[0.04]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                {headers.map(h => {
                  const val = row[h]
                  let displayVal = ""
                  if (val === null) displayVal = "NULL"
                  else if (typeof val === "object") displayVal = JSON.stringify(val)
                  else displayVal = String(val)

                  return (
                    <td key={h} className="px-4 py-2.5 max-w-xs truncate border-r border-white/[0.04] text-foreground font-medium" title={displayVal}>
                      {val === null ? (
                        <span className="text-muted-2 italic">NULL</span>
                      ) : typeof val === "boolean" ? (
                        <span className={val ? "text-bull" : "text-bear"}>{String(val)}</span>
                      ) : h.toLowerCase().includes("role") && val === "ADMIN" ? (
                        <span className="text-alpha-purple font-bold">{val}</span>
                      ) : (
                        displayVal
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar: Schema Tables */}
      <div className="lg:col-span-1 space-y-4">
        <div className="stat-card space-y-3">
          <h3 className="text-xs font-bold text-foreground font-display flex items-center gap-2">
            <TableProperties className="w-4 h-4 text-accent" />
            Database Tables
          </h3>
          <div className="space-y-1.5">
            {tables.map(t => (
              <button
                key={t.name}
                onClick={() => loadPreset(`SELECT * FROM ${t.name} LIMIT 20;`)}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-surface-2/40 hover:bg-surface-2/80 border border-white/[0.03] transition-all text-left text-xs font-mono font-medium group"
              >
                <span className="text-muted group-hover:text-foreground transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-muted-2" />
                  {t.name}
                </span>
                <span className="text-[10px] text-muted-2 font-semibold bg-surface-3 px-1.5 py-0.5 rounded">
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Query Presets */}
        <div className="stat-card space-y-3">
          <h3 className="text-xs font-bold text-foreground font-display flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-alpha-purple" />
            SQL Presets
          </h3>
          <div className="space-y-2">
            {[
              { label: "View Recent Logs", sql: "SELECT * FROM SystemLog ORDER BY createdAt DESC LIMIT 15;" },
              { label: "List Active Alerts", sql: "SELECT * FROM Alert WHERE isActive = 1;" },
              { label: "Premium Users", sql: "SELECT name, email, plan, role FROM User WHERE plan != 'free';" },
              { label: "Watchlist Counts", sql: "SELECT symbol, COUNT(*) as users_saved FROM WatchlistItem GROUP BY symbol ORDER BY users_saved DESC;" },
              { label: "Database Details", sql: "PRAGMA table_info(User);" },
            ].map((p, i) => (
              <button
                key={i}
                onClick={() => loadPreset(p.sql)}
                className="w-full text-left text-xs text-muted hover:text-accent transition-colors block truncate font-medium font-sans pl-2 border-l border-white/[0.08] hover:border-accent"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Query Console and Results */}
      <div className="lg:col-span-3 space-y-5">
        <div className="stat-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold text-foreground font-display">SQL Command Console</h3>
            </div>
            <button
              onClick={runQuery}
              disabled={isPending || !query.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-background hover:bg-accent-light transition-all text-xs font-bold disabled:opacity-50"
            >
              <Play className="w-3 h-3 fill-current" />
              {isPending ? "Executing..." : "Run Query"}
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-muted-2 font-mono uppercase tracking-wider">Execute Raw SQL (SQLite dialect)</label>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full h-32 bg-surface-3/50 border border-white/[0.06] rounded-xl py-3 px-4 font-mono text-xs text-foreground placeholder:text-muted-2 outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/10 transition-all resize-y select-text"
              placeholder="SELECT * FROM User LIMIT 10;"
            />
          </div>

          <div className="flex items-start gap-1.5 p-3 rounded-lg bg-bear/5 border border-bear/10 text-bear text-[11px] leading-relaxed">
            <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              <strong>Warning:</strong> You have full read/write power. Modifying, deleting, or dropping tables will instantly affect system functionality and database integrity.
            </span>
          </div>
        </div>

        {/* Results Card */}
        {(result || isPending) && (
          <div className="stat-card space-y-4">
            <h3 className="text-xs font-bold text-foreground font-display">Query Execution Results</h3>

            {isPending && (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <span className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                <p className="text-xs text-muted font-mono">Running transaction query...</p>
              </div>
            )}

            {result && (
              <div className="space-y-3">
                {result.success ? (
                  result.type === "select" ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 bg-bull/8 border border-bull/20 text-bull px-3 py-1.5 rounded-lg text-xs font-mono font-medium max-w-max">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Query success: {result.data?.length ?? 0} rows returned
                      </div>
                      {renderTableResult(result.data || [])}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-bull/8 border border-bull/20 text-bull px-3 py-2 rounded-lg text-xs font-mono font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mutation executed successfully. Affected rows: {result.affected}
                    </div>
                  )
                ) : (
                  <div className="flex items-start gap-2 bg-bear/8 border border-bear/20 text-bear p-3 rounded-lg text-xs font-mono">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold">SQL Error:</p>
                      <pre className="whitespace-pre-wrap leading-relaxed select-text">{result.error}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
