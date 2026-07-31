"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Sparkles, Clock, CheckCircle2, PawPrint, Loader2 } from "lucide-react"

interface ShopInfo {
  subscription_tier: string | null
  trial_ends_at: string | null
  subscription_status: string | null
}

export default function SubscribePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [shop, setShop] = useState<ShopInfo | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      setUser(user)

      const { data: shopData } = await supabase
        .from("shops")
        .select("subscription_tier, trial_ends_at, subscription_status")
        .eq("owner_id", user.id)
        .single()

      // If already paid or trial still active, redirect to dashboard
      const trialEnded = shopData?.trial_ends_at ? new Date(shopData.trial_ends_at) < new Date() : false
      const isFreeTier = !shopData?.subscription_tier || shopData.subscription_tier === "free"
      if (!trialEnded || !isFreeTier) {
        router.push("/")
        return
      }

      setShop(shopData)
      setLoading(false)
    }
    init()
  }, [router, supabase])

  async function handleCheckout(plan: "pro" | "business") {
    try {
      setLoading(true)
      const res = await fetch("/api/creem/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const result = await res.json()
      if (result.url) {
        window.location.href = result.url
      } else {
        throw new Error(result.error || "Checkout failed")
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const trialEnded = shop?.trial_ends_at ? new Date(shop.trial_ends_at) < new Date() : false
  const trialDaysLeft = shop?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(shop.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0

  const plans = [
    {
      key: "pro" as const,
      name: "Pro",
      price: "$29",
      period: "/month",
      description: "Everything you need to run your grooming salon.",
      features: [
        "Unlimited appointments & customers",
        "Online booking page",
        "AI smart scheduling",
        "Email reminders & marketing",
        "Revenue reports & analytics",
        "Staff management",
        "Customer loyalty tracking",
      ],
      cta: trialEnded ? "Upgrade to Pro" : "Start Pro Plan",
      highlighted: true,
    },
    {
      key: "business" as const,
      name: "Business",
      price: "$79",
      period: "/month",
      description: "For multi-location salons and teams.",
      features: [
        "Everything in Pro",
        "Multiple shop locations",
        "Priority AI support",
        "Advanced analytics",
        "Custom branding",
        "API access",
        "Dedicated support",
      ],
      cta: trialEnded ? "Upgrade to Business" : "Start Business Plan",
      highlighted: false,
    },
  ]

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 px-4 py-12">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-amber-500 shadow-lg shadow-primary/20">
            <PawPrint className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {trialEnded ? "Your free trial has ended" : "Choose your plan"}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {trialEnded
              ? "Upgrade to continue managing your salon with GroomingPro."
              : `Your ${trialDaysLeft}-day free trial is active. Upgrade anytime to unlock all features.`}
          </p>
          {!trialEnded && shop?.trial_ends_at && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Clock className="h-3 w-3" />
              {trialDaysLeft} days left in trial
            </div>
          )}
        </div>

        {/* Plans */}
        <div className="grid gap-6 sm:grid-cols-2">
          {plans.map((plan) => (
            <Card
              key={plan.key}
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                plan.highlighted
                  ? "border-primary/30 shadow-md bg-gradient-to-br from-white to-primary/5"
                  : "border-muted"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-bl-lg">
                  MOST POPULAR
                </div>
              )}
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  {plan.highlighted && <Sparkles className="h-4 w-4 text-primary" />}
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-3xl font-extrabold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2.5">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlighted ? "gradient" : "outline"}
                  className="w-full"
                  size="lg"
                  onClick={() => handleCheckout(plan.key)}
                  disabled={loading}
                >
                  {loading ? "Loading..." : plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Cancel anytime. No hidden fees. Taxes may apply based on your location.
        </p>
      </div>
    </div>
  )
}
