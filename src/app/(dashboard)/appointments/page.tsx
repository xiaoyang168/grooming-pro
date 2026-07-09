"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Plus, ChevronLeft, ChevronRight, MoreHorizontal, Clock, User, PawPrint, Scissors, Loader2 } from "lucide-react"
import type { AppointmentWithDetails, Customer, Pet, Staff, Service } from "@/types"

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const statusMap: Record<string, { label: string; variant: "success" | "default" | "warning" | "secondary" }> = {
  in_progress: { label: "In Progress", variant: "success" },
  checked_in: { label: "Checked In", variant: "success" },
  confirmed: { label: "Confirmed", variant: "default" },
  pending: { label: "Pending", variant: "warning" },
  completed: { label: "Completed", variant: "secondary" },
  canceled: { label: "Canceled", variant: "secondary" },
  no_show: { label: "No Show", variant: "secondary" },
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [filter, setFilter] = useState("All")

  const [customers, setCustomers] = useState<Customer[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [services, setServices] = useState<Service[]>([])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [form, setForm] = useState({
    customer_id: "",
    pet_id: "",
    staff_id: "",
    service_id: "",
    date: "",
    time: "",
    notes: "",
  })

  const selectedDate = new Date()
  selectedDate.setDate(selectedDate.getDate() + offset)
  const dateStr = selectedDate.toISOString().slice(0, 10)
  const displayDate = selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })

  async function fetchData() {
    setLoading(true)
    try {
      const [apptRes, custRes, petRes, staffRes, svcRes] = await Promise.all([
        fetch(`/api/appointments?date=${dateStr}`).then((r) => r.json()),
        fetch("/api/customers").then((r) => r.json()),
        fetch("/api/pets").then((r) => r.json()),
        fetch("/api/staff").then((r) => r.json()),
        fetch("/api/services").then((r) => r.json()),
      ])
      if (apptRes.data) setAppointments(apptRes.data)
      if (custRes.data) setCustomers(custRes.data)
      if (petRes.data) setPets(petRes.data)
      if (staffRes.data) setStaff(staffRes.data)
      if (svcRes.data) setServices(svcRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [offset])

  const filteredApps =
    filter === "All"
      ? appointments
      : appointments.filter((a) => {
          const s = statusMap[a.status]
          return s && s.label === filter
        })

  const customerPets = pets.filter((p) => p.customer_id === form.customer_id)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFeedback(null)
    try {
      const selectedService = services.find((s) => s.id === form.service_id)
      const duration = selectedService?.duration_minutes || 60
      const startTime = new Date(`${form.date}T${form.time}:00`)
      const endTime = new Date(startTime.getTime() + duration * 60000)

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: form.customer_id,
          pet_id: form.pet_id,
          staff_id: form.staff_id || null,
          service_ids: [form.service_id],
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: "confirmed",
          price: selectedService?.price || 0,
          is_paid: false,
          notes: form.notes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to create appointment")
      setFeedback({ type: "success", message: "Appointment created!" })
      setForm({ customer_id: "", pet_id: "", staff_id: "", service_id: "", date: "", time: "", notes: "" })
      await fetchData()
      setTimeout(() => setDialogOpen(false), 700)
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to create appointment",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Build 7-day calendar strip
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - 3 + i)
    return { day: DAY_NAMES[d.getDay()], date: d.getDate(), iso: d.toISOString().slice(0, 10), offset: i - 3 }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all grooming bookings</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient" size="sm">
              <Plus className="h-4 w-4 mr-2" />New Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New Appointment</DialogTitle>
              <DialogDescription>Schedule a grooming appointment.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div>
                <label className="text-sm font-semibold">Customer *</label>
                <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v, pet_id: "" })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold">Pet *</label>
                <Select value={form.pet_id} onValueChange={(v) => setForm({ ...form, pet_id: v })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder={form.customer_id ? "Select pet" : "Select customer first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {customerPets.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} {p.breed ? `(${p.breed})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold">Service *</label>
                <Select value={form.service_id} onValueChange={(v) => setForm({ ...form, service_id: v })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} — ${(s.price / 100).toFixed(0)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold">Groomer</label>
                <Select value={form.staff_id} onValueChange={(v) => setForm({ ...form, staff_id: v })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Any groomer" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">Date *</label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="mt-1.5" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Time *</label>
                  <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required className="mt-1.5" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold">Notes</label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Special requests..." className="mt-1.5" />
              </div>
              {feedback && (
                <div className={`rounded-lg px-3 py-2 text-sm ${feedback.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  {feedback.message}
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Schedule
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar Strip */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setOffset((o) => o - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-2">
              {days.map((d) => (
                <button
                  key={d.iso}
                  onClick={() => setOffset(d.offset)}
                  className={`flex flex-col items-center rounded-xl px-4 py-2.5 transition-all min-w-[64px] ${
                    d.offset === offset
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-muted"
                  }`}
                >
                  <span className="text-xs font-medium">{d.day}</span>
                  <span className="text-lg font-bold">{d.date}</span>
                </button>
              ))}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOffset((o) => o + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {displayDate} · {filteredApps.length} appointments
          </h2>
          <div className="flex gap-2">
            {["All", "Confirmed", "In Progress", "Pending"].map((f) => (
              <Badge
                key={f}
                variant={f === filter ? "default" : "secondary"}
                className="cursor-pointer text-xs"
                onClick={() => setFilter(f)}
              >
                {f}
              </Badge>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <CalendarIcon />
            <p className="text-sm mt-2">No appointments on {displayDate}</p>
          </div>
        ) : (
          filteredApps.map((apt) => {
            const status = statusMap[apt.status] || { label: apt.status, variant: "secondary" as const }
            const startTime = new Date(apt.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            const endTime = new Date(apt.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            return (
              <Card key={apt.id} className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <p className="text-lg font-bold">{startTime}</p>
                        <p className="text-xs text-muted-foreground">{endTime}</p>
                      </div>
                      <div className="w-px h-10 bg-border" />
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                          {apt.pet?.name?.[0] || "?"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{apt.pet?.name || "Unknown"}</p>
                            <span className="text-xs text-muted-foreground">{apt.pet?.breed}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Scissors className="h-3 w-3" />
                              {apt.price ? `$${(apt.price / 100).toFixed(0)}` : "—"}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {apt.customer?.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <PawPrint className="h-3 w-3" />
                              {apt.staff?.name || "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg className="h-10 w-10 mx-auto mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  )
}
