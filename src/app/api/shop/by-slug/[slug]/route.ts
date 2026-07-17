import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createClient()

    const { data: shop, error } = await supabase
      .from("shops")
      .select("id, name, slug, phone, email, address, business_hours")
      .eq("slug", slug)
      .single()

    if (error || !shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 })
    }

    const { data: services } = await supabase
      .from("services")
      .select("id, name, category, duration_minutes, price, description")
      .eq("shop_id", shop.id)
      .eq("is_active", true)
      .order("category")
      .order("name")

    return NextResponse.json({ data: { shop, services } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 })
  }
}
