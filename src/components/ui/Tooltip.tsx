'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: number;
  delay?: number;
}

export function Tooltip({ content, children, position = 'top', maxWidth = 300, delay = 200 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  useEffect(() => {
    if (visible && triggerRef.current && tooltipRef.current) {
      const trigger = triggerRef.current.getBoundingClientRect();
      const tooltip = tooltipRef.current.getBoundingClientRect();
      const gap = 8;

      let x = 0, y = 0;
      switch (position) {
        case 'top':
          x = trigger.left + trigger.width / 2 - tooltip.width / 2;
          y = trigger.top - tooltip.height - gap;
          break;
        case 'bottom':
          x = trigger.left + trigger.width / 2 - tooltip.width / 2;
          y = trigger.bottom + gap;
          break;
        case 'left':
          x = trigger.left - tooltip.width - gap;
          y = trigger.top + trigger.height / 2 - tooltip.height / 2;
          break;
        case 'right':
          x = trigger.right + gap;
          y = trigger.top + trigger.height / 2 - tooltip.height / 2;
          break;
      }

      // Clamp to viewport
      x = Math.max(8, Math.min(x, window.innerWidth - tooltip.width - 8));
      y = Math.max(8, Math.min(y, window.innerHeight - tooltip.height - 8));

      setCoords({ x, y });
    }
  }, [visible, position]);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex cursor-help"
      >
        {children}
      </span>
      {visible && (
        <div
          ref={tooltipRef}
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: coords.x,
            top: coords.y,
            maxWidth,
          }}
        >
          <div className="bg-[#1C2130] border border-white/10 rounded-xl px-3.5 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.6)] animate-fade-in">
            <div className="text-xs text-foreground leading-relaxed">
              {content}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Simple inline info icon with tooltip
export function InfoTip({ text, label }: { text: string; label?: string }) {
  return (
    <Tooltip content={text}>
      <span className="inline-flex items-center gap-1 text-muted-2 hover:text-muted transition-colors">
        {label && <span>{label}</span>}
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 12.5a5.5 5.5 0 110-11 5.5 5.5 0 010 11zM8 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 018 5zm0-1.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
        </svg>
      </span>
    </Tooltip>
  );
}

// Metric definitions for tooltips across the app
export const METRIC_TOOLTIPS: Record<string, string> = {
  // AlphaScore dimensions
  'AlphaScore': 'Proprietary composite score (0-100) combining 54 metrics across 6 dimensions: Value, Quality, Growth, Momentum, Safety, and Dividend. Scored relative to sector medians.',
  'Value': 'Measures how cheap the stock is vs sector peers using P/E, EV/EBITDA, P/FCF, PEG, DCF upside, and 5 other valuation ratios.',
  'Quality': 'Assesses fundamental business excellence via ROIC, margins, debt levels, earnings quality, and insider activity.',
  'Growth': 'Evaluates revenue, EPS, and FCF growth trajectories plus analyst revision momentum and earnings beat rates.',
  'Momentum': 'Directional price action strength using TSI, MA stacking, RSI zones, and volume confirmation.',
  'Safety': 'Downside protection score from debt ratios, beta, max drawdown, volatility, and Altman Z-Score.',
  'Dividend': 'Yield sustainability analysis: payout ratio, coverage, growth trajectory, and consecutive years.',

  // Proprietary scores
  'TSI': 'Trend Strength Index (0-100). 6-component directional conviction measuring ADX, Bollinger width, volume, MA stack, DI divergence, and R-squared. >80 = strong trend.',
  'EQS': 'Earnings Quality Score (0-100). Combines Beneish M-Score with 5 proprietary accrual flags to detect accounting manipulation before it hits the stock.',
  'AlphaMomentum': 'Volatility-adjusted, skip-1-month momentum ranked within sector. Rank 90 = top 10% of sector. Uses 12m, 6m, 3m returns divided by annualized volatility.',
  'SMI': 'Smart Money Index (0-100). Separates institutional end-of-day accumulation from retail opening-gap reactions. >75 = strong institutional buying.',
  'CER': 'Capital Efficiency Ratio (0-100). ROIC per unit of leverage. Penalizes debt-driven ROE inflation, rewards genuine returns on invested capital.',
  'Piotroski': 'Piotroski F-Score (0-9). Nine binary signals of fundamental improvement: profitability, leverage, liquidity, and operating efficiency.',
  'VolRegime': 'Classifies current volatility vs 1Y history. COMPRESSION = breakout imminent. CRISIS = extreme risk. NORMAL = typical range.',
  'EarningsMomentum': 'Forward-looking signal (0-100). Measures analyst estimate revision trajectory + beat consistency. High scores predict 3-6M outperformance.',
  'MacroRegime': 'Classifies macro environment from 6 FRED indicators into: Goldilocks, Overheating, Stagflation, Recession, Recovery, or Uncertainty.',
  'BeneishM': 'Academic 8-variable model detecting earnings manipulation. Score > -1.78 signals statistical manipulation risk.',

  // Common financial metrics
  'P/E': 'Price-to-Earnings ratio. Current stock price divided by earnings per share. Lower = cheaper relative to earnings. Compare within sector.',
  'Fwd P/E': 'Forward P/E uses estimated future earnings. Lower than trailing P/E suggests expected earnings growth.',
  'EV/EBITDA': 'Enterprise Value to EBITDA. Debt-adjusted valuation metric preferred by institutional investors. Lower = cheaper.',
  'P/FCF': 'Price to Free Cash Flow. Measures what you pay per dollar of real cash generated. More reliable than P/E for quality assessment.',
  'PEG': 'Price/Earnings to Growth ratio. P/E divided by earnings growth rate. <1 = potentially undervalued growth. >2 = expensive.',
  'P/B': 'Price-to-Book ratio. Market value vs accounting book value. <1 may signal undervaluation or distress.',
  'P/S': 'Price-to-Sales ratio. Useful for unprofitable companies. Lower = cheaper per dollar of revenue.',
  'ROIC': 'Return on Invested Capital. The king of quality metrics. Measures how efficiently the company turns invested capital into profits.',
  'ROE': 'Return on Equity. Net income / shareholders equity. Can be inflated by high leverage.',
  'Gross Margin': 'Revenue minus cost of goods, as % of revenue. Higher = stronger pricing power and competitive moat.',
  'Net Margin': 'Net income as % of revenue. Shows bottom-line profitability after all expenses.',
  'FCF Margin': 'Free cash flow as % of revenue. Shows real cash generation ability after capital expenditures.',
  'D/E': 'Debt-to-Equity ratio. Total debt / shareholders equity. <1 = more equity than debt. >2 = heavily leveraged.',
  'Current Ratio': 'Current assets / current liabilities. >1.5 = comfortable liquidity. <1 = potential cash crunch.',
  'Altman Z': 'Bankruptcy prediction model. >3 = safe, 1.8-3 = grey zone, <1.8 = distress zone.',
  'Beta': 'Volatility vs market. 1.0 = moves with market. >1.5 = significantly more volatile. <0.8 = defensive.',
  'RSI': 'Relative Strength Index (0-100). >70 = overbought, may pull back. <30 = oversold, may bounce.',
  'Short Float': 'Percentage of float sold short. >10% = elevated bearish sentiment. >20% = potential squeeze candidate.',
  'Div Yield': 'Annual dividends / stock price. Higher yield = more income, but verify sustainability via payout ratio.',
  'Market Cap': 'Total market value of all outstanding shares. Mega (>$200B), Large ($10-200B), Mid ($2-10B), Small (<$2B).',
  'Rev Growth': 'Year-over-year revenue growth rate. Shows if the company is expanding its top line.',
  'EPS Growth': 'Year-over-year earnings per share growth. Shows bottom-line growth trajectory.',
  'Insider Net': 'Net insider buying/selling in last 90 days. Positive = insiders buying = bullish signal.',
};
