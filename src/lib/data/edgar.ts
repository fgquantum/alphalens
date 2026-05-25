// ============================================================
// AlphaLens v6 — SEC EDGAR Data Wrapper
// FREE government data — XBRL financials + insider filings
// ============================================================

const EDGAR = 'https://data.sec.gov';
const UA = 'AlphaLens contact@alphalens.io'; // Required by SEC

async function edgarFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`SEC EDGAR ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ── Company CIK Lookup ──────────────────────────────────────

const CIK_CACHE = new Map<string, string>();

export async function getCIK(ticker: string): Promise<string | null> {
  const cached = CIK_CACHE.get(ticker.toUpperCase());
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://efts.sec.gov/LATEST/search-index?q=%22${ticker}%22&dateRange=custom&startdt=2024-01-01&forms=10-K`,
      { headers: { 'User-Agent': UA } }
    );
    if (!res.ok) return null;
    const data = await res.json() as { hits?: { hits?: Array<{ _source?: { entity_id?: string } }> } };
    const cik = data?.hits?.hits?.[0]?._source?.entity_id;
    if (cik) CIK_CACHE.set(ticker.toUpperCase(), cik);
    return cik || null;
  } catch {
    return null;
  }
}

// ── Company Facts (XBRL) ───────────────────────────────────

export interface EdgarCompanyFacts {
  cik: number;
  entityName: string;
  facts: {
    'us-gaap'?: Record<string, {
      label: string;
      description: string;
      units: Record<string, Array<{
        val: number;
        accn: string;
        fy: number;
        fp: string;
        form: string;
        filed: string;
        end: string;
        start?: string;
      }>>;
    }>;
  };
}

export async function getCompanyFacts(cik: string): Promise<EdgarCompanyFacts | null> {
  try {
    return await edgarFetch<EdgarCompanyFacts>(
      `${EDGAR}/api/xbrl/companyfacts/CIK${cik.padStart(10, '0')}.json`
    );
  } catch {
    return null;
  }
}

// ── Extract specific financial metric from EDGAR ────────────

export function extractMetric(
  facts: EdgarCompanyFacts | null,
  concept: string,
  unit = 'USD'
): Array<{ year: number; quarter: string; value: number; filed: string }> {
  if (!facts?.facts?.['us-gaap']?.[concept]) return [];
  const entries = facts.facts['us-gaap'][concept].units[unit] || [];
  
  return entries
    .filter(e => e.form === '10-K' || e.form === '10-Q')
    .sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime())
    .slice(0, 20)
    .map(e => ({
      year: e.fy,
      quarter: e.fp,
      value: e.val,
      filed: e.filed,
    }));
}

// ── Common Financial Concepts from EDGAR ────────────────────

export const EDGAR_CONCEPTS = {
  revenue: 'Revenues',
  revenueFallback: 'RevenueFromContractWithCustomerExcludingAssessedTax',
  netIncome: 'NetIncomeLoss',
  totalAssets: 'Assets',
  totalLiabilities: 'Liabilities',
  totalEquity: 'StockholdersEquity',
  operatingIncome: 'OperatingIncomeLoss',
  eps: 'EarningsPerShareDiluted',
  shares: 'CommonStockSharesOutstanding',
  longTermDebt: 'LongTermDebt',
} as const;
