import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const COLORS = ["bg-primary", "bg-amber-400", "bg-blue-400", "bg-emerald-400", "bg-violet-400", "bg-rose-400"]

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
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    // Fetch this month's appointments with service_ids
    const { data: appointments } = await supabase
      .from("appointments")
      .select("service_ids")
      .eq("shop_id", shopId)
      .gte("start_time", monthStart)
      .not("status", "in", '("canceled","no_show")')

    // Fetch all services for the shop
    const { data: services } = await supabase
      .from("services")
      .select("id, name")
      .eq("shop_id", shopId)

    if (!appointments || !services) {
      return NextResponse.json({ data: [] })
    }

    // Build service name map
    const nameMap = new Map<string, string>()
    services.forEach((s: any) => nameMap.set(s.id, s.name))

    // Count service occurrences across all appointments
    const counter = new Map<string, number>()
    appointments.forEach((a: any) => {
      if (Array.isArray(a.service_ids)) {
        a.service_ids.forEach((sid: string) => {
          const name = nameMap.get(sid) || "Unknown Service"
          counter.set(name, (counter.get(name) || 0) + 1)
        })
      }
    })

    // Sort by count desc and take top 6
    const total = Array.from(counter.values()).reduce((s, c) => s + c, 0)
    const sorted = Array.from(counter.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)

    const result = sorted.map(([name, count], i) => ({
      name,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
      color: COLORS[i % COLORS.length],
    }))

    return NextResponse.json({ data: result })
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
