import { NextRequest, NextResponse } from "next/server"

/**
 * Photo proxy — serve appointment photos through our own domain.
 *
 * Why: Supabase Storage's public URL sometimes returns responses without
 * CORS headers (Access-Control-Allow-Origin). The browser blocks reloading
 * cross-origin images when CORS isn't allowed. By proxying through our
 * own API, the browser sees only same-origin requests and the issue
 * disappears entirely.
 *
 * Server-side fetch() bypasses CORS (CORS only applies in browsers),
 * so this reliably returns image bytes for any publicly reachable URL.
 *
 * GET /api/photo-proxy?url=<encoded supabase url>
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  // Only proxy our Supabase storage URLs — security: avoid arbitrary open proxy
  if (!/^https?:\/\/[^/]+\.supabase\.co\/storage\//.test(url)) {
    return NextResponse.json(
      { error: "Only Supabase storage URLs are allowed" },
      { status: 403 }
    )
  }

  try {
    // Server-side fetch — CORS doesn't apply on the server
    const upstream = await fetch(url, { cache: "no-store" })
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: 502 }
      )
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg"
    const buffer = await upstream.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        // Public caching by URL — the cache-bust timestamp param forces fresh fetch on replace
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Proxy failed" },
      { status: 500 }
    )
  }
}
