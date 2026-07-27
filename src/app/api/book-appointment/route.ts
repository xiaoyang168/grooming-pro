import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendConfirmationEmail } from "@/lib/notifications"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      shop_id,
      customer_name,
      customer_email,
      customer_phone,
      pet_name,
      pet_species,
      pet_breed,
      service_id,
      start_time,
      notes,
    } = body

    if (!shop_id || !customer_name || !pet_name || !service_id || !start_time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Create or find customer by email
    let customerId: string | null = null
    if (customer_email) {
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("email", customer_email)
        .eq("shop_id", shop_id)
        .single()
      customerId = existing?.id || null
    }

    if (!customerId) {
      const { data: newCust, error: custErr } = await supabase
        .from("customers")
        .insert({
          shop_id,
          name: customer_name,
          email: customer_email || null,
          phone: customer_phone || null,
        })
        .select("id")
        .single()
      if (custErr) return NextResponse.json({ error: custErr.message }, { status: 500 })
      customerId = newCust.id
    }

    // Create pet
    const { data: pet, error: petErr } = await supabase
      .from("pets")
      .insert({
        shop_id,
        customer_id: customerId,
        name: pet_name,
        species: pet_species || "dog",
        breed: pet_breed || null,
      })
      .select("id")
      .single()
    if (petErr) return NextResponse.json({ error: petErr.message }, { status: 500 })

    // Get service duration
    const { data: service } = await supabase
      .from("services")
      .select("name, duration_minutes, price")
      .eq("id", service_id)
      .single()

    if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 })

    const duration = service.duration_minutes
    const endTime = new Date(new Date(start_time).getTime() + duration * 60000).toISOString()

    // Check for time conflicts (existing appointment overlapping this time slot)
    const { data: conflicts } = await supabase
      .from("appointments")
      .select("id")
      .eq("shop_id", shop_id)
      .in("status", ["confirmed", "pending", "in_progress", "checked_in"])
      .or(`and(start_time.lt.${endTime},end_time.gt.${start_time})`)
      .limit(1)

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: "This time slot is already booked. Please choose a different time." },
        { status: 409 }
      )
    }

    // Create appointment
    const { data: appointment, error: apptErr } = await supabase
      .from("appointments")
      .insert({
        shop_id,
        customer_id: customerId,
        pet_id: pet.id,
        service_ids: [service_id],
        start_time,
        end_time: endTime,
        status: "pending",
        price: service.price,
        is_paid: false,
        notes: notes || null,
      })
      .select()
      .single()

    if (apptErr) return NextResponse.json({ error: apptErr.message }, { status: 500 })

    // Send confirmation email to customer
    if (customer_email) {
      const { data: shop } = await supabase
        .from("shops")
        .select("name, slug")
        .eq("id", shop_id)
        .single()

      await sendConfirmationEmail({
        customerName: customer_name,
        customerEmail: customer_email,
        petName: pet_name,
        serviceName: service.name || notes || "Grooming",
        startTime: start_time,
        shopName: shop?.name || "GroomingPro",
        bookingLink: shop?.slug ? `${process.env.NEXT_PUBLIC_APP_URL}/booking/${shop.slug}` : undefined,
      })
    }

    return NextResponse.json({
      data: {
        appointment,
        message: "Booking request submitted! We'll confirm shortly.",
      },
    }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Booking failed" }, { status: 500 })
  }
}
