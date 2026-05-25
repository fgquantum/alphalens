"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import {
  Send, Bot, User, Sparkles, RefreshCw, LogIn,
  TrendingUp, BarChart3, Globe, Briefcase, AlertCircle
} from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
  loading?: boolean
}

const STARTER_PROMPTS = [
  { icon: TrendingUp, text: "What makes a stock have a high AlphaScore?" },
  { icon: BarChart3, text: "Explain the difference between P/E and EV/EBITDA" },
  { icon: Globe, text: "What does the current macro regime mean for tech stocks?" },
  { icon: Briefcase, text: "How should I think about portfolio concentration risk?" },
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Check auth status
  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(data => setIsLoggedIn(!!data?.user))
      .catch(() => setIsLoggedIn(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || loading) return

    setInput("")
    setError("")
    const userMsg: Message = { role: "user", content }
    const loadingMsg: Message = { role: "assistant", content: "", loading: true }

    setMessages(prev => [...prev, userMsg, loadingMsg])
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          stream: false,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessages(prev => prev.slice(0, -1)) // remove loading
        setError(data.error || "Failed to get response")
        if (res.status === 401) setIsLoggedIn(false)
        return
      }

      if (data.remaining !== undefined) setRemaining(data.remaining)

      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: "assistant", content: data.message },
      ])
    } catch {
      setMessages(prev => prev.slice(0, -1))
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const clearChat = () => {
    setMessages([])
    setError("")
  }

  if (isLoggedIn === false) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-4 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-ai/10 border border-ai/15 flex items-center justify-center mx-auto">
          <Bot className="w-6 h-6 text-ai" />
        </div>
        <h1 className="text-2xl font-black text-foreground font-display">AlphaLens AI</h1>
        <p className="text-sm text-muted">Sign in to chat with your AI financial analyst. Ask about stocks, strategies, and market conditions.</p>
        <Link href="/login" className="inline-flex items-center gap-2 btn-primary text-sm px-6 py-3">
          <LogIn className="w-4 h-4" /> Sign In to Chat
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-120px)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ai/10 border border-ai/15 flex items-center justify-center">
            <Bot className="w-5 h-5 text-ai" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground font-display tracking-tight">AlphaLens AI</h1>
            <p className="text-xs text-muted">
              {remaining !== null
                ? remaining === -1
                  ? "Unlimited messages"
                  : `${remaining} messages remaining today`
                : "Powered by Groq · Gemini · Cerebras"
              }
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2/60 border border-white/[0.06] text-xs text-muted hover:text-foreground transition-all">
            <RefreshCw className="w-3.5 h-3.5" /> New Chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 hide-scrollbar">
        {messages.length === 0 ? (
          <div className="space-y-6 py-4">
            {/* Welcome */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-ai/10 border border-ai/15 flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7 text-ai" />
              </div>
              <h2 className="text-lg font-bold text-foreground font-display">How can I help you today?</h2>
              <p className="text-sm text-muted max-w-sm mx-auto">
                Ask me about stocks, financial metrics, market conditions, or investment strategies.
              </p>
            </div>

            {/* Starter prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STARTER_PROMPTS.map((p, i) => {
                const Icon = p.icon
                return (
                  <button key={i} onClick={() => sendMessage(p.text)}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-2/40 border border-white/[0.04] hover:border-ai/20 hover:bg-ai/[0.03] text-left transition-all group">
                    <div className="w-7 h-7 rounded-lg bg-ai/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-ai" />
                    </div>
                    <span className="text-sm text-muted group-hover:text-foreground transition-colors leading-relaxed">{p.text}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-ai/15 border border-ai/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-ai" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-accent/10 border border-accent/15 text-foreground"
                  : "bg-surface-2/60 border border-white/[0.06] text-foreground"
              }`}>
                {msg.loading ? (
                  <div className="flex items-center gap-2 text-muted">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(j => (
                        <span key={j} className="w-1.5 h-1.5 rounded-full bg-ai/60 animate-bounce"
                          style={{ animationDelay: `${j * 0.15}s` }} />
                      ))}
                    </div>
                    <span className="text-xs">Thinking...</span>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-accent" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-bear/8 border border-bear/20 text-bear px-4 py-2.5 rounded-xl text-sm mt-2 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Input */}
      <div className="mt-3 shrink-0">
        <div className="flex gap-2 items-end bg-surface-2/60 border border-white/[0.06] rounded-2xl p-2 focus-within:border-ai/30 focus-within:ring-2 focus-within:ring-ai/8 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Ask about stocks, markets, strategies..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-2 outline-none resize-none max-h-32 py-1.5 px-2"
            style={{ minHeight: "36px" }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-9 h-9 rounded-xl bg-ai flex items-center justify-center text-white hover:bg-ai/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-muted-2 text-center mt-2">
          AI analysis is for educational purposes only. Not financial advice. Press Enter to send, Shift+Enter for new line.
        </p>
      </div>
    </div>
  )
}
