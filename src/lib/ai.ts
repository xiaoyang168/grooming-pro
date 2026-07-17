// ============================================================
// GroomingPro — AI Service (DeepSeek)
// ============================================================

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"

interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

async function callDeepSeek(messages: ChatMessage[], temperature = 0.7): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY not configured")

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      temperature,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

// ── AI Scheduling Suggestions ──────────────────────────────
export async function getScheduleSuggestions(context: {
  appointments: Array<{ start_time: string; end_time: string; staff_id: string }>
  staff: Array<{ id: string; name: string }>
  service_duration: number
  preferred_date: string
  business_hours: { open: string; close: string }
}): Promise<string> {
  const prompt = `You are an AI scheduling assistant for a pet grooming salon.
Given the current schedule and constraints, suggest the best time slots.

Current appointments: ${JSON.stringify(context.appointments)}
Available staff: ${JSON.stringify(context.staff)}
Requested service duration: ${context.service_duration} minutes
Preferred date: ${context.preferred_date}
Business hours: ${JSON.stringify(context.business_hours)}

Suggest 3 best time slots with staff assignments. For each, explain why.
Respond in JSON format: [{ "staff_name": "...", "start_time": "HH:MM", "score": 0-100, "reason": "..." }]`

  return callDeepSeek([{ role: "user", content: prompt }], 0.3)
}

// ── AI Churn Risk Analysis ─────────────────────────────────
export async function analyzeChurnRisk(context: {
  customers: Array<{
    id: string
    name: string
    last_visit: string
    total_visits: number
    total_spent: number
  }>
}): Promise<string> {
  const prompt = `You are an AI customer retention analyst for a pet grooming salon.
Analyze these customers for churn risk:
${JSON.stringify(context.customers)}

For each customer at risk (>30 days since last visit), provide:
1. Risk level: low/medium/high
2. Days since last visit
3. A personalized re-engagement message (1 sentence)

Respond in JSON: [{ "customer_id": "...", "risk_level": "...", "days_since_last": N, "message": "..." }]`

  return callDeepSeek([{ role: "user", content: prompt }], 0.5)
}

// ── AI Natural Language Query ──────────────────────────────
export async function naturalLanguageQuery(context: {
  question: string
  shop_data: {
    total_customers: number
    total_pets: number
    total_appointments: number
    monthly_revenue: number
    top_services: Array<{ name: string; count: number }>
    top_customers: Array<{ name: string; spent: number }>
  }
}): Promise<string> {
  const prompt = `You are an AI business analyst for a pet grooming salon.
Answer the user's question based on this data (all amounts are in USD):
${JSON.stringify(context.shop_data)}

Question: "${context.question}"

Answer concisely with dollar amounts formatted as $X. If the question requires a chart, suggest the chart type.
Only answer based on the provided data. Do not make up numbers.`

  return callDeepSeek([{ role: "user", content: prompt }], 0.7)
}

// ── AI Pet Care Suggestions ────────────────────────────────
export async function getPetCareSuggestions(pet: {
  name: string
  breed: string
  age_years: number
  species: string
  allergies: string[]
  last_visit: string
}): Promise<string> {
  const prompt = `You are an AI pet care advisor.
Given this pet's profile, suggest personalized care recommendations:
${JSON.stringify(pet)}

Provide:
1. Grooming frequency recommendation
2. Seasonal care tips
3. Breed-specific notes
4. Allergy management tips (if applicable)

Keep it concise and actionable. Do NOT give medical advice.`

  return callDeepSeek([{ role: "user", content: prompt }], 0.7)
}
