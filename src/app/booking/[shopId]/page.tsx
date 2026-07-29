"use client"

import { useState, useEffect, use, useRef } from "react"
import { PawPrint, Clock, Scissors, Sparkles, Loader2, CheckCircle, AlertCircle, Share2, Copy, X, CreditCard } from "lucide-react"
import QRCode from "qrcode"
import { DatePicker } from "@/components/ui/date-picker"

interface ShopData {
  shop: { id: string; name: string; phone: string; email: string; address: string; business_hours?: Record<string, { open: string; close: string }> }
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
  const [appointmentId, setAppointmentId] = useState<string | null>(null)
  const [payingDeposit, setPayingDeposit] = useState(false)

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({})
  const [showShare, setShowShare] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const customerRef = useRef<HTMLInputElement>(null)
  const petRef = useRef<HTMLInputElement>(null)
  const timeRef = useRef<HTMLDivElement>(null)

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

  // Check if returning from Creem payment
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("payment") === "success") {
      setResult({ success: true, message: "Deposit paid! Your booking is confirmed." })
      setAppointmentId(params.get("apt") || null)
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [])

  function validateAndScroll() {
    const errors: Record<string, boolean> = {}
    if (!customerName.trim()) {
      errors.customerName = true
      customerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      customerRef.current?.focus()
      return errors
    }
    if (!petName.trim()) {
      errors.petName = true
      petRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      petRef.current?.focus()
      return errors
    }
    if (!selectedTime) {
      errors.selectedTime = true
      timeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      return errors
    }
    return errors
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errors = validateAndScroll()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return
    if (!data) return

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
      setAppointmentId(json.data?.appointment?.id || null)
    } catch (err: unknown) {
      setResult({ success: false, message: err instanceof Error ? err.message : "Failed to book" })
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePayDeposit() {
    if (!appointmentId) return
    setPayingDeposit(true)
    try {
      const res = await fetch("/api/creem/payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment_id: appointmentId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to start payment")
      if (json.url) window.location.href = json.url
    } catch (err: unknown) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Payment failed",
      })
    } finally {
      setPayingDeposit(false)
    }
  }

  async function openShare() {
    const url = window.location.href
    try {
      const dataUrl = await QRCode.toDataURL(url, { width: 240, margin: 1, color: { dark: "#6366f1", light: "#ffffff" } })
      setQrDataUrl(dataUrl)
    } catch {
      setQrDataUrl("")
    }
    setShowShare(true)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Get shop's business hours for the selected date's day of week
  const getBusinessHoursForDate = () => {
    if (!data?.shop?.business_hours) return null
    const hours = data.shop.business_hours
    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
    const d = selectedDate ? new Date(selectedDate + "T00:00:00") : new Date()
    const dayKey = dayNames[d.getDay()]
    return hours[dayKey] || null
  }

  const businessHours = getBusinessHoursForDate()
  const timeSlots = generateTimeSlots(businessHours)
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

        {/* Pay Deposit button — shown after successful booking */}
        {result?.success && appointmentId && (
          <button
            onClick={handlePayDeposit}
            disabled={payingDeposit}
            className="w-full rounded-2xl bg-gradient-to-r from-primary to-pink-500 text-white font-bold py-4 px-6 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {payingDeposit ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Redirecting to payment...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" /> Pay Deposit Online
              </>
            )}
          </button>
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
                ref={customerRef}
                className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 ${
                  fieldErrors.customerName ? "border-red-400 ring-red-200 bg-red-50" : "focus:ring-primary/30"
                }`}
                placeholder="Your name *"
                value={customerName}
                onChange={(e) => { setCustomerName(e.target.value); setFieldErrors({}) }}
              />
              {fieldErrors.customerName && <p className="text-xs text-red-500 mt-1">Please enter your name</p>}
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
                ref={petRef}
                className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 ${
                  fieldErrors.petName ? "border-red-400 ring-red-200 bg-red-50" : "focus:ring-primary/30"
                }`}
                placeholder="Pet name *"
                value={petName}
                onChange={(e) => { setPetName(e.target.value); setFieldErrors({}) }}
              />
              {fieldErrors.petName && <p className="text-xs text-red-500 mt-1">Please enter your pet's name</p>}
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
          <section ref={timeRef} className={`rounded-2xl bg-white/90 backdrop-blur p-5 shadow-sm border ${fieldErrors.selectedTime ? "ring-2 ring-red-300" : ""}`}>
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-sm font-extrabold text-emerald-600">4</span>
              Select Date & Time
            </h2>
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              fromDate={new Date(today)}
              placeholder="Pick a date"
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
            {fieldErrors.selectedTime && (
              <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Please pick a time slot above
              </p>
            )}
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
            disabled={submitting}
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

        {/* Share Link Button */}
        <div className="pb-8">
          <button
            onClick={openShare}
            className="w-full rounded-2xl border-2 border-dashed border-primary/30 py-4 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share Booking Link
          </button>
        </div>

        {/* Share Modal */}
        {showShare && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowShare(false)}>
            <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Share Booking Link</h3>
                <button onClick={() => setShowShare(false)} className="p-1 hover:bg-muted rounded-lg"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex flex-col items-center gap-4">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="w-60 h-60 rounded-xl border" />
                ) : (
                  <div className="w-60 h-60 rounded-xl border bg-muted flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground text-center">Scan with your phone to book</p>
                <div className="flex gap-2 w-full">
                  <input
                    className="flex-1 rounded-xl border bg-muted/50 px-3 py-2 text-xs text-muted-foreground truncate"
                    value={window.location.href}
                    readOnly
                  />
                  <button
                    onClick={copyLink}
                    className="rounded-xl bg-primary px-4 py-2 text-white text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1 shrink-0"
                  >
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
