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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const shopId = await getShopId()
    if (!shopId) return NextResponse.json({ error: "No shop found" }, { status: 404 })

    const body = await request.json()
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("staff")
      .update(body)
      .eq("id", id)
      .eq("shop_id", shopId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const shopId = await getShopId()
    if (!shopId) return NextResponse.json({ error: "No shop found" }, { status: 404 })

    const supabase = await createClient()
    // Soft delete: set is_active = false
    const { error } = await supabase
      .from("staff")
      .update({ is_active: false })
      .eq("id", id)
      .eq("shop_id", shopId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    if (e.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
