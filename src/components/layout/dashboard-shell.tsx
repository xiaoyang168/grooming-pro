"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { Menu } from "lucide-react"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Mobile menu button */}
        <button
          className="fixed left-4 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-lg border bg-background shadow-sm md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 bg-muted/30">{children}</main>
      </div>
    </div>
  )
}
