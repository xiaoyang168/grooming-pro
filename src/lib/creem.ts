import { Creem } from "creem"

/**
 * Creem payment client (Merchant of Record)
 * Replaces Stripe for global tax compliance + lower fees (3.9% + $0.40)
 */

const apiKey = process.env.CREEM_API_KEY || ""
const server = apiKey.startsWith("creem_test_") ? "test" : "prod"

export const creem = new Creem({
  apiKey,
  server: server as "test" | "prod",
})

// Product IDs for each plan + customer deposit
export const CREEM_PRODUCTS = {
  pro: process.env.CREEM_PRO_PRODUCT_ID || "prod_251KFqWHRpYCEwXd8TyenP",
  business: process.env.CREEM_BUSINESS_PRODUCT_ID || "prod_5t0lrDHjgVZCww6cbxvzmD",
  deposit: process.env.CREEM_DEPOSIT_PRODUCT_ID || "",
} as const

export function getProductForPlan(plan: "pro" | "business"): string {
  return plan === "business" ? CREEM_PRODUCTS.business : CREEM_PRODUCTS.pro
}

export function getPlanFromProduct(productId: string): string {
  if (productId === CREEM_PRODUCTS.business) return "business"
  if (productId === CREEM_PRODUCTS.pro) return "pro"
  return "free"
}
