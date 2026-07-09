import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")!

  let event
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = await createClient()

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object
      const userId = session.client_reference_id || session.metadata?.user_id
      const plan = session.metadata?.plan

      if (userId) {
        await supabase
          .from("shops")
          .update({
            subscription_tier: plan,
            subscription_status: "active",
          })
          .eq("owner_id", userId)
      }
      break
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object
      // Simplified: find shop by customer ID
      break
    }
  }

  return NextResponse.json({ received: true })
}
