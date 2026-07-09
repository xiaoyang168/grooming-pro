import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getScheduleSuggestions } from "@/lib/ai"
import { isDemoMode } from "@/lib/demo"

export async function POST(request: NextRequest) {
  const demo = await isDemoMode()

  try {
    const body = await request.json()

    if (demo) {
      return NextResponse.json({
        data: [
          {
            staff_name: "Sarah",
            start_time: "10:00",
            score: 95,
            reason: "Best slot — no conflicts, optimal staff availability",
          },
          {
            staff_name: "Mike",
            start_time: "14:00",
            score: 82,
            reason: "Good slot — 1 buffer hour after lunch rush",
          },
          {
            staff_name: "Emma",
            start_time: "16:00",
            score: 76,
            reason: "Acceptable — late afternoon, good for regular clients",
          },
        ],
      })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const result = await getScheduleSuggestions(body)
    const suggestions = JSON.parse(result)
    return NextResponse.json({ data: suggestions })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "AI scheduling failed"
    }, { status: 500 })
  }
}
