import Stripe from "stripe"

export function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia" as any,
  })
}

export const PRICING_PLANS = {
  pro: {
    name: "Pro",
    amount: 2900, // $29/month
    features: [
      "Up to 200 pets",
      "AI scheduling",
      "Customer CRM",
      "Email reminders",
      "Basic reports",
    ],
  },
  business: {
    name: "Business",
    amount: 5900, // $59/month
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
