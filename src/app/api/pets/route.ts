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

export async function GET(request: NextRequest) {
  try {
    const shopId = await getShopId()
    if (!shopId) return NextResponse.json({ error: "No shop found" }, { status: 404 })

    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get("q")

    let query = supabase
      .from("pets")
      .select(`
        *,
        customer:customers!inner(id, name)
      `)
      .eq("shop_id", shopId)
      .order("name")

    if (q) {
      query = query.or(`name.ilike.%${q}%,breed.ilike.%${q}%`)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const shopId = await getShopId()
    if (!shopId) return NextResponse.json({ error: "No shop found" }, { status: 404 })

    const supabase = await createClient()
    const body = await request.json()

    // Server-side validation: prevent empty UUID strings
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const customerId = typeof body.customer_id === "string" ? body.customer_id.trim() : ""
    if (!name) return NextResponse.json({ error: "Pet name is required" }, { status: 400 })
    if (!customerId) return NextResponse.json({ error: "Owner is required" }, { status: 400 })

    const { data, error } = await supabase
      .from("pets")
      .insert({
        shop_id: shopId,
        customer_id: customerId,
        name,
        species: body.species || "dog",
        breed: body.breed || null,
        gender: body.gender || "male",
        age_years: typeof body.age_years === "number" ? body.age_years : null,
        weight_kg: typeof body.weight_kg === "number" ? body.weight_kg : null,
        color: body.color || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 201 })
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
