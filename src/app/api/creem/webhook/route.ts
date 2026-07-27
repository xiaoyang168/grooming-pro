import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPlanFromProduct } from "@/lib/creem"
import * as crypto from "crypto"

/**
 * Creem webhook handler
 * Verifies HMAC-SHA256 signature and updates shops table
 * Replaces /api/stripe/webhook
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get("creem-signature") || ""
  const secret = process.env.CREEM_WEBHOOK_SECRET || ""

  // Verify webhook signature
  if (secret) {
    const computedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex")

    if (computedSignature !== signature) {
      console.error("Creem webhook: invalid signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }
  }

  const event = JSON.parse(rawBody)
  const supabase = await createClient()

  switch (event.eventType) {
    case "checkout.completed":
    case "subscription.active":
    case "subscription.paid": {
      const obj = event.object || {}
      const productId = obj.product?.id
      const userId = obj.metadata?.user_id
      const plan = getPlanFromProduct(productId)

      if (userId && plan !== "free") {
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

    case "subscription.trialing": {
      const obj = event.object || {}
      const userId = obj.metadata?.user_id
      const productId = obj.product?.id
      const plan = getPlanFromProduct(productId)

      if (userId && plan !== "free") {
        await supabase
          .from("shops")
          .update({
            subscription_tier: plan,
            subscription_status: "trialing",
          })
          .eq("owner_id", userId)
      }
      break
    }

    case "subscription.scheduled_cancel": {
      const obj = event.object || {}
      const userId = obj.metadata?.user_id
      if (userId) {
        await supabase
          .from("shops")
          .update({ subscription_status: "cancel_at_period_end" })
          .eq("owner_id", userId)
      }
      break
    }

    case "subscription.past_due": {
      const obj = event.object || {}
      const userId = obj.metadata?.user_id
      if (userId) {
        await supabase
          .from("shops")
          .update({ subscription_status: "past_due" })
          .eq("owner_id", userId)
      }
      break
    }

    case "subscription.canceled":
    case "subscription.expired": {
      const obj = event.object || {}
      const userId = obj.metadata?.user_id
      if (userId) {
        await supabase
          .from("shops")
          .update({
            subscription_tier: "free",
            subscription_status: "canceled",
          })
          .eq("owner_id", userId)
      }
      break
    }

    default:
      console.log(`Creem webhook: unhandled event ${event.eventType}`)
  }

  return NextResponse.json({ received: true })
}
