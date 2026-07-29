import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

/**
 * First-party page-view tracker.
 * Client fires a POST on every route change; we store a row in `page_views`
 * via the service_role client (bypasses RLS). A `gp_vid` cookie identifies
 * unique visitors for UV counting.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    const rawPath: string = body.path || request.nextUrl.pathname
    // Skip internal / admin / api / static assets
    if (
      !rawPath ||
      rawPath.startsWith("/admin") ||
      rawPath.startsWith("/api") ||
      rawPath.includes(".")
    ) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const referrer: string | null = body.referrer || request.headers.get("referer") || null
    const title: string | null = body.title || null

    let visitorId = request.cookies.get("gp_vid")?.value
    const response = NextResponse.json({ ok: true })
    if (!visitorId) {
      visitorId = crypto.randomUUID()
      response.cookies.set("gp_vid", visitorId, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      })
    }

    const supabase = createServiceClient()
    const { error } = await supabase.from("page_views").insert({
      path: rawPath,
      referrer,
      title,
      visitor_id: visitorId,
      user_agent: request.headers.get("user-agent") || null,
    })
    if (error) {
      console.error("track insert error:", error.message)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
    return response
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
