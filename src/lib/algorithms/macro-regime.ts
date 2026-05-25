// ============================================================
// AlphaLens v11 — Macro Regime Detector™
// Classifies macro environment from FRED indicators
// Maps each regime to sector playbook + per-ticker impact
// ============================================================

import type { MacroRegime } from '@/lib/types';

interface FREDInputs {
  cpi: number | null;      // YoY CPI %
  gdp: number | null;      // YoY GDP %
  fedRate: number | null;  // Fed Funds Rate %
  yieldSpread: number | null; // 10Y-2Y spread
  unemployment: number | null; // Unemployment rate %
}

const SECTOR_PLAYBOOKS: Record<string, Record<string, string>> = {
  GOLDILOCKS: {
    Technology: 'outperforms — full risk-on, growth premium expands',
    'Consumer Cyclical': 'outperforms — consumer confidence high',
    'Financial Services': 'outperforms — lending activity robust',
    Healthcare: 'neutral — defense not needed in goldilocks',
    Energy: 'neutral — moderate demand, stable prices',
    Utilities: 'underperforms — yield chase moves to growth',
    'Real Estate': 'outperforms — low rates, rising asset values',
    'Communication Services': 'outperforms — ad spend increases',
    Industrials: 'outperforms — capex cycle accelerates',
    'Consumer Defensive': 'underperforms — rotation to cyclicals',
    'Basic Materials': 'neutral — moderate industrial demand',
  },
  OVERHEATING: {
    Technology: 'mixed — rate sensitivity increases',
    Energy: 'outperforms — demand surge drives commodity prices',
    'Basic Materials': 'outperforms — inflation hedge, commodity exposure',
    'Financial Services': 'mixed — higher rates help NIMs but slow lending',
    Healthcare: 'neutral — defensive quality gains appeal',
    Utilities: 'underperforms — rate competition from bonds',
    'Real Estate': 'underperforms — rising rates compress values',
    'Consumer Cyclical': 'mixed — price pressure on margins',
    'Consumer Defensive': 'neutral — pricing power tested',
    Industrials: 'mixed — input costs rising',
    'Communication Services': 'mixed — ad budgets under review',
  },
  STAGFLATION: {
    Energy: 'outperforms — supply constraints persist',
    Healthcare: 'outperforms — defensive + pricing power',
    'Consumer Defensive': 'outperforms — essential spending resilient',
    Utilities: 'neutral — regulated returns provide floor',
    Technology: 'underperforms — multiple compression, growth deceleration',
    'Consumer Cyclical': 'underperforms — discretionary spending collapses',
    'Financial Services': 'underperforms — credit deterioration',
    'Real Estate': 'underperforms — worst-case combination',
    Industrials: 'underperforms — demand destruction + cost inflation',
    'Basic Materials': 'mixed — cost pressure vs commodity upside',
    'Communication Services': 'underperforms — ad spend cuts',
  },
  RECESSION: {
    Healthcare: 'outperforms — classic defensive outperformer',
    Utilities: 'outperforms — yield + stability premium',
    'Consumer Defensive': 'outperforms — essential spending continues',
    Technology: 'mixed — quality tech holds, speculative collapses',
    'Financial Services': 'underperforms — credit losses, NIM compression',
    'Consumer Cyclical': 'underperforms — consumer retrenchment',
    Energy: 'underperforms — demand destruction',
    Industrials: 'underperforms — capex freeze',
    'Real Estate': 'underperforms — vacancy risk, valuation compression',
    'Basic Materials': 'underperforms — industrial demand collapse',
    'Communication Services': 'mixed — defensive vs ad-dependent split',
  },
  RECOVERY: {
    'Consumer Cyclical': 'outperforms — pent-up demand release',
    Technology: 'outperforms — growth recovery + rate tailwind',
    'Financial Services': 'outperforms — credit recovery, steepening curve',
    Industrials: 'outperforms — capex restart',
    'Real Estate': 'outperforms — policy accommodation + recovery',
    'Basic Materials': 'outperforms — early cycle demand surge',
    Energy: 'mixed — recovery demand vs supply response',
    Healthcare: 'underperforms — rotation away from defensives',
    Utilities: 'underperforms — rotation to cyclicals',
    'Consumer Defensive': 'underperforms — risk appetite returns',
    'Communication Services': 'outperforms — ad spend recovery',
  },
  UNCERTAINTY: {
    Healthcare: 'neutral — quality defensive holds',
    Utilities: 'neutral — yield attracts in confusion',
    Technology: 'mixed — depends on earnings momentum',
    'Financial Services': 'mixed — credit market signals unclear',
    Energy: 'mixed — geopolitical factors dominate',
    'Consumer Cyclical': 'mixed — consumer confidence fragile',
    'Consumer Defensive': 'neutral — stability premium moderate',
    Industrials: 'mixed — capex decisions deferred',
    'Real Estate': 'mixed — rate path uncertainty weighs',
    'Basic Materials': 'mixed — commodity volatility elevated',
    'Communication Services': 'mixed — ad market uncertainty',
  },
};

export function classifyMacroRegime(inputs: FREDInputs): MacroRegime {
  const { cpi, gdp, fedRate, yieldSpread, unemployment } = inputs;

  // Fallback if data is missing
  if (cpi == null || gdp == null) {
    return {
      regime: 'UNCERTAINTY',
      label: 'Macro Uncertainty',
      description: 'Insufficient macro data to classify regime. Exercise caution across sectors.',
      sectorPlaybook: SECTOR_PLAYBOOKS.UNCERTAINTY,
      indicators: inputs,
    };
  }

  let regime: MacroRegime['regime'];

  // Classification logic based on FRED signals
  if (gdp > 2 && cpi < 3 && (unemployment == null || unemployment < 5)) {
    regime = 'GOLDILOCKS';
  } else if (gdp > 2 && cpi >= 3) {
    regime = 'OVERHEATING';
  } else if (gdp < 1 && cpi >= 3) {
    regime = 'STAGFLATION';
  } else if (gdp < 0 || (gdp < 1 && (unemployment != null && unemployment > 6))) {
    regime = 'RECESSION';
  } else if (gdp >= 1 && gdp <= 3 && cpi < 3 && (yieldSpread != null && yieldSpread > 0)) {
    regime = 'RECOVERY';
  } else {
    regime = 'UNCERTAINTY';
  }

  const descriptions: Record<MacroRegime['regime'], string> = {
    GOLDILOCKS:  'Moderate growth, low inflation, supportive labor market. Risk assets favored.',
    OVERHEATING: 'Strong growth with rising inflation. Rate hike risk elevating. Rotate to value.',
    STAGFLATION: 'Weak growth + persistent inflation. Worst-case for risk assets. Embrace defensives.',
    RECESSION:   'Contracting economy. Capital preservation paramount. Quality and yield dominate.',
    RECOVERY:    'Economy inflecting positive. Early cyclicals outperform. Credit improving.',
    UNCERTAINTY: 'Mixed signals across indicators. Diversification and quality emphasized.',
  };

  return {
    regime,
    label: regime.charAt(0) + regime.slice(1).toLowerCase(),
    description: descriptions[regime],
    sectorPlaybook: SECTOR_PLAYBOOKS[regime],
    indicators: inputs,
  };
}

export function getSectorRegimeStance(regime: MacroRegime['regime'], sector: string): string {
  return SECTOR_PLAYBOOKS[regime]?.[sector] || 'mixed — insufficient sector-regime data';
}
