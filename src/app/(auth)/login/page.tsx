"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Lock, Mail, Eye, EyeOff, AlertCircle } from "lucide-react"
import { AlphaLensLogo } from "@/components/brand/AlphaLensLogo"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (res?.error) {
        setError("Invalid email or password")
        setLoading(false)
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch {
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/[0.04] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-alpha-blue/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/">
            <AlphaLensLogo variant="full" size={28} />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-surface/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
          <div className="text-center mb-7">
            <h1 className="text-2xl font-black text-foreground font-display tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted mt-1.5">Sign in to your AlphaLens account</p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 bg-bear/8 border border-bear/20 text-bear px-4 py-3 rounded-xl mb-5 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 font-display">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-2/60 border border-white/[0.06] rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-2 outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition-all"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider font-display">
                  Password
                </label>
                <Link href="#" className="text-[11px] text-accent hover:text-accent-light transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-2/60 border border-white/[0.06] rounded-xl py-3 pl-10 pr-11 text-sm text-foreground placeholder:text-muted-2 outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition-all"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-sm font-bold mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-muted text-sm mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-accent hover:text-accent-light font-semibold transition-colors">
              Create one free
            </Link>
          </p>
        </div>

        {/* Footer note */}
        <p className="text-center text-[10px] text-muted-2 mt-5 leading-relaxed">
          By signing in you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
