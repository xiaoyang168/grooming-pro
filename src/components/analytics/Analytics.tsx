"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/**
 * Fires a page-view event to /api/track on every client-side route change.
 * Renders nothing. Skips /admin, /api and static asset paths.
 */
export function Analytics() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    if (pathname.startsWith("/admin") || pathname.startsWith("/api") || pathname.includes(".")) {
      return
    }

    const payload = {
      path: pathname,
      referrer: typeof document !== "undefined" ? document.referrer : null,
      title: typeof document !== "undefined" ? document.title : null,
    }

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {})
  }, [pathname])

  return null
}
