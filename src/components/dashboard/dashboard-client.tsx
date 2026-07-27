"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CalendarCheck, Users, TrendingUp, Sparkles, Clock, ArrowUpRight, ArrowRight,
  CheckCircle2,
  PawPrint, MoreHorizontal, Loader2,
} from "lucide-react"
import type { AppointmentWithDetails } from "@/types"

const statusMap: Record<string, { label: string; variant: "success" | "default" | "warning" | "secondary" }> = {
  in_progress: { label: "In Progress", variant: "success" },
  checked_in: { label: "Checked In", variant: "success" },
  confirmed: { label: "Confirmed", variant: "default" },
  pending: { label: "Pending", variant: "warning" },
  completed: { label: "Completed", variant: "secondary" },
  canceled: { label: "Canceled", variant: "secondary" },
  no_show: { label: "No Show", variant: "secondary" },
}

export function DashboardClient() {
  const router = useRouter()
  const [greeting, setGreeting] = useState("")
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [stats, setStats] = useState({
    todayAppointments: 0,
    monthlyRevenue: 0,
    activeCustomers: 0,
    totalPets: 0,
    completionRate: 0,
    weekTotalAppts: 0,
    weekNewCustomers: 0,
  })
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [isNewUser, setIsNewUser] = useState(false)
  const [setupProgress, setSetupProgress] = useState({ services: false, shopInfo: false, share: false })
  const [onboardingDismissed, setOnboardingDismissed] = useState(false)
  const [shopSlug, setShopSlug] = useState("")

  useEffect(() => {
    const hour = new Date().getHours()
    setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening")
    // Restore onboarding dismissed state from localStorage
    try {
      const dismissed = localStorage.getItem("onboarding_dismissed") === "true"
      if (dismissed) setOnboardingDismissed(true)
    } catch { /* ignore */ }
    fetchData()
    checkNewUser()
  }, [])

  async function checkNewUser() {
    try {
      const res = await fetch("/api/shop")
      const json = await res.json()
      if (json.data) {
        if (json.data.slug) setShopSlug(json.data.slug)
        // Check if shop has been set up
        const hasName = !!(json.data.name && json.data.name !== "My Grooming Salon")
        const hasHours = !!json.data.business_hours && Object.keys(json.data.business_hours || {}).length > 0
        const hasSlug = !!json.data.slug
        setSetupProgress((p) => ({ ...p, shopInfo: hasName && hasHours, share: hasSlug }))
      }

      const svcRes = await fetch("/api/services")
      const svcJson = await svcRes.json()
      const hasServices = svcJson.data && svcJson.data.length > 0
      setSetupProgress((p) => ({ ...p, services: hasServices }))

      if (!hasServices) setIsNewUser(true)
    } catch { /* ignore */ }
  }

  async function fetchData() {
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)
    try {
      const [statsRes, apptRes] = await Promise.all([
        fetch("/api/dashboard/stats").then(r => r.json()),
        fetch(`/api/appointments?date=${today}`).then(r => r.json()),
      ])
      if (statsRes.data) setStats(statsRes.data)
      if (apptRes.data) setAppointments(apptRes.data)
    } catch (e) {
      console.error("Failed to fetch dashboard data:", e)
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (cents: number) =>
    `$${(cents / 100).toLocaleString()}`

  const statCards = [
    { label: "Today's Appointments", value: String(stats.todayAppointments ?? 0), icon: CalendarCheck, color: "text-primary", bg: "bg-primary/10" },
    { label: "Monthly Revenue", value: formatCurrency(stats.monthlyRevenue ?? 0), icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Active Customers", value: String(stats.activeCustomers ?? 0), icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Pets", value: String(stats.totalPets ?? 0), icon: PawPrint, color: "text-violet-500", bg: "bg-violet-50" },
  ]

  const aiInsights = [
    stats.completionRate >= 90
      ? `Completion rate is ${stats.completionRate}% — great job this week!`
      : stats.completionRate > 0
        ? `Completion rate is ${stats.completionRate}%. Consider sending reminders to reduce no-shows.`
        : "Check the Reports page for AI-powered insights on your business.",
    stats.todayAppointments > 0
      ? `You have ${stats.todayAppointments} appointments today — make sure all staff are ready!`
      : "No appointments scheduled for today. Time to reach out to past customers?",
    `Total of ${stats.totalPets} pets registered. Keep grooming records up to date for each one.`,
  ]

  const [currentInsight, setCurrentInsight] = useState(0)
  const nextInsight = () => setCurrentInsight((prev) => (prev + 1) % aiInsights.length)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
          <TrendingUp className="h-8 w-8 text-red-500" />
        </div>
        <p className="text-lg font-semibold text-muted-foreground">Unable to load dashboard</p>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Check your internet connection and try again.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{greeting} 👋</h1>
          <p className="text-muted-foreground mt-1">Here's your salon overview for today.</p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => router.push("/appointments")}>
          <CalendarCheck className="h-4 w-4 mr-2" />New Appointment
        </Button>
      </div>

      {isNewUser && !onboardingDismissed && (() => {
        const completedCount = Object.values(setupProgress).filter(Boolean).length
        const allDone = completedCount === 3
        return (
          <div className={`rounded-2xl border p-6 animate-slide-up ${allDone ? "border-emerald-300 bg-gradient-to-r from-emerald-50 via-amber-50 to-emerald-50" : "border-primary/20 bg-gradient-to-r from-primary/5 via-amber-400/5 to-primary/5"}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${allDone ? "bg-emerald-500 text-white" : "bg-primary/20"}`}>
                  {allDone ? <CheckCircle2 className="h-5 w-5" /> : <Sparkles className="h-5 w-5 text-primary" />}
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {allDone ? "All set up! 🎉" : "Welcome to GroomingPro!"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {allDone ? "Your salon is ready to accept bookings." : `${completedCount}/3 setup steps completed`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setOnboardingDismissed(true)
                  try { localStorage.setItem("onboarding_dismissed", "true") } catch { /* ignore */ }
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all duration-500 ${allDone ? "bg-emerald-500" : "bg-primary"}`}
                style={{ width: `${(completedCount / 3) * 100}%` }}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { key: "shopInfo", step: "1", title: "Set Up Your Shop", desc: "Add name, address, and business hours", href: "/settings" },
                { key: "services", step: "2", title: "Add Services", desc: "Create grooming services with prices and durations", href: "/settings" },
                { key: "share", step: "3", title: "Share Booking Link", desc: shopSlug ? `Your link: /booking/${shopSlug}` : "Generate your booking page link", href: "/settings" },
              ].map((item) => {
                const isComplete = setupProgress[item.key as keyof typeof setupProgress]
                return (
                  <a key={item.step} href={item.href}
                    className={`relative flex items-start gap-3 rounded-xl border p-4 transition-all group ${isComplete ? "border-emerald-300 bg-emerald-50/40" : "border-dashed border-primary/30 bg-white/50 hover:border-primary hover:shadow-sm"}`}
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all ${isComplete ? "bg-emerald-500 text-white" : "bg-primary text-white"}`}>
                      {isComplete ? "✓" : item.step}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold ${isComplete ? "text-emerald-700 line-through opacity-60" : "group-hover:text-primary"} transition-colors`}>
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="card-hover overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Appointments Timeline */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Today's Appointments</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" asChild>
              <a href="/appointments">View All <ArrowRight className="ml-1 h-3 w-3" /></a>
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {appointments.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <CalendarCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No appointments today</p>
              </div>
            ) : (
              <div className="space-y-2">
                {appointments.slice(0, 6).map((apt) => {
                  const status = statusMap[apt.status] || { label: apt.status, variant: "secondary" as const }
                  const startTime = new Date(apt.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  return (
                    <div key={apt.id} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 hover:bg-muted/30 transition-colors group">
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-sm text-muted-foreground w-14">{startTime}</span>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                            {apt.pet?.name?.[0] || "?"}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">
                              {apt.pet?.name || "Unknown"}{" "}
                              <span className="text-xs text-muted-foreground font-normal">{apt.pet?.breed}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {apt.customer?.name}{apt.staff?.name ? ` · ${apt.staff.name}` : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Assistant */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-gradient-to-br from-primary/5 to-amber-400/5 border-primary/10">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">AI Smart Suggestions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 animate-fade-in" key={currentInsight}>
                &ldquo;{aiInsights[currentInsight]}&rdquo;
              </p>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {aiInsights.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentInsight(i)}
                      className={`h-1.5 rounded-full transition-all ${i === currentInsight ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"}`}
                    />
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="text-xs" onClick={nextInsight}>Next</Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" />This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Completion Rate", value: `${stats.completionRate ?? 0}%` },
                  { label: "Total Appointments", value: String(stats.weekTotalAppts ?? 0) },
                  { label: "Active Customers", value: String(stats.activeCustomers ?? 0) },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4 text-xs" asChild>
                <a href="/reports">View Full Report <ArrowUpRight className="h-3 w-3 ml-1" /></a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
