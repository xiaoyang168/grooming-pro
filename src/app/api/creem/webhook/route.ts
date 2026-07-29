import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
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
  const secret = process.env.CREEM_WEBHOOK_SECRET

  // Force secret verification — reject if not configured
  if (!secret) {
    console.error("Creem webhook: CREEM_WEBHOOK_SECRET not configured")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  // Verify webhook signature (timing-safe comparison)
  const computedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")

  const signatureBuffer = Buffer.from(signature)
  const computedBuffer = Buffer.from(computedSignature)
  if (signatureBuffer.length !== computedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, computedBuffer)) {
    console.error("Creem webhook: invalid signature")
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const event = JSON.parse(rawBody)
  // Use service client — webhook has no user session, needs to bypass RLS
  const supabase = await createServiceClient()

  switch (event.eventType) {
    case "checkout.completed": {
      const obj = event.object || {}
      const metadata = obj.metadata || {}

      // ── Customer deposit payment (one-time) ──
      if (metadata.type === "deposit" && metadata.appointment_id) {
        await supabase
          .from("appointments")
          .update({ payment_status: "paid" })
          .eq("id", metadata.appointment_id)
        break
      }

      // ── Subscription checkout (existing logic) ──
      const productId = obj.product?.id
      const userId = metadata.user_id
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
