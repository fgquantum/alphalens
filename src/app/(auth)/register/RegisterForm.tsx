"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Lock, Mail, User, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react"
import { AlphaLensLogo } from "@/components/brand/AlphaLensLogo"
import { registerUser } from "@/app/actions/auth"

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const password = formData.get("password") as string
    const confirm = formData.get("confirm") as string

    if (password !== confirm) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      setLoading(false)
      return
    }

    const result = await registerUser(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push("/login?registered=1")
    }
  }

  const perks = [
    "Full access to 12 proprietary algorithms",
    "AlphaScore™ ratings for 50,000+ tickers",
    "Portfolio health analysis & roast",
    "Macro regime detection & AI reports",
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/[0.04] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-alpha-purple/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-4xl relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left: Perks */}
        <div className="hidden lg:flex flex-col gap-6 pr-8">
          <Link href="/">
            <AlphaLensLogo variant="full" size={28} />
          </Link>
          <div>
            <h2 className="text-3xl font-black text-foreground font-display tracking-tight leading-tight">
              Institutional intelligence.<br />
              <span className="gradient-text">Zero cost.</span>
            </h2>
            <p className="text-sm text-muted mt-3 leading-relaxed">
              Join thousands of investors using AlphaLens to see what the market misses.
            </p>
          </div>
          <ul className="space-y-3">
            {perks.map((perk, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                <span className="text-sm text-muted">{perk}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 p-4 rounded-xl bg-accent/[0.04] border border-accent/10">
            <p className="text-xs text-muted-2 leading-relaxed">
              <span className="text-accent font-semibold">Free forever.</span> No credit card required. No hidden fees.
              AlphaLens is 100% free for all users.
            </p>
          </div>
        </div>

        {/* Right: Form */}
        <div>
          {/* Mobile logo */}
          <div className="flex justify-center mb-6 lg:hidden">
            <Link href="/">
              <AlphaLensLogo variant="full" size={28} />
            </Link>
          </div>

          <div className="bg-surface/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
            <div className="text-center mb-7">
              <h1 className="text-2xl font-black text-foreground font-display tracking-tight">Create your account</h1>
              <p className="text-sm text-muted mt-1.5">Free forever. No credit card needed.</p>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 bg-bear/8 border border-bear/20 text-bear px-4 py-3 rounded-xl mb-5 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 font-display">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-2" />
                  <input
                    type="text"
                    name="name"
                    className="w-full bg-surface-2/60 border border-white/[0.06] rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-2 outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition-all"
                    placeholder="John Doe"
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 font-display">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-2" />
                  <input
                    type="email"
                    name="email"
                    className="w-full bg-surface-2/60 border border-white/[0.06] rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-2 outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition-all"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 font-display">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className="w-full bg-surface-2/60 border border-white/[0.06] rounded-xl py-3 pl-10 pr-11 text-sm text-foreground placeholder:text-muted-2 outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition-all"
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-2 hover:text-muted transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 font-display">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-2" />
                  <input
                    type="password"
                    name="confirm"
                    className="w-full bg-surface-2/60 border border-white/[0.06] rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-2 outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition-all"
                    placeholder="••••••••"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-sm font-bold mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  "Create Free Account"
                )}
              </button>
            </form>

            <p className="text-center text-muted text-sm mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-accent hover:text-accent-light font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
