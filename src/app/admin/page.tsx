import { createServiceClient } from "@/lib/supabase/server"
import { AdminCharts } from "@/components/admin/admin-charts"

export const dynamic = "force-dynamic"

function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold mb-2">🔒 Operator Admin</h1>
        <p className="text-muted-foreground">
          Set <code className="px-1.5 py-0.5 bg-muted rounded">ADMIN_KEY</code> in your env, then open{" "}
          <code className="px-1.5 py-0.5 bg-muted rounded">/admin?key=YOUR_KEY</code>.
        </p>
      </div>
    </div>
  )
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>
}) {
  const { key } = await searchParams
  const adminKey = process.env.ADMIN_KEY
  if (!adminKey || key !== adminKey) return <Unauthorized />

  const supabase = createServiceClient()
  const now = new Date()
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString()

  const [
    shopsRes,
    ownersRes,
    last7Res,
    last30Res,
    recentShops,
    allShops,
    apptShops,
    pvTotal,
    pvRecent,
  ] = await Promise.all([
    supabase.from("shops").select("*", { count: "exact", head: true }),
    (async () => {
      try {
        const { count } = await supabase
          .schema("auth")
          .from("users")
          .select("*", { count: "exact", head: true })
        return { count }
      } catch {
        return { count: null }
      }
    })(),
    supabase.from("shops").select("*", { count: "exact", head: true }).gte("created_at", daysAgo(7)),
    supabase.from("shops").select("*", { count: "exact", head: true }).gte("created_at", daysAgo(30)),
    supabase.from("shops").select("created_at").gte("created_at", daysAgo(30)),
    supabase.from("shops").select("subscription_tier, subscription_status"),
    supabase.from("appointments").select("shop_id"),
    supabase.from("page_views").select("*", { count: "exact", head: true }),
    supabase.from("page_views").select("visitor_id, created_at").gte("created_at", daysAgo(14)),
  ])

  const totalShops = shopsRes.count ?? 0
  const totalOwners = (ownersRes as any).count ?? null
  const signups7 = last7Res.count ?? 0
  const signups30 = last30Res.count ?? 0
  const activeShops = new Set((apptShops.data || []).map((a: any) => a.shop_id)).size

  // signup trend by day (last 30)
  const signupTrend: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    signupTrend[daysAgo(i).slice(0, 10)] = 0
  }
  ;(recentShops.data || []).forEach((s: any) => {
    const d = (s.created_at || "").slice(0, 10)
    if (d in signupTrend) signupTrend[d]++
  })
  const signupChart = Object.entries(signupTrend).map(([date, value]) => ({
    date: date.slice(5),
    value,
  }))

  // subscription tier/status distribution
  const tierMap: Record<string, number> = {}
  ;(allShops.data || []).forEach((s: any) => {
    const k = `${s.subscription_tier}/${s.subscription_status}`
    tierMap[k] = (tierMap[k] || 0) + 1
  })
  const tierRows = Object.entries(tierMap)
    .map(([k, v]) => ({ k, v }))
    .sort((a, b) => b.v - a.v)

  const paidActive =
    (tierMap["pro/active"] || 0) + (tierMap["business/active"] || 0)

  // page views + UV (last 14d)
  const totalPV = pvTotal.count ?? 0
  const pv14 = (pvRecent.data || []).length
  const uv14 = new Set((pvRecent.data || []).map((p: any) => p.visitor_id)).size

  const pvTrend: Record<string, number> = {}
  for (let i = 13; i >= 0; i--) {
    pvTrend[daysAgo(i).slice(0, 10)] = 0
  }
  ;(pvRecent.data || []).forEach((p: any) => {
    const d = (p.created_at || "").slice(0, 10)
    if (d in pvTrend) pvTrend[d]++
  })
  const pvChart = Object.entries(pvTrend).map(([date, value]) => ({
    date: date.slice(5),
    value,
  }))

  const cards = [
    { label: "Merchants (shops)", value: totalShops, sub: `${signups7} in 7d · ${signups30} in 30d` },
    { label: "Registered owners", value: totalOwners ?? "—", sub: "auth.users" },
    { label: "Active shops", value: activeShops, sub: "with ≥1 appointment" },
    { label: "Page views (total)", value: totalPV, sub: `${pv14} in last 14d` },
    { label: "Unique visitors (14d)", value: uv14, sub: "cookie-based UV" },
    { label: "Paid & active", value: paidActive, sub: "pro/business active" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">GroomingPro · Operator Admin</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Global SaaS metrics · generated {now.toISOString().slice(0, 19).replace("T", " ")} UTC
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
            owner view
          </span>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl border bg-card p-5">
              <div className="text-sm text-muted-foreground">{c.label}</div>
              <div className="text-3xl font-bold mt-1">{c.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="mb-8">
          <AdminCharts signupData={signupChart} pvData={pvChart} />
        </div>

        {/* Subscription distribution */}
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Subscription distribution (all shops)</h3>
          {tierRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No shops yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-4 font-medium">Tier / Status</th>
                    <th className="py-2 font-medium">Shops</th>
                  </tr>
                </thead>
                <tbody>
                  {tierRows.map((r) => (
                    <tr key={r.k} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{r.k}</td>
                      <td className="py-2">{r.v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-8 text-center">
          Tip: bookmark <code className="px-1 bg-muted rounded">/admin?key=YOUR_KEY</code>. PV/UV come
          from first-party tracking (no third-party cookie). Refresh to update.
        </p>
      </div>
    </div>
  )
}
