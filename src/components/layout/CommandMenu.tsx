'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
}

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Listen for open events
  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('open-command-menu', handleOpen);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('open-command-menu', handleOpen);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Search with debounce
  const search = useCallback(async (q: string) => {
    if (q.length < 1) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
      setSelectedIndex(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  // Navigate to selected result
  const navigate = (symbol: string) => {
    // Check for "vs" comparison
    if (query.toLowerCase().includes(' vs ')) {
      const parts = query.split(/\s+vs\s+/i);
      if (parts.length === 2) {
        router.push(`/compare/${parts[0].trim().toUpperCase()}-vs-${parts[1].trim().toUpperCase()}`);
        setOpen(false);
        return;
      }
    }
    router.push(`/stock/${symbol}`);
    setOpen(false);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      navigate(results[selectedIndex].symbol);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] cmd-overlay flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <svg className="w-5 h-5 text-muted-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search stocks, ETFs... (try 'AAPL vs MSFT')"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder-muted-2 text-sm"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          )}
          <kbd className="text-[10px] text-muted-2 bg-surface-3 px-1.5 py-0.5 rounded border border-border font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto">
          {results.length === 0 && query.length > 0 && !loading && (
            <div className="px-4 py-8 text-center text-muted-2 text-sm">No results found</div>
          )}
          {results.length === 0 && query.length === 0 && (
            <div className="px-4 py-6 space-y-3">
              <p className="text-xs text-muted-2 uppercase tracking-wider font-medium">Quick Access</p>
              {['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'AMZN'].map(s => (
                <button
                  key={s}
                  onClick={() => navigate(s)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
                >
                  <span className="font-mono text-accent-light font-medium w-14 text-left">{s}</span>
                  <span className="text-muted-2">→ View analysis</span>
                </button>
              ))}
            </div>
          )}
          {results.map((r, i) => (
            <button
              key={r.symbol}
              onClick={() => navigate(r.symbol)}
              className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors ${
                i === selectedIndex ? 'bg-accent/10 text-foreground' : 'text-muted hover:bg-surface-2'
              }`}
            >
              <span className="font-mono font-semibold text-accent-light w-16 text-left shrink-0">{r.symbol}</span>
              <span className="flex-1 text-left truncate">{r.name}</span>
              <span className="text-[10px] text-muted-2 bg-surface-3 px-1.5 py-0.5 rounded shrink-0">
                {r.type === 'ETF' ? 'ETF' : 'Stock'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
