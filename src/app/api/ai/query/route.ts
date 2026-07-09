import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { naturalLanguageQuery } from "@/lib/ai"
import { isDemoMode } from "@/lib/demo"

export async function POST(request: NextRequest) {
  const demo = await isDemoMode()

  try {
    const { question } = await request.json()

    if (demo) {
      // Demo mode: return a contextual answer without real data
      const fallbackMap: Record<string, string> = {
        "revenue": "Your salon generated approximately $28,500 in revenue last month — a 12% increase over the previous month. Full Groom and Bath & Brush were the top contributors.",
        "spent": "Your top customer is Emily, who spent $1,850 this year. She brings Buddy (Golden Retriever) for Full Groom every 3 weeks.",
        "popular": "Full Groom is your most popular service with 86 bookings this month (46% of all appointments).",
        "churning": "3 customers haven't visited in over 30 days. Consider sending a win-back email with a 10% discount.",
      }
      const lowerQ = question.toLowerCase()
      let answer = `I analyzed your salon data for: "${question}". Your salon is performing well with a 96% completion rate and $28,500 monthly revenue. Would you like a detailed breakdown?`
      for (const key of Object.keys(fallbackMap)) {
        if (lowerQ.includes(key)) {
          answer = fallbackMap[key]
          break
        }
      }
      return NextResponse.json({ data: { answer } })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const shopId = user.id
    const { count: totalCustomers } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })

    const { count: totalAppointments } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })

    const result = await naturalLanguageQuery({
      question,
      shop_data: {
        total_customers: totalCustomers || 0,
        total_pets: 0,
        total_appointments: totalAppointments || 0,
        monthly_revenue: 0,
        top_services: [],
        top_customers: [],
      },
    })

    return NextResponse.json({ data: { answer: result } })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "AI query failed"
    }, { status: 500 })
  }
}
