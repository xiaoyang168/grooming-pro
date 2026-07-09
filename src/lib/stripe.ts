import Stripe from "stripe"

let stripeClient: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_stub", {
      apiVersion: "2026-06-24.dahlia",
    })
  }
  return stripeClient
}

export const PRICING_PLANS = {
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    name: "Pro",
    amount: 2900, // $29/month in cents
    features: [
      "Up to 200 pets",
      "AI scheduling",
      "Customer CRM",
      "Email reminders",
      "Basic reports",
    ],
  },
  business: {
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID!,
    name: "Business",
    amount: 5900, // $59/month in cents
    features: [
      "Unlimited pets",
      "Everything in Pro",
      "AI churn prediction",
      "AI marketing assistant",
      "Advanced analytics",
      "Priority support",
    ],
  },
} as const
