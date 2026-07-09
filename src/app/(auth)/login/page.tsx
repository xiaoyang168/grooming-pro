"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PawPrint, Sparkles, Eye, EyeOff } from "lucide-react"

const REMEMBERED_EMAIL_KEY = "grooming_remembered_email"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // 1. Check existing Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsLoggedIn(true)
        return
      }
      // 2. Otherwise, fill from localStorage
      const saved = localStorage.getItem(REMEMBERED_EMAIL_KEY)
      if (saved) setEmail(saved)
    })
  }, [supabase])

  useEffect(() => {
    if (isLoggedIn) {
      // Auto-redirect if already authenticated
      const t = setTimeout(() => {
        router.push("/")
        router.refresh()
      }, 500)
      return () => clearTimeout(t)
    }
  }, [isLoggedIn, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          },
        })
        if (error) throw error
        if (rememberMe) localStorage.setItem(REMEMBERED_EMAIL_KEY, email)
        setError("Check your email for the confirmation link!")
        return
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email)
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY)
      }
      router.push("/")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (error) setError(error.message)
  }

  async function handleDemoLogin() {
    document.cookie = "grooming_demo=true; path=/; max-age=86400"
    router.push("/")
    router.refresh()
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 px-4">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 h-[300px] w-[300px] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-[250px] w-[250px] rounded-full bg-amber-300/8 blur-3xl" />

      <Card className="w-full max-w-md animate-slide-up glass-strong shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-amber-500 shadow-lg shadow-primary/20">
            <PawPrint className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-2xl font-extrabold">
            {isLoggedIn ? "Welcome back!" : mode === "login" ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription className="text-base">
            {isLoggedIn
              ? "Redirecting to your dashboard..."
              : mode === "login"
              ? "Sign in to manage your grooming salon"
              : "Start your 14-day free trial"}
          </CardDescription>
          {isLoggedIn && (
            <div className="mt-3 mx-auto h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
          {mode === "signup" && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              No credit card required
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {isLoggedIn ? (
            <div className="text-center py-4">
              <Button variant="outline" onClick={handleSignOut} className="w-full">
                Sign out and switch account
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Password</label>
                <div className="relative mt-1.5">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {mode === "login" && (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  Remember me
                </label>
              )}
              {error && (
                <div className={`rounded-lg px-3 py-2 text-sm ${error.includes("confirmation") ? "bg-emerald-50 text-emerald-700" : "bg-destructive/10 text-destructive"}`}>
                  {error}
                </div>
              )}
              <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={loading}>
                {loading ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
              </Button>
            </form>
          )}

          <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground text-center mb-2">
              Supabase not configured? Preview the dashboard without signing in.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleDemoLogin}
            >
              Preview Dashboard (Demo)
            </Button>
          </div>

          <div className="mt-5">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground">or</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={handleGoogleLogin}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
          </div>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="font-semibold text-primary hover:underline"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login")
                setError("")
              }}
            >
              {mode === "login" ? "Sign up free" : "Sign in now"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
