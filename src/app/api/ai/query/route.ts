import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { naturalLanguageQuery } from "@/lib/ai"
import { isDemoMode } from "@/lib/demo"
import { requireProTier, AuthError } from "@/lib/auth-guard"

export async function POST(request: NextRequest) {
  const demo = await isDemoMode()

  try {
    const { question } = await request.json()

    if (demo) {
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

    // Paywall check: require Pro tier or active trial
    const { shopId } = await requireProTier()

    const supabase = await createClient()
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    const [
      { count: totalCustomers },
      { count: totalPets },
      { count: totalAppointments },
      { data: monthAppts },
      { data: topCustomers },
      { data: topServices },
    ] = await Promise.all([
      supabase.from("customers").select("*", { count: "exact", head: true }).eq("shop_id", shopId),
      supabase.from("pets").select("*", { count: "exact", head: true }).eq("shop_id", shopId),
      supabase.from("appointments").select("*", { count: "exact", head: true }).eq("shop_id", shopId),
      supabase.from("appointments").select("price").eq("shop_id", shopId).gte("start_time", monthStart),
      supabase.from("customers").select("name, total_spent").eq("shop_id", shopId).order("total_spent", { ascending: false }).limit(5),
      supabase.from("appointments").select("service_ids").eq("shop_id", shopId).order("start_time", { ascending: false }).limit(200),
    ])

    const monthlyRevenue = (monthAppts || []).reduce((sum: number, a: any) => sum + (a.price || 0), 0)

    const serviceCounts: Record<string, number> = {}
    for (const a of topServices || []) {
      for (const sid of a.service_ids || []) {
        serviceCounts[sid] = (serviceCounts[sid] || 0) + 1
      }
    }
    const topServicesList = Object.entries(serviceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    const topCustomersList = (topCustomers || []).map((c: any) => ({
      name: c.name,
      spent: Math.round((c.total_spent || 0) / 100),
    }))

    const answer = await naturalLanguageQuery({
      question,
      shop_data: {
        total_customers: totalCustomers || 0,
        total_pets: totalPets || 0,
        total_appointments: totalAppointments || 0,
        monthly_revenue: Math.round(monthlyRevenue / 100),
        top_services: topServicesList,
        top_customers: topCustomersList,
      },
    })

    return NextResponse.json({ data: { answer } })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({
      error: error instanceof Error ? error.message : "AI query failed"
    }, { status: 500 })
  }
}
