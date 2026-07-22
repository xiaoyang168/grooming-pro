import { useState, useCallback } from "react"

export interface AiQueryResponse {
  answer?: string
  error?: string
}

export async function askAiQuestion(question: string): Promise<AiQueryResponse> {
  try {
    const res = await fetch("/api/ai/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    })
    const data = await res.json()
    if (!res.ok) {
      // Show actual API error (e.g. paywall, trial ended)
      return { error: data.error || "AI query failed" }
    }
    return { answer: data.data?.answer }
  } catch {
    return { error: "Network error — please check your connection" }
  }
}

export interface ChurnAlert {
  customer_id: string
  customer_name: string
  risk_level: "low" | "medium" | "high"
  days_since_last: number
  message: string
}

export async function getChurnAlerts(): Promise<ChurnAlert[]> {
  try {
    const res = await fetch("/api/ai/churn")
    if (!res.ok) return [] // silently return empty on error
    const data = await res.json()
    return data.data || []
  } catch {
    return []
  }
}

export function useAiQuery() {
  const [answer, setAnswer] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const query = useCallback(async (question: string) => {
    setLoading(true)
    setError("")
    setAnswer("")
    const result = await askAiQuestion(question)
    if (result.error) setError(result.error)
    else setAnswer(result.answer || "")
    setLoading(false)
  }, [])

  return { answer, loading, error, query, setAnswer }
}
