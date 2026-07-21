import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: shop } = await supabase
      .from("shops")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (!shop) return NextResponse.json({ error: "No shop found" }, { status: 404 })

    const shopId = shop.id

    // Build last 6 months range
    const now = new Date()
    const months: { label: string; start: string; end: string }[] = []
    for (let i = 5; i >= 0; i--) {
      const y = now.getFullYear()
      const m = now.getMonth() - i
      const d = new Date(y, m, 1)
      months.push({
        label: d.toLocaleString("en-US", { month: "short", year: "2-digit" }),
        start: d.toISOString(),
        end: new Date(y, m + 1, 1).toISOString(),
      })
    }

    // Fetch all appointments in range
    const { data: appointments } = await supabase
      .from("appointments")
      .select("price, start_time")
      .eq("shop_id", shopId)
      .gte("start_time", months[0].start)
      .not("status", "in", '("canceled","no_show")')

    if (!appointments) {
      return NextResponse.json({ data: months.map((m) => ({ month: m.label, revenue: 0 })) })
    }

    // Group by month
    const revenueMap = new Map<string, number>()
    months.forEach((m) => revenueMap.set(m.label, 0))

    appointments.forEach((a: any) => {
      const d = new Date(a.start_time)
      const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" })
      if (revenueMap.has(label)) {
        revenueMap.set(label, (revenueMap.get(label) || 0) + (a.price || 0))
      }
    })

    const result = months.map((m) => ({
      month: m.label,
      revenue: Math.round((revenueMap.get(m.label) || 0) / 100), // cents → dollars
    }))

    return NextResponse.json({ data: result })
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
