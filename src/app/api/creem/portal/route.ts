import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { creem } from "@/lib/creem"

/**
 * Generate Creem Customer Portal link for the current user
 * Looks up customer by email, then creates a magic-link portal URL
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Look up Creem customer by email
    const customer = await creem.customers.retrieve(undefined, user.email)
    if (!customer?.id) {
      return NextResponse.json(
        { error: "No Creem customer found. Please subscribe first." },
        { status: 404 }
      )
    }

    // Generate customer portal link
    const portal = await creem.customers.generateBillingLinks({
      customerId: customer.id,
    })

    if (!portal.customerPortalLink) {
      return NextResponse.json({ error: "Failed to create portal link" }, { status: 500 })
    }

    return NextResponse.json({ url: portal.customerPortalLink })
  } catch (err: any) {
    console.error("Creem portal error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to create portal link" },
      { status: 500 }
    )
  }
}