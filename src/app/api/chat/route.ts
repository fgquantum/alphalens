import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { streamAI, callAI, AI_CHAT_SYSTEM, type Message } from "@/lib/ai/provider"

// Rate limit: free = 20 msgs/day, pro = 200, elite = unlimited
const DAILY_LIMITS: Record<string, number> = {
  free: 20,
  pro: 200,
  elite: -1,
}

// Simple in-memory rate tracking (resets on server restart; use Redis in prod)
const dailyUsage = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string, plan: string): { allowed: boolean; remaining: number } {
  const limit = DAILY_LIMITS[plan] ?? 20
  if (limit === -1) return { allowed: true, remaining: -1 }

  const now = Date.now()
  const midnight = new Date()
  midnight.setHours(24, 0, 0, 0)
  const resetAt = midnight.getTime()

  const entry = dailyUsage.get(userId)
  if (!entry || now > entry.resetAt) {
    dailyUsage.set(userId, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to use AI Chat" }, { status: 401 })
  }

  const { messages, stream = false } = await req.json() as {
    messages: Message[]
    stream?: boolean
  }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Messages required" }, { status: 400 })
  }

  const plan = session.user.plan ?? "free"
  const { allowed, remaining } = checkRateLimit(session.user.id, plan)

  if (!allowed) {
    return NextResponse.json({
      error: `Daily AI limit reached (${DAILY_LIMITS[plan]} messages/day on ${plan} plan). Resets at midnight.`
    }, { status: 429 })
  }

  // Prepend system message
  const fullMessages: Message[] = [
    { role: "system", content: AI_CHAT_SYSTEM },
    ...messages.slice(-20), // keep last 20 messages for context
  ]

  if (stream) {
    // Streaming response
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          await streamAI(fullMessages, (chunk) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`))
          })
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
        } catch {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-AI-Remaining": remaining.toString(),
      },
    })
  }

  // Non-streaming
  const response = await callAI(fullMessages)
  if (!response) {
    return NextResponse.json({ error: "AI service temporarily unavailable" }, { status: 503 })
  }

  return NextResponse.json({
    message: response,
    remaining,
  }, {
    headers: { "X-AI-Remaining": remaining.toString() },
  })
}
