// ============================================================
// AlphaLens — AI Multi-Provider with Fallback Chain
// Free tier: Groq → Google AI → Cerebras → OpenRouter
// ============================================================

export interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

interface Provider {
  name: string
  url: string
  model: string
  getKey: () => string | undefined
}

const PROVIDERS: Provider[] = [
  {
    name: "groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.3-70b-versatile",
    getKey: () => process.env.GROQ_API_KEY,
  },
  {
    name: "google",
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    model: "gemini-2.0-flash",
    getKey: () => process.env.GOOGLE_AI_API_KEY,
  },
  {
    name: "cerebras",
    url: "https://api.cerebras.ai/v1/chat/completions",
    model: "llama-3.3-70b",
    getKey: () => process.env.CEREBRAS_API_KEY,
  },
  {
    name: "openrouter",
    url: "https://openrouter.ai/api/v1/chat/completions",
    model: "deepseek/deepseek-chat-v3-0324:free",
    getKey: () => process.env.OPENROUTER_API_KEY,
  },
]

export const FINANCIAL_ANALYST_SYSTEM = `You are a concise quantitative financial analyst at AlphaLens. Rules:
1. Be SPECIFIC with numbers from the data provided.
2. Keep responses under 150 words unless asked for more detail.
3. Mention both positives AND risks.
4. Never say "buy" or "sell" — frame as analysis only.
5. Two short paragraphs max, no headers.
6. If asked about a stock, reference its AlphaScore and key metrics.`

export const AI_CHAT_SYSTEM = `You are AlphaLens AI, a financial analysis assistant. You have access to real-time stock data, AlphaScore ratings, and macroeconomic indicators. Rules:
1. Be specific with numbers when data is provided.
2. Always mention both upside potential and risks.
3. Never give direct buy/sell advice — frame as educational analysis.
4. Keep responses concise and actionable.
5. If asked about a specific stock, ask the user to provide the ticker for live data.`

export async function callAI(
  messages: Message[],
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const { maxTokens = 512, temperature = 0.4 } = options

  for (const provider of PROVIDERS) {
    const key = provider.getKey()
    if (!key) continue

    try {
      const res = await fetch(provider.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          ...(provider.name === "openrouter" ? {
            "HTTP-Referer": "https://alphalens.io",
            "X-Title": "AlphaLens",
          } : {}),
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
        signal: AbortSignal.timeout(12000),
      })

      if (!res.ok) continue

      const data = await res.json()
      const text = data.choices?.[0]?.message?.content?.trim()
      if (text) return text
    } catch {
      continue
    }
  }

  return "" // All providers failed — caller handles gracefully
}

export async function streamAI(
  messages: Message[],
  onChunk: (chunk: string) => void,
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<void> {
  const { maxTokens = 1024, temperature = 0.5 } = options

  for (const provider of PROVIDERS) {
    const key = provider.getKey()
    if (!key) continue

    try {
      const res = await fetch(provider.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          ...(provider.name === "openrouter" ? {
            "HTTP-Referer": "https://alphalens.io",
            "X-Title": "AlphaLens",
          } : {}),
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          max_tokens: maxTokens,
          temperature,
          stream: true,
        }),
        signal: AbortSignal.timeout(30000),
      })

      if (!res.ok || !res.body) continue

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const lines = decoder.decode(value).split("\n")
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const data = line.slice(6)
          if (data === "[DONE]") return
          try {
            const json = JSON.parse(data)
            const chunk = json.choices?.[0]?.delta?.content
            if (chunk) onChunk(chunk)
          } catch {
            // skip malformed chunks
          }
        }
      }
      return // success
    } catch {
      continue
    }
  }
}
