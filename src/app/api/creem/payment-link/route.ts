import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { creem } from "@/lib/creem"

/**
 * Create a Creem checkout session for a customer deposit (one-time payment).
 * Called from the public booking page — no auth required, but appointment_id must be valid.
 *
 * Requires CREEM_DEPOSIT_PRODUCT_ID env var (a one-time product created in Creem dashboard).
 */
export async function POST(request: NextRequest) {
  try {
    const { appointment_id } = await request.json()
    if (!appointment_id) {
      return NextResponse.json({ error: "Missing appointment_id" }, { status: 400 })
    }

    const depositProductId = process.env.CREEM_DEPOSIT_PRODUCT_ID
    if (!depositProductId) {
      return NextResponse.json(
        { error: "Deposit payments not configured. Ask the salon owner to set up CREEM_DEPOSIT_PRODUCT_ID." },
        { status: 501 }
      )
    }

    // Use service client — booking page has no user session
    const supabase = createServiceClient()

    // Verify appointment exists and get shop slug for redirect
    const { data: apt, error: aptError } = await supabase
      .from("appointments")
      .select("id, shop_id, status")
      .eq("id", appointment_id)
      .single()

    if (aptError || !apt) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Get shop slug for success redirect
    const { data: shop } = await supabase
      .from("shops")
      .select("slug")
      .eq("id", apt.shop_id)
      .single()

    const origin = process.env.NEXT_PUBLIC_APP_URL || "https://petsalonos.com"
    const shopSlug = shop?.slug || apt.shop_id

    // Create Creem checkout for one-time deposit
    const checkout = await creem.checkouts.create({
      productId: depositProductId,
      successUrl: `${origin}/booking/${shopSlug}?payment=success&apt=${apt.id}`,
      metadata: {
        appointment_id: apt.id,
        shop_id: apt.shop_id,
        type: "deposit",
      },
    })

    if (!checkout.checkoutUrl) {
      return NextResponse.json({ error: "Failed to create payment link" }, { status: 500 })
    }

    // Mark appointment as pending payment + save checkout reference
    await supabase
      .from("appointments")
      .update({
        payment_status: "pending",
      })
      .eq("id", appointment_id)

    return NextResponse.json({ url: checkout.checkoutUrl })
  } catch (err: any) {
    console.error("Creem payment-link error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to create payment link" },
      { status: 500 }
    )
  }
}
