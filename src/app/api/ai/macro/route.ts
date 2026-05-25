import { NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(request: Request) {
  try {
    const { macroData } = await request.json();

    if (!GROQ_API_KEY) {
      // Return a deterministic analysis if AI is not available
      const summary = generateRulesBasedAnalysis(macroData);
      return NextResponse.json({ summary });
    }

    const prompt = `You are the Chief Global Economist at AlphaLens.
Analyze the following live macroeconomic data consisting of various FRED indicators (GDP, CPI, Interest Rates, Unemployment, etc).
Write a 3-paragraph executive brief for retail investors explaining the current macroeconomic climate and what it means for the stock market.
Be highly analytical, authoritative, and mention exact numbers where relevant. Do not include boilerplate disclaimers.

Data Snapshot:
${JSON.stringify(macroData)}
`;

    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 350,
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      const summary = generateRulesBasedAnalysis(macroData);
      return NextResponse.json({ summary: `${summary}\n\n[Note: Data-driven heuristic generated; AI currently offline]` });
    }

    const data = await res.json();
    const summary = data.choices[0].message.content.trim();

    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json({ summary: "AI macro insight service is down." }, { status: 500 });
  }
}

function generateRulesBasedAnalysis(data: any[]) {
  const spy = data.find(d => d.name.includes('S&P'));
  const vix = data.find(d => d.name.includes('VIX'));
  const yield10 = data.find(d => d.name.includes('10-Year'));

  let analysis = "Current market conditions suggest a period of ";
  
  if (vix && vix.value > 25) analysis += "elevated instability and risk-off sentiment. ";
  else if (vix && vix.value > 15) analysis += "moderate volatility with balanced supply and demand. ";
  else analysis += "complacency or low-volatility accumulation. ";

  if (spy && spy.value > 5000) analysis += `The S&P 500 is trading at historically elevated levels ($${spy.value.toLocaleString()}), suggesting strong momentum but potential valuation concerns. `;

  if (yield10) {
    analysis += `Treasury yields at ${yield10.value}% provide a significant benchmark for equity valuations. `;
    if (yield10.value > 4.5) analysis += "High yields may pressure growth valuations in the short term. ";
  }

  analysis += "\n\nInstitutional flows appear to be prioritizing capital preservation while monitoring the yield curve for recessionary signals. Retail investors should remain focused on high-quality cash flows.";

  return analysis;
}
