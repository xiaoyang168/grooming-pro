import { cookies } from "next/headers"

export async function isDemoMode() {
  const cookieStore = await cookies()
  return cookieStore.get("grooming_demo")?.value === "true"
}
