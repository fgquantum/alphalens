// ============================================================
// AlphaLens v6 — FRED Macro Data Wrapper
// FREE macro data — 12 key indicators
// ============================================================

import type { MacroIndicator } from '@/lib/types';

const FRED = 'https://api.stlouisfed.org/fred';
const KEY = process.env.FRED_API_KEY || '';

const MACRO_SERIES: Record<string, { id: string; name: string; unit: string }> = {
  FED_RATE:       { id: 'FEDFUNDS', name: 'Fed Funds Rate', unit: '%' },
  T10Y:           { id: 'DGS10', name: '10-Year Treasury', unit: '%' },
  T2Y:            { id: 'DGS2', name: '2-Year Treasury', unit: '%' },
  YIELD_CURVE:    { id: 'T10Y2Y', name: 'Yield Curve (10Y-2Y)', unit: '%' },
  CPI:            { id: 'CPIAUCSL', name: 'Consumer Price Index', unit: 'index' },
  UNEMPLOYMENT:   { id: 'UNRATE', name: 'Unemployment Rate', unit: '%' },
  GDP:            { id: 'A191RL1Q225SBEA', name: 'Real GDP Growth', unit: '%' },
  SP500:          { id: 'SP500', name: 'S&P 500', unit: 'index' },
  VIX:            { id: 'VIXCLS', name: 'VIX Volatility', unit: 'index' },
  DOLLAR:         { id: 'DTWEXBGS', name: 'US Dollar Index', unit: 'index' },
  CONSUMER_SENT:  { id: 'UMCSENT', name: 'Consumer Sentiment', unit: 'index' },
  INITIAL_CLAIMS: { id: 'ICSA', name: 'Initial Jobless Claims', unit: 'thousands' },
};

interface FredObservation {
  date: string;
  value: string;
}

async function fetchSeries(seriesId: string, limit = 50): Promise<FredObservation[]> {
  const url = `${FRED}/series/observations?series_id=${seriesId}&api_key=${KEY}&file_type=json&sort_order=desc&limit=${limit}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`FRED ${res.status}: ${res.statusText}`);
  const data = await res.json() as { observations: FredObservation[] };
  return data.observations || [];
}

export async function getMacroDashboard(): Promise<MacroIndicator[]> {
  const entries = Object.entries(MACRO_SERIES);

  const results = await Promise.allSettled(
    entries.map(async ([key, { id, name, unit }]) => {
      const obs = await fetchSeries(id, 50);
      const parsed = obs
        .filter(o => o.value !== '.')
        .map(o => ({ date: o.date, value: parseFloat(o.value) }));

      return {
        key,
        name,
        current: parsed[0]?.value ?? null,
        previous: parsed[1]?.value ?? null,
        trend: parsed.slice(0, 12).reverse(),
        unit,
      };
    })
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<MacroIndicator>).value);
}

export async function getSingleSeries(key: string): Promise<MacroIndicator | null> {
  const series = MACRO_SERIES[key];
  if (!series) return null;

  try {
    const obs = await fetchSeries(series.id, 50);
    const parsed = obs
      .filter(o => o.value !== '.')
      .map(o => ({ date: o.date, value: parseFloat(o.value) }));

    return {
      key,
      name: series.name,
      current: parsed[0]?.value ?? null,
      previous: parsed[1]?.value ?? null,
      trend: parsed.slice(0, 24).reverse(),
      unit: series.unit,
    };
  } catch {
    return null;
  }
}

export { MACRO_SERIES };
