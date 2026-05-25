import { Metadata, ResolvingMetadata } from 'next';
import { getStockPageData } from '@/lib/data/router';

export async function generateMetadata(
  { params }: { params: Promise<{ symbol: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const symbol = resolvedParams.symbol.toUpperCase();
  
  try {
    const data = await getStockPageData(symbol);
    const title = `${symbol} Stock AI Analysis — AlphaScore: ${data.alphaScore.overall}`;
    const description = `${data.quote.name} is currently trading at $${data.quote.price.toFixed(2)}. Read our real-time AI breakdown.`;
    
    // Construct the OG API url
    const ogUrl = new URL(`https://alphalens.vercel.app/api/og`);
    ogUrl.searchParams.set('symbol', symbol);
    ogUrl.searchParams.set('score', data.alphaScore.overall.toString());
    ogUrl.searchParams.set('price', data.quote.price.toFixed(2));
    ogUrl.searchParams.set('change', data.quote.changePct.toFixed(2));

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [
          {
            url: ogUrl.toString(),
            width: 1200,
            height: 630,
            alt: `${symbol} AlphaScore Analysis`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogUrl.toString()],
      },
    };
  } catch (error) {
    return {
      title: `${symbol} | AlphaLens`,
    }
  }
}

export default function StockLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
