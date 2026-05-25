import { getMacroDashboard as getFredDashboard } from './fred';
import { getQuote, getHistory } from './yahoo';
import type { MacroIndicator } from '@/lib/types';

const FALLBACK_TICKERS: Record<string, { symbol: string; name: string; unit: string; positiveIsGood?: boolean }> = {
  SP500:          { symbol: '^GSPC',    name: 'S&P 500 Index',      unit: 'index',  positiveIsGood: true },
  NASDAQ:         { symbol: '^IXIC',    name: 'Nasdaq Composite',   unit: 'index',  positiveIsGood: true },
  VIX:            { symbol: '^VIX',     name: 'CBOE Volatility Index', unit: 'index', positiveIsGood: false },
  T10Y:           { symbol: '^TNX',     name: '10-Year Treasury Yield', unit: '%',    positiveIsGood: false },
  T5Y:            { symbol: '^FVX',     name: '5-Year Treasury Yield', unit: '%',     positiveIsGood: false },
  DOLLAR:         { symbol: 'DX-Y.NYB', name: 'US Dollar Index',     unit: 'index',  positiveIsGood: true },
  OIL:            { symbol: 'CL=F',     name: 'Crude Oil WTI',       unit: 'USD/bbl', positiveIsGood: false },
  GOLD:           { symbol: 'GC=F',     name: 'Gold Future',         unit: 'USD/oz',  positiveIsGood: true },
  BITCOIN:        { symbol: 'BTC-USD',  name: 'Bitcoin (Live)',      unit: 'USD',    positiveIsGood: true },
};

export async function getMacroData(): Promise<MacroIndicator[]> {
  try {
    // Attempt FRED first
    const fredData = await getFredDashboard();
    if (fredData && fredData.length > 0) return fredData;
  } catch (error) {
    console.warn('Macro: FRED data source failed or key missing. Falling back to Yahoo Finance.', error);
  }

  // Fallback to Yahoo Finance
  console.log('Macro: Engaging Yahoo Finance Fallback Layer');
  const results = await Promise.allSettled(
    Object.entries(FALLBACK_TICKERS).map(async ([key, config]) => {
      const q = await getQuote(config.symbol);
      const hist = await getHistory(config.symbol, '3mo');
      
      const trend = hist.slice(-24).map(h => ({
        date: h.date,
        value: h.close,
      }));

      return {
        key,
        name: config.name,
        current: q.price,
        previous: trend.length > 1 ? trend[trend.length - 2].value : q.price - q.change,
        trend,
        unit: config.unit,
      };
    })
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<MacroIndicator>).value);
}
