'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { AlphaLensLogo } from '@/components/brand/AlphaLensLogo';
import {
  LayoutDashboard, SlidersHorizontal, Trophy, Globe,
  Briefcase, Swords, Layers, ArrowLeftRight,
  ChevronLeft, ChevronRight, Search, Zap,
  User, ShieldAlert, LogOut, BookMarked, Star, Crown,
  MessageSquare, Settings, Cpu, Bell
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    label: 'TERMINAL',
    items: [
      { href: '/',          label: 'Dashboard',  icon: LayoutDashboard },
      { href: '/screener',  label: 'Screener',   icon: SlidersHorizontal },
      { href: '/arena',     label: 'Arena',      icon: Swords },
      { href: '/algos',     label: 'Algos',      icon: Cpu },
    ],
  },
  {
    label: 'ANALYSIS',
    items: [
      { href: '/macro',       label: 'Macro',       icon: Globe },
      { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
      { href: '/etf-overlap', label: 'ETF X-Ray',   icon: Layers },
      { href: '/compare',     label: 'Compare',     icon: ArrowLeftRight },
    ],
  },
  {
    label: 'MY SPACE',
    items: [
      { href: '/dashboard', label: 'Dashboard',  icon: User },
      { href: '/watchlist', label: 'Watchlist',  icon: BookMarked },
      { href: '/portfolio', label: 'Portfolio',  icon: Briefcase },
      { href: '/chat',      label: 'AI Chat',    icon: MessageSquare },
      { href: '/settings',  label: 'Settings',   icon: Settings },
    ],
  },
];

const QUICK_ACCESS = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'TSLA', name: 'Tesla' },
];

const PLAN_CONFIG: Record<string, { label: string; color: string; icon: typeof Star }> = {
  free:  { label: 'Free',  color: '#8892A4', icon: Star },
  pro:   { label: 'Pro',   color: '#3B82F6', icon: Zap },
  elite: { label: 'Elite', color: '#F5A623', icon: Crown },
};

interface SidebarProps {
  user?: { name?: string | null; email?: string | null; role?: string; plan?: string } | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const plan = (user?.plan ?? 'free') as keyof typeof PLAN_CONFIG;
  const planCfg = PLAN_CONFIG[plan] ?? PLAN_CONFIG.free;
  const PlanIcon = planCfg.icon;
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`
          hidden md:flex flex-col
          ${collapsed ? 'w-[60px]' : 'w-[220px]'}
          bg-surface/90 backdrop-blur-xl border-r border-white/[0.04]
          transition-all duration-300 ease-out
          h-screen sticky top-0
        `}
      >
        {/* Logo */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-2 px-4 h-[52px] border-b border-white/[0.04]`}>
          {collapsed
            ? <AlphaLensLogo variant="icon" size={26} className="mx-auto" />
            : <AlphaLensLogo variant="full" size={24} />
          }
        </div>

        {/* Search trigger */}
        {!collapsed ? (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-menu'))}
            className="mx-3 mt-3 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-2/60 border border-white/[0.04] text-muted text-xs transition-all hover:border-accent/20 hover:bg-surface-2 group"
          >
            <Search className="w-3.5 h-3.5 text-muted-2 shrink-0 group-hover:text-accent/60" />
            <span className="flex-1 text-left text-muted-2 text-[11px]">Search</span>
            <kbd className="text-[9px] text-muted-2 bg-surface-3/60 px-1.5 py-0.5 rounded-md font-mono border border-white/[0.04]">
              {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}K
            </kbd>
          </button>
        ) : (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-menu'))}
            className="mx-auto mt-3 p-2 rounded-lg text-muted-2 hover:text-accent hover:bg-surface-2 transition-all"
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-5 overflow-y-auto hide-scrollbar">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-3 mb-2 text-[9px] font-bold text-muted-2/70 uppercase tracking-[0.14em] font-display">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const isActive = pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`
                        flex items-center gap-2.5 px-2.5 py-[9px] rounded-xl text-[12.5px] font-medium
                        transition-all duration-150
                        ${isActive
                          ? 'bg-accent/10 text-accent border border-accent/15 shadow-[0_0_12px_rgba(0,217,126,0.06)]'
                          : 'text-muted hover:text-foreground hover:bg-white/[0.03] border border-transparent'
                        }
                      `}
                    >
                      <Icon className={`w-[16px] h-[16px] shrink-0 ${isActive ? 'text-accent' : 'text-muted-2'}`} />
                      {!collapsed && <span className="font-display">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick Access */}
          {!collapsed && (
            <div>
              <p className="px-3 mb-2 text-[9px] font-bold text-muted-2/70 uppercase tracking-[0.14em] font-display">
                QUICK ACCESS
              </p>
              <div className="space-y-0.5">
                {QUICK_ACCESS.map(stock => {
                  const isActive = pathname === `/stock/${stock.symbol}`;
                  return (
                    <Link
                      key={stock.symbol}
                      href={`/stock/${stock.symbol}`}
                      className={`
                        flex items-center gap-2.5 px-2.5 py-[7px] rounded-xl text-[12px]
                        transition-all duration-150 group
                        ${isActive ? 'bg-accent/8 text-accent' : 'text-muted hover:text-foreground hover:bg-white/[0.03]'}
                      `}
                    >
                      <Zap className="w-3 h-3 text-muted-2 group-hover:text-accent/60" />
                      <span className="font-mono font-semibold text-[11px] tracking-wide">{stock.symbol}</span>
                      <span className="text-[10px] text-muted-2 truncate ml-auto">{stock.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* User section */}
        <div className="border-t border-white/[0.04] p-2 space-y-1">
          {user ? (
            <>
              {/* Admin link */}
              {user.role === 'ADMIN' && !collapsed && (
                <Link href="/admin"
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[12px] font-medium text-alpha-purple hover:bg-alpha-purple/8 border border-transparent hover:border-alpha-purple/15 transition-all">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-display">Admin Panel</span>
                </Link>
              )}
              {user.role === 'ADMIN' && collapsed && (
                <Link href="/admin" title="Admin Panel"
                  className="flex justify-center p-2 rounded-xl text-alpha-purple hover:bg-alpha-purple/8 transition-all">
                  <ShieldAlert className="w-4 h-4" />
                </Link>
              )}

              {/* User card */}
              {!collapsed ? (
                <Link href="/dashboard"
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/[0.03] transition-all group">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent/20 to-alpha-blue/20 border border-accent/15 flex items-center justify-center text-[10px] font-black text-accent shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-foreground truncate font-display">
                      {user.name || user.email?.split('@')[0] || 'User'}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <PlanIcon className="w-2.5 h-2.5" style={{ color: planCfg.color }} />
                      <span className="text-[9px] font-bold font-display" style={{ color: planCfg.color }}>
                        {planCfg.label}
                      </span>
                    </div>
                  </div>
                </Link>
              ) : (
                <Link href="/dashboard" title="Dashboard"
                  className="flex justify-center p-2 rounded-xl hover:bg-white/[0.03] transition-all">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent/20 to-alpha-blue/20 border border-accent/15 flex items-center justify-center text-[10px] font-black text-accent">
                    {initials}
                  </div>
                </Link>
              )}

              {/* Sign out */}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                title="Sign Out"
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[12px] font-medium text-muted hover:text-bear hover:bg-bear/5 border border-transparent transition-all ${collapsed ? 'justify-center' : ''}`}
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                {!collapsed && <span className="font-display">Sign Out</span>}
              </button>
            </>
          ) : (
            /* Not logged in */
            !collapsed ? (
              <Link href="/login"
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent hover:bg-accent/15 transition-all text-xs font-bold font-display">
                Sign In
              </Link>
            ) : (
              <Link href="/login" title="Sign In"
                className="flex justify-center p-2 rounded-xl text-accent hover:bg-accent/10 transition-all">
                <User className="w-4 h-4" />
              </Link>
            )
          )}
        </div>

        {/* Collapse toggle */}
        <div className="px-2 pb-3 pt-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full py-2 rounded-xl text-muted-2 hover:text-foreground hover:bg-white/[0.03] text-xs transition-all flex items-center justify-center gap-1.5 group"
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4 group-hover:text-accent" />
              : <><ChevronLeft className="w-3.5 h-3.5 group-hover:text-accent" /><span className="text-[11px] font-display">Collapse</span></>
            }
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-xl border-t border-white/[0.06] flex justify-around py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {[
          { href: '/', label: 'Home', icon: LayoutDashboard },
          { href: '/screener', label: 'Screener', icon: SlidersHorizontal },
          { href: '/arena', label: 'Arena', icon: Swords },
          { href: '/dashboard', label: 'Account', icon: User },
          { href: '/chat', label: 'AI', icon: MessageSquare },
        ].map(item => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                isActive ? 'text-accent' : 'text-muted-2'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span className="text-[9px] font-medium font-display">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
