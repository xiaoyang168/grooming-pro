import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/layout/dashboard-shell"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Check trial status
  const { data: shop } = await supabase
    .from("shops")
    .select("subscription_tier, trial_ends_at, subscription_status")
    .eq("owner_id", user.id)
    .single()

  const trialEnded = shop?.trial_ends_at ? new Date(shop.trial_ends_at) < new Date() : false
  const isFreeTier = !shop?.subscription_tier || shop.subscription_tier === "free"

  // If trial has expired and user is on free tier, redirect to subscription page
  if (trialEnded && isFreeTier) {
    redirect("/subscribe")
  }

  return <DashboardShell>{children}</DashboardShell>
}
