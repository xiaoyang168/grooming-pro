"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogOut, Bell, Sparkles, X, Check } from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: "appointment" | "system" | "alert"
}

export function Navbar() {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [shopName, setShopName] = useState("Welcome back")
  const [tier, setTier] = useState<string | null>(null)
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadNotifications()
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  async function loadNotifications() {
    try {
      // Try real shop data + derive notifications from upcoming appointments
      const res = await fetch("/api/shop")
      if (res.ok) {
        const json = await res.json()
        if (json.data?.name) setShopName(json.data.name)
        if (json.data?.subscription_tier) setTier(json.data.subscription_tier)
        if (json.data?.trial_ends_at) setTrialEndsAt(json.data.trial_ends_at)
      }

      const today = new Date().toISOString().slice(0, 10)
      const apptRes = await fetch(`/api/appointments?date=${today}`)
      if (apptRes.ok) {
        const apptJson = await apptRes.json()
        const list: Notification[] = []

        if (apptJson.data && apptJson.data.length > 0) {
          list.push({
            id: "today-appts",
            title: `${apptJson.data.length} appointment${apptJson.data.length > 1 ? "s" : ""} today`,
            message: "Check your schedule to confirm bookings",
            time: "Now",
            read: false,
            type: "appointment",
          })
        }

        const pending = apptJson.data?.filter((a: any) => a.status === "pending") || []
        if (pending.length > 0) {
          list.push({
            id: "pending-appts",
            title: `${pending.length} pending confirmation${pending.length > 1 ? "s" : ""}`,
            message: "Customers waiting for your response",
            time: "5m ago",
            read: false,
            type: "alert",
          })
        }

        list.push({
          id: "ai-tip",
          title: "AI Insight Ready",
          message: "Visit Reports page to ask questions about your business",
          time: "1h ago",
          read: true,
          type: "system",
        })

        setNotifications(list)
      }
    } catch (e) {
      console.error(e)
      setNotifications([
        {
          id: "welcome",
          title: "Welcome to GroomingPro",
          message: "Start by adding your first customer or appointment",
          time: "Just now",
          read: false,
          type: "system",
        },
      ])
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    document.cookie = "grooming_demo=; path=/; max-age=0"
    router.push("/login")
    router.refresh()
  }

  const unread = notifications.filter((n) => !n.read).length

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-xl px-6">
      <div>
        <h1 className="text-sm font-semibold">{shopName} 👋</h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setOpen((o) => !o)}
          >
            <Bell className="h-4.5 w-4.5 text-muted-foreground" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
            )}
          </Button>

          {open && (
            <div className="absolute right-0 top-12 w-80 rounded-2xl border bg-card shadow-xl shadow-black/5 overflow-hidden animate-fade-in z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="text-sm font-bold">Notifications</h3>
                {unread > 0 && (
                  <Badge variant="default" className="text-xs">
                    {unread} new
                  </Badge>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-muted/30 transition-colors ${
                        !n.read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          n.type === "appointment"
                            ? "bg-blue-100 text-blue-600"
                            : n.type === "alert"
                              ? "bg-amber-100 text-amber-600"
                              : "bg-violet-100 text-violet-600"
                        }`}
                      >
                        {n.type === "alert" ? "⚠️" : n.type === "appointment" ? "📅" : "✨"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">{n.time}</p>
                      </div>
                      {!n.read && (
                        <button
                          className="shrink-0 p-1 rounded hover:bg-muted"
                          onClick={(e) => {
                            e.stopPropagation()
                            setNotifications((prev) =>
                              prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
                            )
                          }}
                          title="Mark as read"
                        >
                          <Check className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="px-4 py-2 border-t bg-muted/20 text-center">
                  <button
                    className="text-xs text-muted-foreground hover:text-primary font-medium"
                    onClick={() => {
                      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
                    }}
                  >
                    Mark all as read
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {tier ? (
          tier === "free" ? (
            <Badge variant="default" className="h-8 gap-1 mr-1">
              <Sparkles className="h-3 w-3" />{trialEndsAt ? `${Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))}d trial` : "Free Plan"}
            </Badge>
          ) : (
            <Badge variant="default" className="h-8 gap-1 mr-1 bg-emerald-600 hover:bg-emerald-600">
              <Sparkles className="h-3 w-3" />{tier === "pro" ? "Pro" : "Business"}
            </Badge>
          )
        ) : (
          <Badge variant="default" className="h-8 gap-1 mr-1">
            <Sparkles className="h-3 w-3" />Pro Trial
          </Badge>
        )}
        <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
          <LogOut className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </header>
  )
}
