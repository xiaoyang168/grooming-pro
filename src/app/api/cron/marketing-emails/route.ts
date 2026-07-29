import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "")
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "GroomingPro <noreply@petsalonos.com>"

/**
 * Cron job — runs daily via Vercel Cron.
 * Sends two types of marketing emails to Pro/Business shops:
 *   1. Pet birthday emails (3 days before birthday)
 *   2. Win-back emails (customers who haven't visited in 30+ days)
 *
 * Verify with: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  // ── Auth check ─────────────────────────────────────────────
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createServiceClient()
  const results = { birthday: 0, winback: 0, errors: [] as string[] }

  try {
    // ── 1. Get all Pro/Business active shops ─────────────────
    const { data: shops, error: shopsErr } = await supabase
      .from("shops")
      .select("id, name, slug, email, subscription_tier, subscription_status")
      .in("subscription_tier", ["pro", "business"])
      .eq("subscription_status", "active")

    if (shopsErr) {
      return NextResponse.json({ error: shopsErr.message }, { status: 500 })
    }

    if (!shops || shops.length === 0) {
      return NextResponse.json({ message: "No Pro/Business shops found", results })
    }

    // ── 2. Birthday emails (3 days before) ──────────────────
    // Match pets whose birthday (MM-DD) is 3 days from now
    const now = new Date()
    const target = new Date(now)
    target.setDate(target.getDate() + 3)
    const targetMonthDay = `${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`

    for (const shop of shops) {
      try {
        // Fetch pets with birthday matching target MM-DD
        const { data: birthdayPets } = await supabase
          .from("pets")
          .select("id, name, birthday, customer:customers!inner(id, name, email)")
          .eq("shop_id", shop.id)
          .not("birthday", "is", null)

        if (birthdayPets) {
          for (const pet of birthdayPets) {
            if (!pet.birthday) continue
            // Extract MM-DD from birthday (YYYY-MM-DD)
            const petMonthDay = pet.birthday.slice(5)
            if (petMonthDay !== targetMonthDay) continue

            const customer = pet.customer as unknown as { name: string; email: string }
            if (!customer?.email) continue

            // Check if we already sent a birthday email this year (avoid duplicates)
            const today = now.toISOString().slice(0, 10)
            const { data: existing } = await supabase
              .from("sent_marketing_emails")
              .select("id")
              .eq("pet_id", pet.id)
              .eq("type", "birthday")
              .eq("sent_date", today)
              .maybeSingle()

            if (existing) continue // Already sent today

            // Send birthday email
            await resend.emails.send({
              from: FROM_EMAIL,
              to: [customer.email],
              subject: `🎂 ${pet.name}'s birthday is coming up!`,
              html: `
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
                  <h2>🎂 ${pet.name}'s birthday is almost here!</h2>
                  <p>Hi ${customer.name},</p>
                  <p>${pet.name}'s birthday is in 3 days! 🎉</p>
                  <p>To celebrate, we'd love to treat ${pet.name} to a special grooming session. Book now and get <strong>20% off</strong> your next visit!</p>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/booking/${shop.slug}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">Book Now →</a>
                  <p style="color: #888; font-size: 12px; margin-top: 24px;">— ${shop.name}</p>
                </div>
              `,
            })

            // Log that we sent it
            await supabase.from("sent_marketing_emails").insert({
              shop_id: shop.id,
              pet_id: pet.id,
              type: "birthday",
              sent_date: today,
            })
            results.birthday++
          }
        }
      } catch (err) {
        results.errors.push(`Birthday shop ${shop.id}: ${err}`)
      }
    }

    // ── 3. Win-back emails (30+ days since last visit) ───────
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    for (const shop of shops) {
      try {
        // Find customers whose last appointment was 30+ days ago
        // and who haven't received a winback email in the last 30 days
        const { data: customers } = await supabase
          .from("customers")
          .select("id, name, email")
          .eq("shop_id", shop.id)
          .not("email", "is", null)

        if (!customers) continue

        for (const customer of customers) {
          if (!customer.email) continue

          // Check last appointment date
          const { data: lastAppt } = await supabase
            .from("appointments")
            .select("start_time")
            .eq("shop_id", shop.id)
            .eq("customer_id", customer.id)
            .in("status", ["completed", "confirmed", "no_show"])
            .order("start_time", { ascending: false })
            .limit(1)
            .maybeSingle()

          // Skip if customer has a recent appointment (within 30 days)
          if (lastAppt) {
            const lastDate = new Date(lastAppt.start_time)
            if (lastDate > thirtyDaysAgo) continue
          }

          // Skip if we already sent winback in last 30 days
          const { data: existing } = await supabase
            .from("sent_marketing_emails")
            .select("id")
            .eq("customer_id", customer.id)
            .eq("type", "winback")
            .gte("sent_date", thirtyDaysAgo.toISOString().slice(0, 10))
            .maybeSingle()

          if (existing) continue

          // Send win-back email
          await resend.emails.send({
            from: FROM_EMAIL,
            to: [customer.email],
            subject: `🐶 We miss you at ${shop.name}!`,
            html: `
              <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
                <h2>🐶 We miss you!</h2>
                <p>Hi ${customer.name},</p>
                <p>It's been a while since your last visit to ${shop.name}. We'd love to see you again!</p>
                <p>Come back and enjoy <strong>10% off</strong> your next grooming session.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/booking/${shop.slug}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">Book Your Visit →</a>
                <p style="color: #888; font-size: 12px; margin-top: 24px;">— ${shop.name}</p>
              </div>
            `,
          })

          await supabase.from("sent_marketing_emails").insert({
            shop_id: shop.id,
            customer_id: customer.id,
            type: "winback",
            sent_date: now.toISOString().slice(0, 10),
          })
          results.winback++
        }
      } catch (err) {
        results.errors.push(`Winback shop ${shop.id}: ${err}`)
      }
    }

    return NextResponse.json({
      message: "Marketing emails processed",
      shops: shops.length,
      results,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message, results }, { status: 500 })
  }
}
