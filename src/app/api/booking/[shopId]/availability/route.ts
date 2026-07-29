import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

/**
 * Public endpoint — returns the time slots that are already booked for a given date.
 * Booking page uses this to hide already-taken slots from the picker.
 *
 * GET /api/booking/[shopId]/availability?date=YYYY-MM-DD
 * Returns: { taken: ["09:00", "10:00", ...] }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const { shopId } = await params
  const date = request.nextUrl.searchParams.get("date")
  if (!date) {
    return NextResponse.json({ error: "Missing date" }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Verify shop exists (use slug OR id — booking page passes slug)
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .or(`id.eq.${shopId},slug.eq.${shopId}`)
    .single()

  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 })

  // Fetch all active appointments for that day, get start_time + end_time
  const startOfDay = `${date}T00:00:00`
  const endOfDay = `${date}T23:59:59`
  const { data: appts } = await supabase
    .from("appointments")
    .select("start_time, end_time")
    .eq("shop_id", shop.id)
    .gte("start_time", startOfDay)
    .lte("start_time", endOfDay)
    .in("status", ["confirmed", "pending", "in_progress", "checked_in"])

  // Return start times as HH:MM strings (in shop's local time, stored as UTC ISO)
  const taken = (appts || []).map((a) => {
    const d = new Date(a.start_time)
    const hh = String(d.getUTCHours()).padStart(2, "0")
    const mm = String(d.getUTCMinutes()).padStart(2, "0")
    return `${hh}:${mm}`
  })

  return NextResponse.json({ taken })
}