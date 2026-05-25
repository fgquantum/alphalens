import { NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(request: Request) {
  try {
    const { symbol, name, alphaScore, fairValue, metrics, isBullish } = await request.json();

    if (!GROQ_API_KEY) {
      return NextResponse.json({ summary: "AI analysis is currently unavailable because the API key is not configured." });
    }

    const prompt = `You are a professional quantitative financial analyst at AlphaLens.
Analyze the following stock in 3 to 4 concise sentences. Be direct, professional, and slightly witty without being cringey.
Provide a clear verdict on whether this is a strong buy, neutral, or sell based on the metrics.

Stock: ${name} (${symbol})
AlphaScore (0-100): ${alphaScore}
Fair Value Estimate: $${fairValue}
Current Price: $${metrics.price}
P/E Ratio: ${metrics.pe}
Dividend Yield: ${metrics.dividend}%

Is purely bullish? ${isBullish ? 'Yes, trend is strong' : 'No, mixed or bearish signals'}

Do not include any disclaimers like "This is not financial advice."`;

    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      console.error('Groq API Error:', await res.text());
      return NextResponse.json({ summary: "AI analysis failed to generate. Please try again later." });
    }

    const data = await res.json();
    const summary = data.choices[0].message.content.trim();

    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json({ summary: "AI analysis service is temporarily down." }, { status: 500 });
  }
}
