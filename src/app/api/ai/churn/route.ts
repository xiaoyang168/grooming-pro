import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { analyzeChurnRisk } from "@/lib/ai"
import { isDemoMode } from "@/lib/demo"
import { requireProTier, AuthError } from "@/lib/auth-guard"

export async function GET() {
  const demo = await isDemoMode()

  try {
    if (demo) {
      return NextResponse.json({
        data: [
          { customer_id: "c1", risk_level: "high", days_since_last: 42, message: "Bella hasn't been in for 6 weeks. Send a 10% off reminder?" },
          { customer_id: "c2", risk_level: "medium", days_since_last: 38, message: "Rocky missed his last appointment. Follow up with a friendly call?" },
          { customer_id: "c3", risk_level: "medium", days_since_last: 35, message: "Charlie's 3-week cycle is due. Text to book?" },
        ],
      })
    }

    // Paywall check
    const { shopId } = await requireProTier()

    const supabase = await createClient()
    const { data: customers } = await supabase
      .from("customers")
      .select("id, name, last_visit, total_visits, total_spent")
      .eq("shop_id", shopId)

    if (!customers || customers.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const normalized = customers.map((c: any) => ({
      ...c,
      total_spent: Math.round((c.total_spent || 0) / 100),
    }))

    const result = await analyzeChurnRisk({ customers: normalized })
    const alerts = JSON.parse(result)
    return NextResponse.json({ data: alerts })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({
      error: error instanceof Error ? error.message : "AI analysis failed"
    }, { status: 500 })
  }
}
