import { auth } from "@/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { CommandMenu } from "@/components/layout/CommandMenu";
import { getSystemSetting } from "@/lib/settings";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user ?? null;

  // Enforce Maintenance Mode
  const maintenanceMode = await getSystemSetting("MAINTENANCE_MODE", "false");
  if (maintenanceMode === "true" && user?.role !== "ADMIN") {
    redirect("/maintenance");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
        <footer className="hidden md:block px-6 py-2.5 border-t border-white/[0.03] bg-surface/50">
          <p className="text-[9px] text-muted-2/60 leading-relaxed max-w-5xl">
            AlphaLens provides algorithmic financial data and pre-computed AI analysis for educational and informational purposes only.
            AlphaScore&trade;, TSI&trade;, EQS&trade;, AlphaMomentum&trade;, SMI&trade;, CER&trade;, Volatility Regime&trade;, Earnings Momentum&trade;,
            Macro Regime Detector&trade;, Portfolio Health Engine&trade;, and Similarity Engine&trade; are proprietary mathematical algorithms.
            No output constitutes investment advice or a guarantee of future performance. Conduct independent research. Consult a licensed financial advisor.
          </p>
        </footer>
      </div>
      <CommandMenu />
    </div>
  );
}
