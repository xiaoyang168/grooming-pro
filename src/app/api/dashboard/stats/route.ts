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
    const today = new Date().toISOString().slice(0, 10)
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString()
    const lastMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Parallel queries
    const [
      { count: todayCount },
      { data: monthAppts },
      { count: totalCustomers },
      { count: totalPets },
      { count: newCustomers },
      { data: lastMonthAppts },
      { data: weekAppts },
    ] = await Promise.all([
      // Today's appointments
      supabase.from("appointments").select("*", { count: "exact", head: true })
        .eq("shop_id", shopId)
        .gte("start_time", `${today}T00:00:00`)
        .lte("start_time", `${today}T23:59:59`),
      // Monthly revenue & appointments (all confirmed+ in current month)
      supabase.from("appointments").select("price, status")
        .eq("shop_id", shopId)
        .gte("start_time", monthStart),
      // Total customers
      supabase.from("customers").select("*", { count: "exact", head: true })
        .eq("shop_id", shopId),
      // Total pets
      supabase.from("pets").select("*", { count: "exact", head: true })
        .eq("shop_id", shopId),
      // New customers this month
      supabase.from("customers").select("*", { count: "exact", head: true })
        .eq("shop_id", shopId)
        .gte("created_at", monthStart),
      // Last month appointments for retention/comparison
      supabase.from("appointments").select("status")
        .eq("shop_id", shopId)
        .gte("start_time", lastMonthStart)
        .lt("start_time", lastMonthEnd),
      // This week appointments
      supabase.from("appointments").select("status")
        .eq("shop_id", shopId)
        .gte("start_time", weekStart),
    ])

    const monthlyRevenue = (monthAppts || []).reduce((sum: number, a: any) => sum + (a.price || 0), 0)
    const totalAppointments = monthAppts?.length || 0

    const completed = (monthAppts || []).filter((a: any) => a.status === "completed").length
    const retentionRate = totalAppointments > 0 ? Math.round((completed / totalAppointments) * 100) : 0

    const lastMonthCompleted = (lastMonthAppts || []).filter((a: any) => a.status === "completed").length
    const lastMonthTotal = lastMonthAppts?.length || 0
    const lastMonthRetention = lastMonthTotal > 0 ? Math.round((lastMonthCompleted / lastMonthTotal) * 100) : 0
    const weekTotalAppts = weekAppts?.length || 0

    // Revenue change vs last month
    const lastMonthRevenue = 0 // Would need last month sum; keeping simple

    return NextResponse.json({
      data: {
        todayAppointments: todayCount || 0,
        monthlyRevenue,
        activeCustomers: totalCustomers || 0,
        totalPets: totalPets || 0,
        totalAppointments,
        newCustomers: newCustomers || 0,
        retentionRate,
        lastMonthRetention,
        weekTotalAppts,
      },
    })
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
