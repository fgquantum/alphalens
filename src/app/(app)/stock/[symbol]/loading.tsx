'use client';

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse pb-16 px-4 sm:px-6">
      {/* ── Top Section: Bento Grid Skeleton ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 h-[320px] bg-surface-2 rounded-2xl border border-border/20" />
        <div className="lg:col-span-4 h-[320px] bg-surface-2 rounded-2xl border border-border/20" />
      </div>

      {/* ── Mid Section: Summary & Factors Skeleton ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 h-[240px] bg-surface-2 rounded-2xl border border-border/20" />
        <div className="lg:col-span-4 h-[240px] bg-surface-2 rounded-2xl border border-border/20" />
        <div className="lg:col-span-4 h-[240px] bg-surface-2 rounded-2xl border border-border/20" />
      </div>

      {/* ── Charts & Lists ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 h-[400px] bg-surface-2 rounded-2xl border border-border/20" />
        <div className="lg:col-span-4 h-[400px] bg-surface-2 rounded-2xl border border-border/20" />
      </div>
      
      <div className="h-[200px] bg-surface-2 rounded-2xl border border-border/20" />
    </div>
  );
}
