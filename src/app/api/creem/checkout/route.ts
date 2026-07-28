import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { creem, getProductForPlan } from "@/lib/creem"

/**
 * Create a Creem checkout session for upgrading to Pro or Business
 * Replaces /api/stripe/checkout
 */
export async function POST(request: NextRequest) {
  try {
    const { plan } = await request.json()

    if (!plan || (plan !== "pro" && plan !== "business")) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const productId = getProductForPlan(plan)
    const origin = process.env.NEXT_PUBLIC_APP_URL || "https://www.petsalonos.com"

    // Debug log — remove after testing
    console.log("[checkout] plan:", plan, "| productId:", productId, "| env PRO:", process.env.CREEM_PRO_PRODUCT_ID, "| env BIZ:", process.env.CREEM_BUSINESS_PRODUCT_ID)

    // Create Creem checkout session
    const checkout = await creem.checkouts.create({
      productId,
      successUrl: `${origin}/settings?upgrade=success`,
      metadata: {
        user_id: user.id,
        plan,
      },
    })

    if (!checkout.checkoutUrl) {
      return NextResponse.json({ error: "Failed to create checkout", debug: { plan, productId, checkoutUrl: checkout.checkoutUrl } }, { status: 500 })
    }

    return NextResponse.json({ url: checkout.checkoutUrl, debug: { plan, productId } })
  } catch (err: any) {
    console.error("Creem checkout error:", err)
    return NextResponse.json(
      { error: err.message || "Checkout failed" },
      { status: 500 }
    )
  }
}
