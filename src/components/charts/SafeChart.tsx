'use client';

import { useEffect, useState } from 'react';
import { ResponsiveContainer } from 'recharts';

/**
 * Recharts ResponsiveContainer often throws warnings if rendered server-side
 * or before parent dimensions are settled. This wrapper ensures client-side
 * mounting and avoids width/height -1 issues.
 */
export function SafeResponsiveContainer({ children, height = 300 }: { children: React.ReactNode, height?: number | string }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div style={{ height }} />;

  return (
    <ResponsiveContainer width="100%" height={height as any}>
      {children as any}
    </ResponsiveContainer>
  );
}
