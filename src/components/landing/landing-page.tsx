"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CalendarCheck, Users, BarChart3, Sparkles, CreditCard, ArrowRight, Star,
  Shield, Zap, Clock, TrendingUp, Scissors, PawPrint, Bell, Brain, MousePointerClick,
} from "lucide-react"

const features = [
  {
    icon: CalendarCheck, title: "AI Smart Scheduling",
    desc: "Automatically optimize time slots, reduce gaps, and fill waitlists. Conflict detection built in.",
    color: "text-amber-500", bg: "bg-amber-50",
  },
  {
    icon: Brain, title: "Churn Prediction",
    desc: "AI identifies customers at risk of churning so you can bring them back — retention up to 40%.",
    color: "text-violet-500", bg: "bg-violet-50",
  },
  {
    icon: Bell, title: "Automated Notifications",
    desc: "Booking confirmations, reminders, and completion notices — sent automatically so customers never miss a visit.",
    color: "text-emerald-500", bg: "bg-emerald-50",
  },
  {
    icon: BarChart3, title: "AI Analytics Dashboard",
    desc: '\"What was last month\'s revenue?\" \"Who are my top customers?\" — ask in plain English, get instant charts.',
    color: "text-blue-500", bg: "bg-blue-50",
  },
  {
    icon: MousePointerClick, title: "Self-Service Booking",
    desc: "Customers book online by pet, service, and time in three taps. Fewer phone calls, fewer no-shows.",
    color: "text-rose-500", bg: "bg-rose-50",
  },
  {
    icon: CreditCard, title: "Online Payments",
    desc: "Stripe-integrated deposits and full payments at booking. Reduce no-shows and keep cash flow healthy.",
    color: "text-cyan-500", bg: "bg-cyan-50",
  },
]

const pricingPlans = [
  {
    name: "Starter", price: "$29", period: "/month",
    desc: "For small grooming studios",
    features: ["Up to 2 staff members", "Online booking", "Basic customer management", "Email notifications", "7-day data history"],
    cta: "Start Free Trial", popular: false,
  },
  {
    name: "Professional", price: "$59", period: "/month",
    desc: "For growing salons",
    features: ["Unlimited staff", "AI smart scheduling", "AI churn alerts", "SMS + email notifications", "AI analytics dashboard",
      "Stripe online payments", "30-day data history", "Priority support"],
    cta: "Start Free Trial", popular: true,
  },
  {
    name: "Enterprise", price: "$99", period: "/month",
    desc: "For multi-location chains",
    features: ["All Pro features", "Multi-location management", "Custom branding", "API access", "Unlimited data history",
      "Dedicated account manager", "Custom reporting"],
    cta: "Contact Sales", popular: false,
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ═══ Nav ═══ */}
      <nav className="fixed top-0 z-50 w-full glass-strong border-b border-primary/10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white text-lg">🐾</span>
            <span className="text-gradient">GroomingPro</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link href="/login?signup=true"><Button variant="gradient" size="sm">Get Started Free <ArrowRight className="ml-1.5 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </nav>

      {/* ═══ Hero ═══ */}
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl animate-float-slow" />
        <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-amber-300/10 blur-3xl animate-float" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[600px] rounded-full bg-primary/3 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="animate-slide-up mb-6 flex justify-center">
              <Badge variant="default" className="px-4 py-1.5 text-sm gap-1.5"><Sparkles className="h-3.5 w-3.5" />AI-Powered Pet Grooming Software</Badge>
            </div>
            <h1 className="animate-slide-up text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
              Save 50% Time, Grow Revenue<br /><span className="text-gradient">30% with AI</span>
            </h1>
            <p className="animate-slide-up mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed" style={{ animationDelay: "0.1s" }}>
              AI-powered grooming salon software. Scheduling, reminders, CRM, and analytics — all in one place.
            </p>
            <div className="animate-slide-up mt-10 flex flex-col sm:flex-row items-center justify-center gap-4" style={{ animationDelay: "0.2s" }}>
              <Link href="/login?signup=true"><Button variant="gradient" size="xl" className="shadow-lg shadow-primary/25">Start 14-Day Free Trial <ArrowRight className="ml-2 h-5 w-5" /></Button></Link>
              <Link href="#features"><Button variant="outline" size="xl">See Features</Button></Link>
            </div>
            <p className="animate-slide-up mt-4 text-sm text-muted-foreground" style={{ animationDelay: "0.3s" }}>No credit card required · 30-second setup · Cancel anytime</p>
          </div>

          {/* Dashboard preview */}
          <div className="animate-slide-up mx-auto mt-16 max-w-5xl" style={{ animationDelay: "0.4s" }}>
            <div className="rounded-2xl border bg-card shadow-2xl shadow-primary/5 overflow-hidden">
              <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" /><div className="h-3 w-3 rounded-full bg-amber-400" /><div className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <div className="mx-auto text-xs text-muted-foreground">GroomingPro Dashboard</div>
              </div>
              <div className="p-6 sm:p-8">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Today's Appointments", value: "8", icon: CalendarCheck, color: "text-primary" },
                    { label: "Monthly Revenue", value: "$28,500", icon: TrendingUp, color: "text-emerald-500" },
                    { label: "Active Customers", value: "142", icon: Users, color: "text-blue-500" },
                    { label: "AI Suggestions", value: "3", icon: Sparkles, color: "text-amber-500" },
                  ].map((s, i) => (
                    <div key={i} className="rounded-xl border bg-card p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><s.icon className={`h-4 w-4 ${s.color}`} />{s.label}</div>
                      <div className="text-2xl font-bold">{s.value}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 rounded-xl border bg-muted/30 p-4">
                    <div className="text-sm font-semibold mb-3">Today's Appointment Timeline</div>
                    <div className="space-y-2">
                      {[{ t: "09:00", p: "Buddy", s: "Full Groom", st: "In Progress" },{ t: "10:30", p: "Luna", s: "Bath & Trim", st: "Confirmed" },{ t: "13:00", p: "Max", s: "Nail Trim", st: "Confirmed" },{ t: "14:30", p: "Bella", s: "Full Groom", st: "Pending" }].map((a, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg bg-card px-3 py-2 text-sm">
                          <div className="flex items-center gap-3"><span className="font-mono text-muted-foreground w-12">{a.t}</span><span className="font-medium">{a.p}</span><span className="text-muted-foreground">· {a.s}</span></div>
                          <Badge variant={a.st === "In Progress" ? "success" : a.st === "Confirmed" ? "default" : "secondary"} className="text-xs">{a.st}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-primary/10 to-amber-400/10 p-4 flex flex-col justify-center items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 mb-3"><Sparkles className="h-6 w-6 text-primary" /></div>
                    <div className="text-sm font-semibold mb-1">AI Assistant</div>
                    <div className="text-xs text-muted-foreground mb-3">&ldquo;Buddy hasn't been groomed for 6 weeks. Send a reminder?&rdquo;</div>
                    <Button size="sm" variant="gradient">View Details</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Trust ═══ */}
      <section className="border-y bg-muted/20 py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-center text-sm text-muted-foreground mb-6">Trusted by 500+ grooming salons worldwide</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-40">
            {["🐕 Paws & Claws", "🐱 Purrfect Groom", "🐶 Doggy Style", "🦴 Happy Tails", "🐾 Fluffy Friends"].map((n, i) => (<span key={i} className="text-sm font-semibold">{n}</span>))}
          </div>
        </div>
      </section>

      {/* ═══ Features ═══ */}
      <section id="features" className="py-20 sm:py-28 bg-paws">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge variant="default" className="mb-4 px-3 py-1"><Sparkles className="h-3 w-3 mr-1" />Core Features</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Run Your Salon Smarter with AI</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">From booking to payment, CRM to analytics — one platform handles everything.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={i} className="group rounded-2xl border bg-card p-6 card-hover">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${f.bg} mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`h-6 w-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Get Started in 3 Steps</h2>
            <p className="mt-4 text-muted-foreground">From signup to live in under 5 minutes</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3 max-w-4xl mx-auto">
            {[{ step: "01", title: "Create Account", desc: "30-second signup. Set your shop info and business hours." },{ step: "02", title: "Add Services", desc: "Add your grooming services and prices so customers can book online." },{ step: "03", title: "Start Taking Bookings", desc: "Share your booking link. AI handles scheduling, reminders, and analytics." }].map((s, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary text-xl font-bold mb-4">{s.step}</div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Pricing ═══ */}
      <section id="pricing" className="py-20 sm:py-28 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-muted-foreground">Every plan includes a 14-day free trial. No credit card required.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <div key={i} className={`relative rounded-2xl border bg-card p-8 flex flex-col ${plan.popular ? "ring-2 ring-primary shadow-lg shadow-primary/10" : ""}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="shadow-sm"><Star className="h-3 w-3 mr-1" />Most Popular</Badge>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <Shield className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/login?signup=true" className="w-full">
                  <Button variant={plan.popular ? "gradient" : "outline"} className="w-full">{plan.cta}</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <div className="rounded-2xl bg-gradient-to-br from-primary to-orange-600 p-10 sm:p-14 shadow-xl shadow-primary/25">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to run your salon smarter?</h2>
            <p className="mt-4 text-primary-foreground/80 max-w-lg mx-auto">Join 500+ grooming salons using AI to free up time for what matters.</p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/login?signup=true"><Button size="xl" className="bg-white text-primary hover:bg-white/90 shadow-lg">Start Free Trial</Button></Link>
            </div>
            <p className="mt-4 text-sm text-primary-foreground/60">14-day full-feature free trial · No credit card · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="border-t bg-card py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 font-bold text-lg mb-4"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white text-sm">🐾</span>GroomingPro</div>
              <p className="text-sm text-muted-foreground">AI-powered pet grooming management software</p>
            </div>
            {[
              { title: "Product", links: ["Features", "Pricing", "Changelog", "API"] },
              { title: "Resources", links: ["Help Center", "Video Tutorials", "Blog", "Community"] },
              { title: "Company", links: ["About Us", "Contact", "Privacy Policy", "Terms of Service"] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-semibold text-sm mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((l, j) => (
                    <li key={j}>
                      <span className="text-sm text-muted-foreground cursor-default">{l}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} GroomingPro. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
