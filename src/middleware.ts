import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Demo mode — allow preview without real Supabase credentials
  const isDemo = request.cookies.get("grooming_demo")?.value === "true"
  if (isDemo) {
    const protectedPaths = ["/appointments", "/customers", "/pets", "/settings", "/reports", "/inventory", "/staff", "/marketing", "/loyalty", "/invoices"]
    const isProtected = protectedPaths.some((p) => request.nextUrl.pathname.startsWith(p))

    if (isDemo && request.nextUrl.pathname === "/login") {
      const url = request.nextUrl.clone()
      url.pathname = "/"
      return NextResponse.redirect(url)
    }
    if (isProtected || request.nextUrl.pathname === "/") {
      return supabaseResponse
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes — redirect to login
  const protectedPaths = ["/appointments", "/customers", "/pets", "/settings", "/reports", "/inventory", "/staff", "/marketing", "/loyalty", "/invoices"]
  const isProtected = protectedPaths.some((p) => request.nextUrl.pathname.startsWith(p))

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Auth routes — redirect to dashboard if logged in
  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  // Check trial status for protected routes, root, and dashboard API routes
  const isApiProtected = request.nextUrl.pathname.startsWith("/api/") &&
    !request.nextUrl.pathname.startsWith("/api/auth/") &&
    !request.nextUrl.pathname.startsWith("/api/booking/") &&
    !request.nextUrl.pathname.startsWith("/api/shop/by-slug/") &&
    !request.nextUrl.pathname.startsWith("/api/creem/webhook")

  if (user && (isProtected || request.nextUrl.pathname === "/" || isApiProtected)) {
    const { data: shop } = await supabase
      .from("shops")
      .select("subscription_tier, trial_ends_at")
      .eq("owner_id", user.id)
      .single()

    const trialEnded = shop?.trial_ends_at ? new Date(shop.trial_ends_at) < new Date() : false
    const isFreeTier = !shop?.subscription_tier || shop.subscription_tier === "free"

    if (trialEnded && isFreeTier) {
      if (isApiProtected) {
        return NextResponse.json(
          { error: "Your free trial has ended. Please upgrade to continue." },
          { status: 402 }
        )
      }
      const url = request.nextUrl.clone()
      url.pathname = "/subscribe"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/|booking/|blog/|privacy|terms|refund|robots|sitemap).*)",
  ],
}
