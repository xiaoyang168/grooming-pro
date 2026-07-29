import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

/**
 * Photo proxy — serve appointment photos through our own domain.
 *
 * Why: Supabase Storage's public URL sometimes has restrictive CORS
 * (no Access-Control-Allow-Origin), which can fail when the browser
 * tries to reload a cached/URL-changed photo. Routing images through
 * our API avoids cross-origin issues entirely.
 *
 * GET /api/photo-proxy?url=<encoded supabase url>
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  // Only proxy our Supabase storage URLs for security
  if (!url.includes("supabase.co/storage/")) {
    return NextResponse.json({ error: "Only Supabase storage URLs are allowed" }, { status: 403 })
  }

  try {
    const supabase = await createServiceClient()
    // Use service role to fetch any file from any bucket — bypasses RLS
    // Parse the storage path from the public URL:
    // https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
    const urlObj = new URL(url)
    const match = urlObj.pathname.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/(.+?)\/(.+)$/)
    if (!match) {
      return NextResponse.json({ error: "Invalid storage URL" }, { status: 400 })
    }
    const bucket = match[1]
    const path = match[2]

    const { data, error } = await supabase.storage.from(bucket).download(path)
    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Download failed" }, { status: 500 })
    }

    const arrayBuffer = await data.arrayBuffer()
    const body = new Uint8Array(arrayBuffer)

    // Forward the content-type from the original (image/jpeg, image/png, etc.)
    const contentType = data.type || "image/jpeg"
    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Proxy failed" }, { status: 500 })
  }
}
