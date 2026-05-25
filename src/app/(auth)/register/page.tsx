import { getSystemSetting } from "@/lib/settings"
import { RegisterForm } from "./RegisterForm"
import { ShieldAlert, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AlphaLensLogo } from "@/components/brand/AlphaLensLogo"

export default async function RegisterPage() {
  const allowSignups = await getSystemSetting("ALLOW_SIGNUPS", "true")
  
  if (allowSignups === "false") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/[0.04] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-bear/[0.03] rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md relative">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/">
              <AlphaLensLogo variant="full" size={28} />
            </Link>
          </div>

          {/* Card */}
          <div className="bg-surface/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 shadow-[0_24px_80px_rgba(0,0,0,0.4)] text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-bear/15 border border-bear/20 flex items-center justify-center animate-pulse">
              <ShieldAlert className="w-8 h-8 text-bear" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-foreground font-display tracking-tight">Registration Closed</h1>
              <p className="text-sm text-muted leading-relaxed">
                New user signups are currently closed. If you have an existing account, please sign in below.
              </p>
            </div>
            <div className="pt-2">
              <Link 
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent text-background font-bold hover:bg-accent-light transition-all text-sm cursor-pointer"
              >
                Sign In Existing Account
              </Link>
            </div>
            <div className="pt-2">
              <Link 
                href="/"
                className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <RegisterForm />
}
