import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AlphaLens\u2122 \u2014 See What the Market Misses",
  description: "Institutional-grade stock intelligence platform. 12 proprietary algorithms, AlphaScore\u2122 ratings, and pre-computed AI analysis for 50,000+ tickers. Bloomberg depth. Zero price.",
  keywords: "stock analysis, AlphaScore, stock screener, financial analysis, AI stock analyzer, ETF analysis, institutional intelligence, free Bloomberg alternative",
  openGraph: {
    title: "AlphaLens\u2122 \u2014 See What the Market Misses",
    description: "12 proprietary algorithms. One score. Total clarity. Institutional intelligence at zero cost.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-screen bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
