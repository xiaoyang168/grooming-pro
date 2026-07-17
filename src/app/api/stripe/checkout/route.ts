import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getStripe, PRICING_PLANS } from "@/lib/stripe"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { plan } = await request.json()
    const planConfig = PRICING_PLANS[plan as keyof typeof PRICING_PLANS]
    if (!planConfig) return NextResponse.json({ error: "Invalid plan" }, { status: 400 })

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `GroomingPro ${planConfig.name}`,
              description: planConfig.features.join(", "),
            },
            unit_amount: planConfig.amount,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:8888"}/settings?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:8888"}/settings?canceled=true`,
      client_reference_id: user.id,
      metadata: { plan, user_id: user.id },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Stripe error"
    }, { status: 500 })
  }
}
