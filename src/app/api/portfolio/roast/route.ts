import { NextResponse } from 'next/server';
import { getStockPageData } from '@/lib/data/router';

export async function POST(request: Request) {
  try {
    const { positions } = await request.json() as { positions: { symbol: string, weight: number }[] };
    if (!positions || positions.length === 0) {
      return NextResponse.json({ error: 'No positions provided' }, { status: 400 });
    }

    const results = await Promise.allSettled(
      positions.map(p => getStockPageData(p.symbol))
    );

    let totalAlpha = 0;
    let totalWeight = 0;
    const diagnostics = {
      value: 0, growth: 0, momentum: 0, quality: 0, safety: 0, dividend: 0
    };

    let validCount = 0;

    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value) {
        const weight = positions[i].weight;
        const score = r.value.alphaScore.overall;
        totalAlpha += score * weight;
        totalWeight += weight;

        diagnostics.value += r.value.alphaScore.subScores.value * weight;
        diagnostics.growth += r.value.alphaScore.subScores.growth * weight;
        diagnostics.momentum += r.value.alphaScore.subScores.momentum * weight;
        diagnostics.quality += r.value.alphaScore.subScores.quality * weight;
        diagnostics.safety += r.value.alphaScore.subScores.safety * weight;
        diagnostics.dividend += r.value.alphaScore.subScores.dividend * weight;
        validCount++;
      }
    });

    if (totalWeight === 0) {
      return NextResponse.json({ error: 'Failed to evaluate positions' }, { status: 500 });
    }

    const avgAlpha = totalAlpha / totalWeight;
    const avgDiags = {
      value: diagnostics.value / totalWeight,
      growth: diagnostics.growth / totalWeight,
      momentum: diagnostics.momentum / totalWeight,
      quality: diagnostics.quality / totalWeight,
      safety: diagnostics.safety / totalWeight,
      dividend: diagnostics.dividend / totalWeight,
    };

    // Generate a fun "Roast"
    let roast = "";
    if (avgAlpha > 80) roast = "This portfolio is a masterpiece. We can't even roast you. Your allocation is extremely high quality.";
    else if (avgAlpha > 60) roast = "Solid portfolio. You have good taste, but there are some definite underperformers dragging your AlphaScore down.";
    else if (avgAlpha > 40) roast = "You're basically playing standard index funds with extra steps and less efficiency. It's safe, but extremely mediocre.";
    else roast = "Are you trying to lose money? This is a dumpster fire. Your risk exposure is high, and the quality of these assets is deeply questionable.";

    // Sub-roast
    let advice = [];
    if (avgDiags.safety < 30) advice.push("Your safety score is terrible. You're holding highly volatile/bankrupt-risk stocks.");
    if (avgDiags.value < 40) advice.push("You love overpaying for stocks. Valuation here is disconnected from reality.");
    if (avgDiags.momentum > 80) advice.push("You're a momentum chaser. Be careful when the trend reverses, your portfolio will bleed.");

    return NextResponse.json({
      score: Math.round(avgAlpha),
      diagnostics: avgDiags,
      roast,
      advice
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to process roast' }, { status: 500 });
  }
}
