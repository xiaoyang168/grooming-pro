import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendConfirmationEmail } from "@/lib/notifications"

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

export async function GET(request: NextRequest) {
  try {
    const shopId = await getShopId()
    if (!shopId) return NextResponse.json({ error: "No shop found" }, { status: 404 })

    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get("date")
    const status = searchParams.get("status")

    const supabase = await createClient()
    let query = supabase
      .from("appointments")
      .select(`
        *,
        customer:customers(id, name, phone),
        pet:pets(id, name, breed, photo_url),
        staff:staff(id, name, color)
      `)
      .eq("shop_id", shopId)
      .order("start_time", { ascending: true })

    if (status) query = query.eq("status", status)
    if (date) {
      const dayStart = `${date}T00:00:00`
      const dayEnd = `${date}T23:59:59`
      query = query.gte("start_time", dayStart).lte("start_time", dayEnd)
    }

    const { data, error } = await query
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

    const supabase = await createClient()
    const body = await request.json()

    // Server-side validation
    if (!body.customer_id || !body.pet_id || !body.service_ids?.length) {
      return NextResponse.json(
        { error: "Missing required fields: customer_id, pet_id, service_ids" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert({ ...body, shop_id: shopId })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Send confirmation email to customer (non-blocking)
    try {
      const { customer_id, pet_id } = body
      const [{ data: customer }, { data: pet }, { data: shop }] = await Promise.all([
        supabase.from("customers").select("name, email").eq("id", customer_id).single(),
        supabase.from("pets").select("name").eq("id", pet_id).single(),
        supabase.from("shops").select("name").eq("id", shopId).single(),
      ])

      if (customer?.email) {
        sendConfirmationEmail({
          customerName: customer.name,
          customerEmail: customer.email,
          petName: pet?.name || "your pet",
          serviceName: "grooming",
          startTime: data.start_time,
          shopName: shop?.name || "GroomingPro",
          bookingLink: `https://petsalonos.com/booking/${shopId}`,
        }).catch(() => {}) // fire-and-forget
      }
    } catch {
      // Email failure should not block appointment creation
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
