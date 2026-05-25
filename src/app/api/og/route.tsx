import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol') || 'AlphaLens';
    const score = searchParams.get('score') || 'N/A';
    const price = searchParams.get('price') || '0.00';
    const change = searchParams.get('change') || '0.00';

    const isPositive = parseFloat(change) >= 0;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0F1015', // surface
            fontFamily: 'sans-serif',
            position: 'relative'
          }}
        >
          {/* Background grid */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle at 25px 25px, #8b8da0 2%, transparent 0%), radial-gradient(circle at 75px 75px, #8b8da0 2%, transparent 0%)', backgroundSize: '100px 100px' }} />
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#161720', padding: '60px', borderRadius: '32px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h1 style={{ fontSize: 100, fontWeight: 'bold', color: '#fff', margin: 0, letterSpacing: '-0.05em' }}>
              {symbol}
            </h1>
            
            <div style={{ display: 'flex', marginTop: 20, alignItems: 'center' }}>
              <span style={{ fontSize: 60, fontWeight: 'bold', color: '#fff' }}>${price}</span>
              <span style={{ fontSize: 40, fontWeight: 'bold', color: isPositive ? '#22c55e' : '#ef4444', marginLeft: 20 }}>
                {isPositive ? '+' : ''}{change}
              </span>
            </div>

            <div style={{ display: 'flex', marginTop: 60, padding: '20px 40px', backgroundColor: '#6366f120', border: '2px solid #6366f1', borderRadius: '20px' }}>
              <span style={{ fontSize: 50, color: '#8b8da0', marginRight: 20 }}>AlphaScore™</span>
              <span style={{ fontSize: 60, fontWeight: 'bold', color: '#6366f1' }}>{score} / 100</span>
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: 40, right: 40, fontSize: 30, color: '#8b8da0', fontWeight: 'bold' }}>
            AlphaLens v6 AI Analyzer
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate image`, {status: 500});
  }
}
