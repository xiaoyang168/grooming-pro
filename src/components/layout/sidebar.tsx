"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, CalendarDays, Users, PawPrint, BarChart3, Settings, Sparkles, Megaphone, Package, Gift, X,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Appointments", href: "/appointments", icon: CalendarDays },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Pets", href: "/pets", icon: PawPrint },
  { name: "Staff", href: "/staff", icon: Users },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Loyalty", href: "/loyalty", icon: Gift },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Marketing", href: "/marketing", icon: Megaphone, badge: "AI" },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const [tier, setTier] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/shop")
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.subscription_tier) setTier(res.data.subscription_tier)
      })
      .catch(() => setTier("unknown"))
  }, [pathname])

  // Close mobile sidebar on route change
  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  const isPro = tier === "pro" || tier === "business"

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r bg-sidebar transition-transform duration-300 md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <Link href="/" className="flex h-16 items-center gap-2.5 border-b px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white text-base">🐾</span>
          <span className="text-lg font-bold tracking-tight">GroomingPro</span>
          <button className="ml-auto md:hidden" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </Link>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 p-3 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-4.5 w-4.5", isActive && "text-primary")} />
                {item.name}
                {item.badge && (
                  <span className="ml-auto rounded-full bg-gradient-to-r from-primary to-pink-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
                {!item.badge && isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t p-4">
          <div className={cn(
            "rounded-xl p-3",
            isPro
              ? "bg-gradient-to-br from-primary/15 to-amber-400/15"
              : "bg-gradient-to-br from-primary/8 to-amber-400/8"
          )}>
            <div className="flex items-center gap-2 mb-1">
              {isPro ? (
                <Sparkles className="h-4 w-4 text-primary" />
              ) : (
                <PawPrint className="h-4 w-4 text-primary" />
              )}
              <span className="text-xs font-semibold">
                {tier === "pro" ? "Pro Plan" : tier === "business" ? "Business Plan" : tier === "unknown" ? "Loading..." : "Free Plan"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {tier === "unknown" ? "" : isPro ? "All features unlocked" : "Upgrade to Pro to unlock AI features"}
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
