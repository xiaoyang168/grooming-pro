import { createClient } from "@/lib/supabase/server"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { LandingPage } from "@/components/landing/landing-page"
import { DashboardShell } from "@/components/layout/dashboard-shell"

export default async function HomePage() {
  let user = null
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Supabase not configured — show landing page
  }

  if (!user) {
    return <LandingPage />
  }

  return (
    <DashboardShell>
      <DashboardClient />
    </DashboardShell>
  )
}
