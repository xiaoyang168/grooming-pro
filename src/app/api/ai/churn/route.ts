import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { analyzeChurnRisk } from "@/lib/ai"
import { isDemoMode } from "@/lib/demo"

export async function GET() {
  const demo = await isDemoMode()

  try {
    if (demo) {
      return NextResponse.json({
        data: [
          {
            customer_id: "c1",
            risk_level: "high",
            days_since_last: 42,
            message: "Bella hasn't been in for 6 weeks. Send a 10% off reminder?",
          },
          {
            customer_id: "c2",
            risk_level: "medium",
            days_since_last: 38,
            message: "Rocky missed his last appointment. Follow up with a friendly call?",
          },
          {
            customer_id: "c3",
            risk_level: "medium",
            days_since_last: 35,
            message: "Charlie's 3-week cycle is due. Text to book?",
          },
        ],
      })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: shop } = await supabase
      .from("shops")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (!shop) return NextResponse.json({ error: "No shop found" }, { status: 404 })

    const { data: customers } = await supabase
      .from("customers")
      .select("id, name, last_visit, total_visits, total_spent")
      .eq("shop_id", shop.id)

    if (!customers || customers.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Convert cents to dollars for AI analysis
    const normalized = customers.map((c: any) => ({
      ...c,
      total_spent: Math.round((c.total_spent || 0) / 100),
    }))

    const result = await analyzeChurnRisk({ customers: normalized })
    const alerts = JSON.parse(result)
    return NextResponse.json({ data: alerts })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "AI analysis failed"
    }, { status: 500 })
  }
}
