"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Save, Trash2, AlertCircle, CheckCircle2, ShieldAlert, ShieldOff } from "lucide-react"

interface Props {
  userId: string
  initialName: string
  initialEmail: string
  initialRole: string
  initialPlan: string
}

export function AdminUserEditor({ userId, initialName, initialEmail, initialRole, initialPlan }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [role, setRole] = useState(initialRole)
  const [plan, setPlan] = useState(initialPlan)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [showDelete, setShowDelete] = useState(false)

  const save = async () => {
    setStatus("idle")
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, role, plan }),
        })
        const data = await res.json()
        if (res.ok) {
          setStatus("success")
          setMessage("User updated successfully")
          router.refresh()
        } else {
          setStatus("error")
          setMessage(data.error || "Failed to update user")
        }
      } catch {
        setStatus("error")
        setMessage("Network error")
      }
    })
  }

  const deleteUser = async () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" })
        if (res.ok) {
          router.push("/admin/users")
          router.refresh()
        } else {
          setStatus("error")
          setMessage("Failed to delete user")
        }
      } catch {
        setStatus("error")
        setMessage("Network error")
      }
    })
  }

  const PLAN_OPTIONS = [
    { value: "free", label: "Free", color: "#8892A4" },
    { value: "pro", label: "Pro", color: "#3B82F6" },
    { value: "elite", label: "Elite", color: "#F5A623" },
  ]

  return (
    <div className="stat-card space-y-5">
      <h3 className="text-sm font-bold text-foreground font-display">Edit User</h3>

      {status === "success" && (
        <div className="flex items-center gap-2 bg-bull/8 border border-bull/20 text-bull px-4 py-3 rounded-xl text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {message}
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 bg-bear/8 border border-bear/20 text-bear px-4 py-3 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 font-display">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-surface-2/60 border border-white/[0.06] rounded-xl py-2.5 px-4 text-sm text-foreground outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition-all"
            placeholder="Full name"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 font-display">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-surface-2/60 border border-white/[0.06] rounded-xl py-2.5 px-4 text-sm text-foreground outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition-all"
            placeholder="email@example.com"
          />
        </div>

        {/* Role */}
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 font-display">Role</label>
          <div className="flex gap-2">
            {["USER", "ADMIN"].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  role === r
                    ? r === "ADMIN"
                      ? "bg-alpha-purple/15 border-alpha-purple/30 text-alpha-purple"
                      : "bg-accent/10 border-accent/20 text-accent"
                    : "bg-surface-2/40 border-white/[0.06] text-muted hover:text-foreground"
                }`}
              >
                {r === "ADMIN" ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Plan */}
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 font-display">Plan</label>
          <div className="flex gap-2">
            {PLAN_OPTIONS.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPlan(p.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                  plan === p.value
                    ? "border-current"
                    : "bg-surface-2/40 border-white/[0.06] text-muted hover:text-foreground"
                }`}
                style={plan === p.value ? {
                  background: `${p.color}12`,
                  borderColor: `${p.color}30`,
                  color: p.color,
                } : {}}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
        <button
          onClick={() => setShowDelete(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bear/8 border border-bear/15 text-bear hover:bg-bear/12 transition-all text-sm font-semibold"
        >
          <Trash2 className="w-4 h-4" /> Delete User
        </button>

        <button
          onClick={save}
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-background hover:bg-accent-light transition-all text-sm font-bold disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Delete confirmation */}
      {showDelete && (
        <div className="p-4 rounded-xl bg-bear/8 border border-bear/20 space-y-3">
          <p className="text-sm text-bear font-semibold">⚠ Are you sure you want to delete this user?</p>
          <p className="text-xs text-muted">This will permanently delete the account and all associated data including their watchlist. This cannot be undone.</p>
          <div className="flex gap-3">
            <button
              onClick={deleteUser}
              disabled={isPending}
              className="px-4 py-2 rounded-xl bg-bear text-white text-sm font-bold hover:bg-bear/80 transition-all disabled:opacity-50"
            >
              {isPending ? "Deleting..." : "Yes, Delete"}
            </button>
            <button
              onClick={() => setShowDelete(false)}
              className="px-4 py-2 rounded-xl bg-surface-2/60 border border-white/[0.06] text-muted text-sm hover:text-foreground transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
