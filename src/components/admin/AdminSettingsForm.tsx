"use client"

import { useState, useTransition } from "react"
import { updateSystemSettingsAction } from "@/app/actions/admin"
import { Save, AlertCircle, CheckCircle2, ShieldAlert, Users, Volume2, Cpu } from "lucide-react"

interface Props {
  initialSettings: {
    MAINTENANCE_MODE: string
    ALLOW_SIGNUPS: string
    DASHBOARD_ANNOUNCEMENT: string
    AI_MODEL: string
  }
}

export function AdminSettingsForm({ initialSettings }: Props) {
  const [isPending, startTransition] = useTransition()
  const [maintenanceMode, setMaintenanceMode] = useState(initialSettings.MAINTENANCE_MODE === "true")
  const [allowSignups, setAllowSignups] = useState(initialSettings.ALLOW_SIGNUPS !== "false")
  const [announcement, setAnnouncement] = useState(initialSettings.DASHBOARD_ANNOUNCEMENT)
  const [aiModel, setAiModel] = useState(initialSettings.AI_MODEL || "llama-3.3-70b-versatile")
  
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const save = () => {
    setStatus("idle")
    startTransition(async () => {
      const res = await updateSystemSettingsAction({
        MAINTENANCE_MODE: maintenanceMode ? "true" : "false",
        ALLOW_SIGNUPS: allowSignups ? "true" : "false",
        DASHBOARD_ANNOUNCEMENT: announcement,
        AI_MODEL: aiModel,
      })
      
      if (res.success) {
        setStatus("success")
        setMessage(res.message || "Settings saved successfully")
      } else {
        setStatus("error")
        setMessage(res.error || "Failed to save settings")
      }
    })
  }

  const AI_MODELS = [
    { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Groq)" },
    { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B (Groq)" },
    { value: "gemma2-9b-it", label: "Gemma 2 9B (Groq)" },
  ]

  return (
    <div className="stat-card space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.04]">
        <h3 className="text-sm font-bold text-foreground font-display">General Configuration</h3>
        <button
          onClick={save}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-background hover:bg-accent-light transition-all text-xs font-bold disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          {isPending ? "Saving..." : "Save Configuration"}
        </button>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Maintenance Mode */}
        <div className="p-4 rounded-xl bg-surface-2/30 border border-white/[0.04] space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className={`w-4 h-4 ${maintenanceMode ? "text-bear" : "text-muted"}`} />
              <h4 className="text-sm font-bold text-foreground font-display">Maintenance Mode</h4>
            </div>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Redirects all standard users to a maintenance screen. Only admin accounts will be able to access the application.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setMaintenanceMode(true)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                maintenanceMode
                  ? "bg-bear/10 border-bear/30 text-bear font-black"
                  : "bg-surface-2/40 border-white/[0.06] text-muted hover:text-foreground"
              }`}
            >
              ON (Locked)
            </button>
            <button
              onClick={() => setMaintenanceMode(false)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                !maintenanceMode
                  ? "bg-bull/10 border-bull/30 text-bull font-black"
                  : "bg-surface-2/40 border-white/[0.06] text-muted hover:text-foreground"
              }`}
            >
              OFF (Live)
            </button>
          </div>
        </div>

        {/* Allow Signups */}
        <div className="p-4 rounded-xl bg-surface-2/30 border border-white/[0.04] space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Users className={`w-4 h-4 ${allowSignups ? "text-bull" : "text-muted"}`} />
              <h4 className="text-sm font-bold text-foreground font-display">User Registration</h4>
            </div>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Toggle whether new users can register accounts. When disabled, the signup form will show a registration closed message.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setAllowSignups(true)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                allowSignups
                  ? "bg-bull/10 border-bull/30 text-bull font-black"
                  : "bg-surface-2/40 border-white/[0.06] text-muted hover:text-foreground"
              }`}
            >
              Enabled
            </button>
            <button
              onClick={() => setAllowSignups(false)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                !allowSignups
                  ? "bg-bear/10 border-bear/30 text-bear font-black"
                  : "bg-surface-2/40 border-white/[0.06] text-muted hover:text-foreground"
              }`}
            >
              Disabled
            </button>
          </div>
        </div>

        {/* Announcement */}
        <div className="md:col-span-2 p-4 rounded-xl bg-surface-2/30 border border-white/[0.04] space-y-3">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-accent" />
            <h4 className="text-sm font-bold text-foreground font-display">Global Dashboard Announcement</h4>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Display a dynamic notice banner at the top of the user dashboard for all logged-in members. Leave blank to disable.
          </p>
          <input
            type="text"
            value={announcement}
            onChange={e => setAnnouncement(e.target.value)}
            placeholder="e.g. 🚀 Welcome to AlphaLens Pro! AI stock reports are now 2x faster."
            className="w-full bg-surface-3/50 border border-white/[0.06] rounded-xl py-2 px-4 text-xs text-foreground placeholder:text-muted-2 outline-none focus:border-accent/40 transition-all font-sans"
          />
        </div>

        {/* AI Model Provider */}
        <div className="md:col-span-2 p-4 rounded-xl bg-surface-2/30 border border-white/[0.04] space-y-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-alpha-purple" />
            <h4 className="text-sm font-bold text-foreground font-display">Active AI LLM Model</h4>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Select the default Large Language Model to power the automated stock summaries, macro forecasts, and chat assistants.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {AI_MODELS.map(model => (
              <button
                key={model.value}
                onClick={() => setAiModel(model.value)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-left flex flex-col justify-between ${
                  aiModel === model.value
                    ? "bg-alpha-purple/10 border-alpha-purple/30 text-alpha-purple font-bold"
                    : "bg-surface-3/30 border-white/[0.04] text-muted hover:text-foreground"
                }`}
              >
                <span>{model.label}</span>
                <span className="text-[9px] text-muted-2 mt-1 font-mono uppercase">{model.value.split("-")[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
