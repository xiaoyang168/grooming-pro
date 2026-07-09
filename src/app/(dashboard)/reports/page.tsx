"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, DollarSign, Users, CalendarDays, Sparkles, Send, Loader2, Bot } from "lucide-react"
import { useAiQuery } from "@/lib/ai-client"

interface DashboardStats {
  monthlyRevenue: number
  totalAppointments: number
  newCustomers: number
  retentionRate: number
  lastMonthRetention: number
}

export default function ReportsPage() {
  const [aiQuery, setAiQuery] = useState("")
  const { answer, loading, error, query, setAnswer } = useAiQuery()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setStats(res.data)
      })
      .catch(console.error)
      .finally(() => setStatsLoading(false))
  }, [])

  const topServices = useMemo(
    () => [
      { name: "Full Groom", count: 86, pct: 46, color: "bg-primary" },
      { name: "Bath & Brush", count: 52, pct: 28, color: "bg-amber-400" },
      { name: "Spa Package", count: 31, pct: 17, color: "bg-blue-400" },
      { name: "Nail Trim", count: 17, pct: 9, color: "bg-emerald-400" },
    ],
    []
  )

  const kpis = [
    {
      label: "Monthly Revenue",
      value: statsLoading || !stats ? "$4,280" : `$${(stats.monthlyRevenue / 100).toLocaleString()}`,
      change: "+18%",
      icon: DollarSign,
      color: "emerald",
    },
    {
      label: "Total Appointments",
      value: statsLoading || !stats ? "186" : String(stats.totalAppointments),
      change: "+12%",
      icon: CalendarDays,
      color: "blue",
    },
    {
      label: "New Customers",
      value: statsLoading || !stats ? "24" : String(stats.newCustomers),
      change: "+8%",
      icon: Users,
      color: "violet",
    },
    {
      label: "Retention Rate",
      value: statsLoading || !stats ? "72%" : `${stats.retentionRate}%`,
      change: "+5%",
      icon: TrendingUp,
      color: "amber",
    },
  ]

  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-600",
    blue: "bg-blue-100 text-blue-600",
    violet: "bg-violet-100 text-violet-600",
    amber: "bg-amber-100 text-amber-600",
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Reports & Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">Business insights & analytics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <Card key={i} className="glass-strong hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${colorMap[kpi.color]}`}>
                <kpi.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold">{kpi.value}</div>
              <div className="mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-600">{kpi.change}</span>
                <span className="text-xs text-muted-foreground ml-1">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Recharts revenue chart</p>
              <p className="text-xs text-muted-foreground mt-1">Renders automatically once data is connected</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topServices.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="w-28 text-sm font-medium">{item.name}</span>
                  <div className="flex-1 h-6 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-sm font-semibold text-right">{item.count}</span>
                  <Badge variant="secondary" className="w-12 justify-center text-xs">{item.pct}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Query Box */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-amber-400/5 to-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            AI Smart Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <input
              className="h-11 flex-1 rounded-xl border bg-white px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
              placeholder='Try asking: "How much revenue last month?" or "Which customers are at risk of churning?"'
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && aiQuery && !loading) {
                  query(aiQuery)
                  setAiQuery("")
                }
              }}
            />
            <Button
              variant="gradient"
              disabled={!aiQuery || loading}
              onClick={() => { query(aiQuery); setAiQuery("") }}
            >
              {loading ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1.5 h-4 w-4" />
              )}
              {loading ? "Thinking..." : "Ask"}
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["How much revenue last month?", "Who spent the most?", "What's the most popular service?", "Which customers are churning?"].map((q) => (
              <button
                key={q}
                disabled={loading}
                className="rounded-full border bg-white px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                onClick={() => { setAiQuery(""); query(q) }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* AI Response */}
          {(loading || answer || error) && (
            <div className={`mt-4 rounded-xl border p-4 transition-all animate-slide-up ${
              error ? "border-red-200 bg-red-50" : "border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5"
            }`}>
              {loading && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold">Analyzing your data...</p>
                    <div className="h-2 w-32 animate-shimmer rounded-full bg-muted" />
                  </div>
                </div>
              )}
              {answer && !loading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary mb-1">AI Insight</p>
                    <p className="text-sm leading-relaxed">{answer}</p>
                    <button
                      className="mt-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => setAnswer("")}
                    >
                      &times; Dismiss
                    </button>
                  </div>
                </div>
              )}
              {error && !loading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
                    <Bot className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-600 mb-1">Error</p>
                    <p className="text-sm text-red-700">{error}</p>
                    <button
                      className="mt-2 text-xs text-red-400 hover:text-red-600 transition-colors"
                      onClick={() => setAnswer("")}
                    >
                      &times; Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
