"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, CalendarDays, Users, PawPrint, BarChart3, Settings,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Appointments", href: "/appointments", icon: CalendarDays },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Pets", href: "/pets", icon: PawPrint },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-sidebar">
      {/* Brand */}
      <Link href="/" className="flex h-16 items-center gap-2.5 border-b px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white text-base">🐾</span>
        <span className="text-lg font-bold tracking-tight">GroomingPro</span>
      </Link>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-4.5 w-4.5", isActive && "text-primary")} />
              {item.name}
              {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t p-4">
        <div className="rounded-xl bg-gradient-to-br from-primary/8 to-amber-400/8 p-3">
          <div className="flex items-center gap-2 mb-1">
            <PawPrint className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold">Free Plan</span>
          </div>
          <p className="text-xs text-muted-foreground">Upgrade to Pro to unlock AI features</p>
        </div>
      </div>
    </aside>
  )
}
