"use client"

import { useState, useTransition } from "react"
import { Pencil, Check, X, AlertCircle, CheckCircle2 } from "lucide-react"
import { updateProfile } from "@/app/actions/user"

interface ProfileEditorProps {
  initialName: string
}

export function ProfileEditor({ initialName }: ProfileEditorProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [draft, setDraft] = useState(initialName)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()

  const save = () => {
    if (!draft.trim() || draft === name) { setEditing(false); return }
    startTransition(async () => {
      const fd = new FormData()
      fd.set("name", draft.trim())
      const result = await updateProfile(fd)
      if (result.success) {
        setName(draft.trim())
        setStatus("success")
        setMessage("Name updated")
        setEditing(false)
        setTimeout(() => setStatus("idle"), 3000)
      } else {
        setStatus("error")
        setMessage(result.error || "Failed to update")
      }
    })
  }

  const cancel = () => {
    setDraft(name)
    setEditing(false)
    setStatus("idle")
  }

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
      <span className="text-xs text-muted-2 font-display uppercase tracking-wider">Name</span>
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <input
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel() }}
              className="bg-surface-2/60 border border-accent/30 rounded-lg px-2.5 py-1 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/15 w-36 transition-all"
              maxLength={60}
            />
            <button onClick={save} disabled={isPending}
              className="p-1 rounded-lg text-bull hover:bg-bull/10 transition-all disabled:opacity-40">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={cancel}
              className="p-1 rounded-lg text-muted-2 hover:text-bear hover:bg-bear/10 transition-all">
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            <span className="text-sm text-foreground font-medium">{name || "—"}</span>
            {status === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-bull" />}
            {status === "error" && (
              <span className="text-[10px] text-bear flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{message}
              </span>
            )}
            <button onClick={() => { setEditing(true); setDraft(name); setStatus("idle") }}
              className="p-1 rounded-lg text-muted-2 hover:text-accent hover:bg-accent/8 transition-all">
              <Pencil className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
