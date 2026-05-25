'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlphaLensLogo } from '@/components/brand/AlphaLensLogo';
import { Search, ShieldAlert } from 'lucide-react';

const NAV_TABS = [
  { href: '/',         label: 'DASHBOARD' },
  { href: '/screener', label: 'SCREENER'  },
  { href: '/arena',    label: 'ARENA'     },
  { href: '/algos',    label: 'ALGOS'     },
];

interface NavbarProps {
  user?: { name?: string | null; email?: string | null; role?: string; plan?: string } | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [time, setTime] = useState('');
  const [macroLine, setMacroLine] = useState('MACRO REGIME LATE-CYCLE EXPANSION │ Technology: Outperform │ CPI 2.4% │ GDP 2.1% │ FED 4.25% │ 10Y−2Y +0.38%');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Detect if we're on a stock page to show TICKER tab active
  const isStockPage = pathname.startsWith('/stock/');
  const stockSymbol = isStockPage ? pathname.split('/stock/')[1]?.split('/')[0] : null;

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? null;

  return (
    <header className="sticky top-0 z-50 flex flex-col" style={{ background: 'var(--color-surface)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      {/* ── Main nav bar ── */}
      <div className="flex items-center h-[44px] px-4 gap-0">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 pr-4 border-r border-white/[0.06] mr-2 shrink-0">
          <AlphaLensLogo variant="compact" size={20} />
          <span className="font-mono text-[10px] font-bold text-accent tracking-widest hidden sm:block">v12</span>
        </Link>

        {/* Nav tabs */}
        <nav className="flex items-stretch h-full">
          {/* TICKER tab — only shown on stock pages */}
          {isStockPage && stockSymbol && (
            <Link
              href={`/stock/${stockSymbol}`}
              className="flex items-center px-4 h-full font-mono text-[11px] font-bold tracking-widest border-r border-white/[0.06] transition-colors"
              style={{ color: '#00D97E', background: 'rgba(0,217,126,0.06)', borderBottom: '2px solid #00D97E' }}
            >
              TICKER
            </Link>
          )}
          {NAV_TABS.map(tab => {
            const isActive = tab.href === '/'
              ? pathname === '/'
              : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex items-center px-4 h-full font-mono text-[11px] tracking-widest border-r border-white/[0.06] transition-colors"
                style={{
                  color: isActive ? '#00D97E' : 'var(--color-muted)',
                  background: isActive ? 'rgba(0,217,126,0.04)' : 'transparent',
                  borderBottom: isActive ? '2px solid #00D97E' : '2px solid transparent',
                  fontWeight: isActive ? 700 : 400,
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {/* Search */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-menu'))}
          className="flex items-center gap-2 px-3 py-1.5 mx-3 flex-1 max-w-xs border border-white/[0.08] text-muted hover:border-accent/30 transition-colors group"
          style={{ background: 'var(--color-surface-2)', fontFamily: 'var(--font-mono)' }}
        >
          <Search className="w-3 h-3 text-muted-2 group-hover:text-accent/60 shrink-0" />
          <span className="text-[10px] text-muted-2 flex-1 text-left">Search ticker, algo, metric…</span>
          <kbd className="text-[9px] text-muted-2 border border-white/[0.08] px-1 font-mono">⌘ K</kbd>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-3 ml-auto shrink-0">
          {/* UTC clock */}
          <div className="hidden lg:flex items-center gap-1.5">
            <span className="obs-dot obs-dot-green animate-blink" style={{ width: 5, height: 5 }} />
            <span className="font-mono text-[10px] text-muted-2 tabular-nums">UTC ● {time}</span>
          </div>

          {/* Admin */}
          {user?.role === 'ADMIN' && (
            <Link href="/admin"
              className="hidden sm:flex items-center gap-1 px-2 py-1 border border-alpha-purple/20 text-alpha-purple hover:bg-alpha-purple/10 transition-all"
              style={{ background: 'rgba(139,92,246,0.06)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
              <ShieldAlert className="w-3 h-3" />
              ADMIN
            </Link>
          )}

          {/* User / Sign in */}
          {user ? (
            <Link href="/dashboard"
              className="w-7 h-7 border border-accent/25 flex items-center justify-center font-mono text-[10px] font-bold text-accent hover:border-accent/50 transition-all"
              style={{ background: 'rgba(0,217,126,0.08)' }}>
              {initials}
            </Link>
          ) : (
            <Link href="/login"
              className="px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest text-background transition-all"
              style={{ background: '#00D97E' }}>
              JOIN ARENA
            </Link>
          )}
        </div>
      </div>

      {/* ── Macro regime bar ── */}
      <div className="flex items-center h-[22px] px-4 border-t border-white/[0.04] overflow-hidden"
        style={{ background: 'rgba(0,0,0,0.3)' }}>
        <span className="font-mono text-[9px] text-muted-2 tracking-widest whitespace-nowrap truncate">
          {macroLine} │ UTC ● {time}
        </span>
      </div>
    </header>
  );
}
