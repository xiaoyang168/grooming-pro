"use client"

import { useState, useEffect, use } from "react"
import { PawPrint, Clock, Scissors, Sparkles, Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface ShopData {
  shop: { id: string; name: string; phone: string; email: string; address: string }
  services: Array<{ id: string; name: string; category: string; duration_minutes: number; price: number; description: string }>
}

function generateTimeSlots(hours: { open: string; close: string } | null) {
  if (!hours) return ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"]
  const [openH, openM] = hours.open.split(":").map(Number)
  const [closeH, closeM] = hours.close.split(":").map(Number)
  const slots: string[] = []
  let h = openH, m = openM
  while (h < closeH || (h === closeH && m < closeM)) {
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
    m += 30
    if (m >= 60) { h++; m = 0 }
  }
  return slots
}

export default function BookingPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = use(params)

  const [data, setData] = useState<ShopData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [petName, setPetName] = useState("")
  const [petSpecies, setPetSpecies] = useState<"dog" | "cat" | "other">("dog")
  const [petBreed, setPetBreed] = useState("")
  const [selectedService, setSelectedService] = useState(0)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    fetch(`/api/shop/by-slug/${shopId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setData(res.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [shopId])

  useEffect(() => {
    const today = new Date()
    setSelectedDate(today.toISOString().slice(0, 10))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerName || !petName || !data || !selectedService || !selectedTime) return
    setSubmitting(true)
    setResult(null)

    try {
      const res = await fetch("/api/book-appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_id: data.shop.id,
          customer_name: customerName,
          customer_email: customerEmail || null,
          customer_phone: customerPhone || null,
          pet_name: petName,
          pet_species: petSpecies,
          pet_breed: petBreed || null,
          service_id: data.services[selectedService].id,
          start_time: `${selectedDate}T${selectedTime}:00`,
          notes: notes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Booking failed")
      setResult({ success: true, message: json.data?.message || "Booking submitted!" })
    } catch (err: unknown) {
      setResult({ success: false, message: err instanceof Error ? err.message : "Failed to book" })
    } finally {
      setSubmitting(false)
    }
  }

  const timeSlots = generateTimeSlots(null)
  const svc = data?.services?.[selectedService]
  const today = new Date().toISOString().slice(0, 10)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data || !data.services.length) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        <p>This shop is not available for online booking.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <div className="absolute top-0 right-0 h-[200px] w-[200px] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-[180px] w-[180px] rounded-full bg-amber-300/8 blur-3xl" />

      <header className="sticky top-0 z-10 border-b border-primary/10 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-amber-500 shadow-md shadow-primary/20">
            <PawPrint className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg">{data.shop.name}</h1>
            <p className="text-xs text-muted-foreground">{data.shop.address || "Online booking"}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 space-y-5">
        {result && (
          <div className={`rounded-2xl p-4 flex items-center gap-3 ${
            result.success ? "bg-emerald-50 border-emerald-200 border" : "bg-red-50 border-red-200 border"
          }`}>
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            )}
            <p className={`text-sm font-semibold ${result.success ? "text-emerald-800" : "text-red-800"}`}>
              {result.message}
            </p>
          </div>
        )}

        {!result?.success && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Step 1: Your Info */}
          <section className="rounded-2xl bg-white/90 backdrop-blur p-5 shadow-sm border">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-sm font-extrabold text-primary">1</span>
              Your Info
            </h2>
            <div className="space-y-3">
              <input
                className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Your name *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="email"
                  className="rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
                <input
                  className="rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Step 2: Pet Info */}
          <section className="rounded-2xl bg-white/90 backdrop-blur p-5 shadow-sm border">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-sm font-extrabold text-amber-600">2</span>
              Pet Info
            </h2>
            <div className="space-y-3">
              <input
                className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Pet name *"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  className="rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  value={petSpecies}
                  onChange={(e) => setPetSpecies(e.target.value as "dog" | "cat" | "other")}
                >
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="other">Other</option>
                </select>
                <input
                  className="rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Breed (optional)"
                  value={petBreed}
                  onChange={(e) => setPetBreed(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Step 3: Select Service */}
          <section className="rounded-2xl bg-white/90 backdrop-blur p-5 shadow-sm border">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-sm font-extrabold text-blue-600">3</span>
              Select Service
            </h2>
            <div className="space-y-2">
              {data.services.map((svc, i) => (
                <label
                  key={svc.id}
                  className={`flex items-center justify-between rounded-xl border-2 p-4 cursor-pointer transition-all ${
                    selectedService === i ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="service"
                      className="h-4 w-4 accent-primary"
                      checked={selectedService === i}
                      onChange={() => setSelectedService(i)}
                    />
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-amber-400/20">
                      <Scissors className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{svc.name}</p>
                      <p className="text-xs text-muted-foreground">{svc.duration_minutes} min · {svc.description || svc.category}</p>
                    </div>
                  </div>
                  <span className="text-lg font-extrabold text-primary">${(svc.price / 100).toFixed(0)}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Step 4: Select Date & Time */}
          <section className="rounded-2xl bg-white/90 backdrop-blur p-5 shadow-sm border">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-sm font-extrabold text-emerald-600">4</span>
              Select Date & Time
            </h2>
            <input
              type="date"
              min={today}
              className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <div className="mt-3 grid grid-cols-3 gap-2">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  type="button"
                  className={`rounded-xl border-2 py-3 text-sm font-semibold transition-all ${
                    selectedTime === time ? "border-primary bg-primary text-white shadow-md" : "border-border hover:border-primary/50 hover:text-primary"
                  }`}
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" />
              Available slots refresh in real-time
            </p>
          </section>

          {/* Step 5: Notes */}
          <section className="rounded-2xl bg-white/90 backdrop-blur p-5 shadow-sm border">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-sm font-extrabold text-violet-600">5</span>
              Special Requests
            </h2>
            <textarea
              className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              rows={3}
              placeholder="Allergies, special requests, notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !customerName || !petName || !svc || !selectedTime}
            className="w-full rounded-2xl bg-gradient-to-r from-primary to-amber-500 py-4 text-lg font-extrabold text-white shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Booking...
              </span>
            ) : (
              `Confirm Booking — ${svc ? `$${(svc.price / 100).toFixed(0)}` : ""}`
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground pb-8">
            You will only be charged upon confirmation · Cancel anytime
          </p>
        </form>
        )}
      </main>
    </div>
  )
}
