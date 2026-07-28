import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendStatusUpdateSMS } from "@/lib/notifications"

async function getShopId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  const { data: shop } = await supabase.from("shops").select("id").eq("owner_id", user.id).single()
  return shop?.id || null
}

// Allowed fields for PATCH (whitelist to prevent mass assignment)
const ALLOWED_FIELDS = ["status", "start_time", "end_time", "staff_id", "notes", "price", "tip_amount", "is_paid"]

// GET /api/appointments/[id] — single appointment with joins (for invoice)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const shopId = await getShopId()
    if (!shopId) return NextResponse.json({ error: "No shop found" }, { status: 404 })

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *,
        customer:customers(id, name, phone, email),
        pet:pets(id, name, breed),
        staff:staff(id, name),
        shop:shops(id, name, phone, email, address)
      `)
      .eq("id", id)
      .eq("shop_id", shopId)
      .single()

    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ data })
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Statuses that should trigger an SMS notification to the customer
const SMS_STATUSES = ["completed", "canceled", "no_show"] as const

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const shopId = await getShopId()
    if (!shopId) return NextResponse.json({ error: "No shop found" }, { status: 404 })

    const body = await request.json()
    // Whitelist fields to prevent mass assignment
    const updateData: Record<string, unknown> = {}
    for (const key of ALLOWED_FIELDS) {
      if (key in body) updateData[key] = body[key]
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", id)
      .eq("shop_id", shopId) // Prevent cross-shop access
      .select()
      .single()

    if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 })

    // Send SMS when appointment status changes to a terminal state
    const newStatus = updateData.status as string | undefined
    if (newStatus && (SMS_STATUSES as readonly string[]).includes(newStatus)) {
      try {
        const [{ data: customer }, { data: pet }, { data: shop }] = await Promise.all([
          supabase.from("customers").select("name, phone").eq("id", data.customer_id).eq("shop_id", shopId).single(),
          supabase.from("pets").select("name").eq("id", data.pet_id).eq("shop_id", shopId).single(),
          supabase.from("shops").select("name, phone").eq("id", shopId).single(),
        ])

        sendStatusUpdateSMS(
          {
            customerName: customer?.name || "there",
            customerPhone: customer?.phone || null,
            petName: pet?.name || "your pet",
            serviceName: "grooming",
            startTime: data.start_time,
            shopName: shop?.name || "GroomingPro",
            shopPhone: shop?.phone || null,
          },
          newStatus as "completed" | "canceled" | "no_show"
        ).catch(() => {}) // fire-and-forget
      } catch {
        // SMS failure should not block status update
      }
    }

    return NextResponse.json({ data })
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const shopId = await getShopId()
    if (!shopId) return NextResponse.json({ error: "No shop found" }, { status: 404 })

    const supabase = await createClient()
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id)
      .eq("shop_id", shopId) // Prevent cross-shop access

    if (error) return NextResponse.json({ error: "Delete failed" }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
