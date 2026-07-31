import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createHash, randomBytes } from "crypto"
import { createServiceClient } from "@/lib/supabase/server"

const DEVICE_COOKIE = "grooming_device_id"
const TRIAL_DAYS = 14
const MAX_TRIALS_PER_IP = 3

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
}

export async function POST(request: Request) {
  let deviceId = request.headers.get("cookie")?.match(/(?:^|;\s*)grooming_device_id=([^;]+)/)?.[1]
  const isNewDevice = !deviceId
  if (!deviceId) deviceId = randomBytes(32).toString("hex")

  try {
    const body = await request.json()
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const admin = createServiceClient()

    // Check if email already exists in auth.users using service role
    const { data: existingUser } = await admin
      .schema("auth")
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (existingUser) {
      return withDeviceCookie(
        NextResponse.json(
          { error: "An account with this email already exists. Please sign in instead." },
          { status: 409 }
        ),
        deviceId,
        isNewDevice
      )
    }

    const { data: existingClaim } = await admin
      .from("trial_claims")
      .select("id")
      .eq("device_hash", sha256(deviceId))
      .maybeSingle()

    if (existingClaim) {
      return withDeviceCookie(
        NextResponse.json(
          { error: "This device has already used a free trial. Please sign in or choose a paid plan." },
          { status: 409 }
        ),
        deviceId,
        isNewDevice
      )
    }

    // IP-based trial limit: same network can only have N free trials
    const ipHash = sha256(getClientIp(request))
    const { count: ipTrialCount, error: ipCountError } = await admin
      .from("trial_claims")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)

    if (ipCountError) {
      console.error("IP trial count error:", ipCountError)
    }
    if ((ipTrialCount ?? 0) >= MAX_TRIALS_PER_IP) {
      return withDeviceCookie(
        NextResponse.json(
          { error: `This network has already used ${MAX_TRIALS_PER_IP} free trials. Please sign in or upgrade to a paid plan.` },
          { status: 429 }
        ),
        deviceId,
        isNewDevice
      )
    }

    // Reserve the device before creating the auth user. The unique index closes
    // the race where two signup requests arrive from the same browser together.
    const { data: claim, error: claimError } = await admin
      .from("trial_claims")
      .insert({
        device_hash: sha256(deviceId),
        email_normalized: email,
        ip_hash: ipHash,
      })
      .select("id")
      .single()

    if (claimError || !claim) {
      if (claimError?.code === "23505") {
        return withDeviceCookie(
          NextResponse.json(
            { error: "This device has already used a free trial. Please sign in or choose a paid plan." },
            { status: 409 }
          ),
          deviceId,
          isNewDevice
        )
      }
      throw claimError || new Error("Unable to reserve trial")
    }

    const authClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
    const { data, error } = await authClient.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${new URL(request.url).origin}/api/auth/callback` },
    })

    if (error || !data.user) {
      await admin.from("trial_claims").delete().eq("id", claim.id)
      throw error || new Error("Unable to create account")
    }

    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString()
    const { error: claimUpdateError } = await admin
      .from("trial_claims")
      .update({ user_id: data.user.id })
      .eq("id", claim.id)
    if (claimUpdateError) throw claimUpdateError

    const { error: shopError } = await admin
      .from("shops")
      .update({ trial_ends_at: trialEndsAt, subscription_status: "trialing" })
      .eq("owner_id", data.user.id)
    if (shopError) throw shopError

    return withDeviceCookie(
      NextResponse.json({ success: true, needsConfirmation: !data.session }),
      deviceId,
      isNewDevice
    )
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create account" },
      { status: 500 }
    )
  }
}

function withDeviceCookie(response: NextResponse, deviceId: string, isNewDevice: boolean) {
  if (isNewDevice) {
    response.cookies.set(DEVICE_COOKIE, deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    })
  }
  return response
}
