import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function getShopId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .single()
  return shop?.id || null
}

export async function GET() {
  try {
    const shopId = await getShopId()
    if (!shopId) return NextResponse.json({ error: "No shop found" }, { status: 404 })

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("shop_id", shopId)
      .eq("is_active", true)
      .order("name")

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const shopId = await getShopId()
    if (!shopId) return NextResponse.json({ error: "No shop found" }, { status: 404 })

    const body = await request.json()
    const supabase = await createClient()

    // ── Staff limit enforcement ─────────────────────────────────
    // Free / trialing shops can have at most 2 active staff.
    // Pro / Business shops are unlimited.
    const { data: shop } = await supabase
      .from("shops")
      .select("subscription_tier, subscription_status")
      .eq("id", shopId)
      .single()

    const tier = shop?.subscription_tier || "free"
    const status = shop?.subscription_status || "trialing"
    const isPaid = (tier === "pro" || tier === "business") && status === "active"

    if (!isPaid) {
      const { count } = await supabase
        .from("staff")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", shopId)
        .eq("is_active", true)

      if ((count || 0) >= 2) {
        return NextResponse.json(
          {
            error: "Staff limit reached",
            message: "Your Starter plan supports up to 2 staff members. Upgrade to Pro for unlimited staff.",
            limit: 2,
            current: count,
            upgradeRequired: true,
          },
          { status: 403 }
        )
      }
    }
    // ── End staff limit enforcement ─────────────────────────────

    const { data, error } = await supabase
      .from("staff")
      .insert({
        shop_id: shopId,
        name: body.name,
        role: body.role || "groomer",
        phone: body.phone || null,
        email: body.email || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 201 })
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
