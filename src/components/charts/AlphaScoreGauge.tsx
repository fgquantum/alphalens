'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// ── v11 Grade Band Colors ───────────────────────────────────

export function getScoreColor(score: number): string {
  if (score >= 90) return '#00D97E'; // A+
  if (score >= 80) return '#22C55E'; // A
  if (score >= 70) return '#84CC16'; // B+
  if (score >= 60) return '#EAB308'; // B
  if (score >= 50) return '#F97316'; // C+
  if (score >= 40) return '#EF4444'; // C
  if (score >= 30) return '#DC2626'; // D
  return '#FF4D6D';                  // F
}

export function getGradeClass(grade: string): string {
  if (grade.startsWith('A')) return 'score-a-plus';
  if (grade === 'B+') return 'score-b-plus';
  if (grade === 'B') return 'score-b';
  if (grade.startsWith('C')) return 'score-c-plus';
  if (grade === 'D') return 'score-d';
  return 'score-f';
}

// ── AlphaScore Gauge (Ring) ─────────────────────────────────

interface AlphaScoreGaugeProps {
  score: number;
  grade: string;
  size?: number;
}

export function AlphaScoreGauge({ score, grade, size = 160 }: AlphaScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const color = getScoreColor(score);

  // Animate counter from 0 to final value (600ms)
  useEffect(() => {
    const duration = 600;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(score * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-4 group" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
          {/* Background circle */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="#141820"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (score / 100) * circumference }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 14px ${color}50)` }}
          />
          {/* Outer glow ring */}
          <motion.circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="1"
            strokeLinecap="round"
            initial={{ strokeDasharray: circumference, strokeDashoffset: circumference, opacity: 0 }}
            animate={{ strokeDashoffset: circumference - (score / 100) * circumference, opacity: 0.3 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ filter: `blur(4px)` }}
          />
        </svg>

        {/* Score text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono font-bold tracking-tighter"
            style={{ fontSize: size * 0.28, color }}
          >
            {displayScore}
          </span>
          <span className="text-[9px] font-display font-bold text-muted-2 uppercase tracking-[0.15em] -mt-0.5">
            AlphaScore™
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="font-mono font-bold text-xs px-4 py-1 rounded-full border"
        style={{
          color,
          backgroundColor: `${color}12`,
          borderColor: `${color}35`,
          boxShadow: `0 4px 12px ${color}15`,
        }}
      >
        GRADE {grade}
      </motion.div>
    </div>
  );
}

// ── AlphaScore Badge (inline) ───────────────────────────────

export function AlphaScoreBadge({ score, grade }: { score: number; grade: string }) {
  const color = getScoreColor(score);
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-flex items-center gap-2 px-3 py-1 rounded-xl text-sm font-mono font-bold border backdrop-blur-sm"
      style={{
        color,
        backgroundColor: `${color}12`,
        borderColor: `${color}25`,
      }}
    >
      <span className="text-base leading-none font-score">{score}</span>
      <span className="text-[10px] uppercase font-bold opacity-80 border-l border-current pl-2 ml-0.5">{grade}</span>
    </motion.span>
  );
}

// ── Mini Score Bar ──────────────────────────────────────────

export function ScoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = getScoreColor((value / max) * 100);

  return (
    <div className="space-y-2 group">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-display font-bold uppercase tracking-[0.08em] text-muted group-hover:text-foreground/70 transition-colors">
          {label}
        </span>
        <span className="text-xs font-mono font-bold" style={{ color }}>
          {value}{max !== 100 ? `/${max}` : ''}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-3/40 overflow-hidden relative border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="h-full rounded-full relative"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}40`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </motion.div>
      </div>
    </div>
  );
}

// ── Signal Badge ────────────────────────────────────────────

export function SignalBadge({ signal }: { signal: string }) {
  const signalMap: Record<string, string> = {
    'Strong Buy': 'signal-strong-buy',
    'Buy': 'signal-buy',
    'Watch': 'signal-watch',
    'Neutral': 'signal-neutral',
    'Caution': 'signal-caution',
    'Avoid': 'signal-avoid',
  };
  const cls = signalMap[signal] || 'signal-neutral';
  return (
    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${cls}`}>
      {signal}
    </span>
  );
}
