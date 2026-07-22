/**
 * Shared helper: verify user auth + shop ownership + paywall check
 * Returns { shopId, tier, trialValid } or throws NextResponse error
 */
import { createClient } from "@/lib/supabase/server"

export interface AuthShop {
  shopId: string
  tier: string
  trialValid: boolean
}

export async function requireProTier(): Promise<AuthShop> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new AuthError("Unauthorized", 401)

  const { data: shop } = await supabase
    .from("shops")
    .select("id, subscription_tier, trial_ends_at")
    .eq("owner_id", user.id)
    .single()

  if (!shop) throw new AuthError("No shop found", 404)

  const tier = shop.subscription_tier || "free"
  const trialEnded = shop.trial_ends_at ? new Date(shop.trial_ends_at) < new Date() : false

  if (tier === "free" && trialEnded) {
    throw new AuthError(
      "Your 14-day free trial has ended. Upgrade to Pro to continue using AI features.",
      402
    )
  }

  return { shopId: shop.id, tier, trialValid: !trialEnded }
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}
