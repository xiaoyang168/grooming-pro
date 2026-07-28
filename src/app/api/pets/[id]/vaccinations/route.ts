import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function getShopId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .single()
  return shop?.id || null
}

// GET /api/pets/[id]/vaccinations — list vaccinations for a pet
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const shopId = await getShopId()
    if (!shopId) return NextResponse.json({ error: "No shop found" }, { status: 404 })

    const supabase = await createClient()
    // Verify the pet belongs to this shop
    const { data: pet } = await supabase
      .from("pets")
      .select("id")
      .eq("id", id)
      .eq("shop_id", shopId)
      .single()
    if (!pet) return NextResponse.json({ error: "Pet not found" }, { status: 404 })

    const { data, error } = await supabase
      .from("pet_vaccinations")
      .select("*")
      .eq("pet_id", id)
      .eq("shop_id", shopId)
      .order("administered_date", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/pets/[id]/vaccinations — add a vaccination record
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const shopId = await getShopId()
    if (!shopId) return NextResponse.json({ error: "No shop found" }, { status: 404 })

    const supabase = await createClient()
    // Verify the pet belongs to this shop
    const { data: pet } = await supabase
      .from("pets")
      .select("id")
      .eq("id", id)
      .eq("shop_id", shopId)
      .single()
    if (!pet) return NextResponse.json({ error: "Pet not found" }, { status: 404 })

    const body = await request.json()
    const vaccineName = typeof body.vaccine_name === "string" ? body.vaccine_name.trim() : ""
    const administeredDate = typeof body.administered_date === "string" ? body.administered_date.trim() : ""

    if (!vaccineName) return NextResponse.json({ error: "Vaccine name is required" }, { status: 400 })
    if (!administeredDate) return NextResponse.json({ error: "Administered date is required" }, { status: 400 })

    const { data, error } = await supabase
      .from("pet_vaccinations")
      .insert({
        pet_id: id,
        shop_id: shopId,
        vaccine_name: vaccineName,
        administered_date: administeredDate,
        expires_at: body.expires_at || null,
        notes: body.notes || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 201 })
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/pets/[id]/vaccinations?vid=xxx — delete a vaccination record
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const shopId = await getShopId()
    if (!shopId) return NextResponse.json({ error: "No shop found" }, { status: 404 })

    const vid = request.nextUrl.searchParams.get("vid")
    if (!vid) return NextResponse.json({ error: "Vaccination ID required" }, { status: 400 })

    const supabase = await createClient()
    const { error } = await supabase
      .from("pet_vaccinations")
      .delete()
      .eq("id", vid)
      .eq("pet_id", id)
      .eq("shop_id", shopId) // triple-check ownership

    if (error) return NextResponse.json({ error: "Delete failed" }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
