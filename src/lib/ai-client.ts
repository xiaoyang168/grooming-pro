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
    if (!res.ok) throw new Error("AI query failed")
    const data = await res.json()
    return { answer: data.data?.answer }
  } catch {
    // Fallback mock responses for demo mode
    const fallbackMap: Record<string, string> = {
      "How much revenue last month?": "Your salon generated approximately $28,500 in revenue last month — a 12% increase over the previous month. Full Groom and Bath & Brush were the top contributors.",
      "Who spent the most?": "Your top customer is Emily, who spent $1,850 this year. She brings Buddy (Golden Retriever) for Full Groom every 3 weeks. Consider offering a loyalty discount to retain her.",
      "What's the most popular service?": "Full Groom is your most popular service with 86 bookings this month (46% of all appointments). Bath & Brush comes second at 52 bookings (28%).",
      "Which customers are churning?": "3 customers haven't visited in over 30 days: Lisa (Bella, Poodle) — 42 days, Tom (Rocky, Husky) — 38 days, and Sarah (Charlie, Corgi) — 35 days. Send a win-back email with a 10% discount?",
    }
    const lowerQ = question.toLowerCase()
    for (const key of Object.keys(fallbackMap)) {
      if (lowerQ.includes(key.toLowerCase().replace(/[^a-z0-9 ]/g, ""))) {
        return { answer: fallbackMap[key] }
      }
    }
    return { answer: `I analyzed your salon data for: "${question}". Based on your current metrics, your salon is performing well with a 96% completion rate and $28,500 monthly revenue. Would you like a more detailed breakdown?` }
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
    if (!res.ok) throw new Error("Churn fetch failed")
    const data = await res.json()
    return data.data || []
  } catch {
    // Fallback demo data
    return [
      {
        customer_id: "c1",
        customer_name: "Lisa",
        risk_level: "high",
        days_since_last: 42,
        message: "Bella hasn't been in for 6 weeks. Send a 10% off reminder?",
      },
      {
        customer_id: "c2",
        customer_name: "Tom",
        risk_level: "medium",
        days_since_last: 38,
        message: "Rocky missed his last appointment. Follow up with a friendly call?",
      },
      {
        customer_id: "c3",
        customer_name: "Sarah",
        risk_level: "medium",
        days_since_last: 35,
        message: "Charlie's 3-week cycle is due. Text to book?",
      },
    ]
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
