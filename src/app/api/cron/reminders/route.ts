import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { sendReminderEmail } from "@/lib/notifications"

/**
 * Vercel Cron Job: runs daily to send appointment reminders
 * Scheduled in vercel.json
 */
export async function GET(request: Request) {
  // Verify CRON_SECRET to prevent unauthorized access
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = await createServiceClient()

    // Get tomorrow's date range
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayStart = tomorrow.toISOString().slice(0, 10) + "T00:00:00Z"
    const dayEnd = tomorrow.toISOString().slice(0, 10) + "T23:59:59Z"

    // Find all appointments tomorrow that haven't been reminded yet
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(`
        id, start_time, notes, shop_id,
        customer:customers(name, email, phone),
        pet:pets(name, breed)
      `)
      .gte("start_time", dayStart)
      .lte("start_time", dayEnd)
      .is("reminder_sent_at", null)
      .in("status", ["confirmed", "pending"])

    if (error) {
      console.error("Cron: failed to fetch appointments", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ sent: 0, message: "No upcoming appointments to remind" })
    }

    // Get shop names
    const shopIds = [...new Set(appointments.map((a: any) => a.shop_id))]
    const { data: shops } = await supabase
      .from("shops")
      .select("id, name")
      .in("id", shopIds)

    const shopMap = new Map<string, string>()
    shops?.forEach((s: any) => shopMap.set(s.id, s.name))

    // Send reminders
    let sent = 0
    for (const a of appointments) {
      const customer = a.customer as any
      const pet = a.pet as any

      if (!customer || !customer.email) continue

      const success = await sendReminderEmail({
        customerName: customer.name,
        customerEmail: customer.email,
        petName: pet?.name || "your pet",
        serviceName: a.notes || "grooming",
        startTime: a.start_time,
        shopName: shopMap.get(a.shop_id) || "GroomingPro",
      })

      if (success) {
        // Mark as reminded
        await supabase
          .from("appointments")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", a.id)
        sent++
      }
    }

    return NextResponse.json({ sent, total: appointments.length })
  } catch (err: any) {
    console.error("Cron error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
