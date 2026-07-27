import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: shop } = await supabase
      .from("shops")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (!shop) return NextResponse.json({ error: "No shop found" }, { status: 404 })

    // Verify appointment belongs to this shop
    const { data: appt } = await supabase
      .from("appointments")
      .select("id, shop_id")
      .eq("id", id)
      .eq("shop_id", shop.id)
      .single()

    if (!appt) return NextResponse.json({ error: "Appointment not found" }, { status: 404 })

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const photoType = formData.get("type") as string // "before" | "after"

    if (!file || !photoType) {
      return NextResponse.json({ error: "Missing file or type" }, { status: 400 })
    }

    if (photoType !== "before" && photoType !== "after") {
      return NextResponse.json({ error: "Type must be 'before' or 'after'" }, { status: 400 })
    }

    // Validate file type (must be image)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size must be under 5MB" }, { status: 400 })
    }

    // Upload to Supabase Storage — use safe extension based on MIME type
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
    }
    const ext = extMap[file.type] || "jpg"
    const filePath = `${shop.id}/${id}/${photoType}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("appointment-photos")
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type || "image/jpeg",
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("appointment-photos")
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    // Update appointment record
    const column = photoType === "before" ? "photo_before_url" : "photo_after_url"
    const { error: updateError } = await supabase
      .from("appointments")
      .update({ [column]: publicUrl })
      .eq("id", id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ data: { url: publicUrl, type: photoType } })
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
