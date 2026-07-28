"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
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
import { Plus, ChevronLeft, ChevronRight, MoreHorizontal, Clock, User, PawPrint, Scissors, Loader2, Camera, ImageIcon, Check, X, DollarSign, FileText } from "lucide-react"
import { formatDateLocal } from "@/lib/format"
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
  const router = useRouter()
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
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null) // appointment id
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null) // open status dropdown for appointment id

  // Tip management state
  const [tipDialogOpen, setTipDialogOpen] = useState(false)
  const [completingApptId, setCompletingApptId] = useState<string | null>(null)
  const [completingApptPrice, setCompletingApptPrice] = useState(0) // service price in cents
  const [tipAmount, setTipAmount] = useState(0) // tip in cents
  const [tipCustom, setTipCustom] = useState("") // custom tip input in dollars

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
  const dateStr = formatDateLocal(selectedDate)
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

  // Close status dropdown on outside click
  useEffect(() => {
    if (!statusMenuId) return
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".status-dropdown")) setStatusMenuId(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [statusMenuId])

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
    setFeedback(null)

    // Client-side validation
    if (!form.customer_id) {
      setFeedback({ type: "error", message: "Please select a customer" })
      return
    }
    if (!form.pet_id) {
      setFeedback({ type: "error", message: "Please select a pet" })
      return
    }
    if (!form.service_id) {
      setFeedback({ type: "error", message: "Please select a service" })
      return
    }
    if (!form.date || !form.time) {
      setFeedback({ type: "error", message: "Please select date and time" })
      return
    }

    setSubmitting(true)
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

  async function handlePhotoUpload(apptId: string, photoType: "before" | "after", file: File) {
    setUploadingPhoto(apptId)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", photoType)

      const res = await fetch(`/api/appointments/${apptId}/photos`, {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || "Upload failed")
      }
      await fetchData() // refresh to show new photo
    } catch (err: unknown) {
      console.error("Photo upload failed:", err)
    } finally {
      setUploadingPhoto(null)
    }
  }

  async function handleStatusChange(apptId: string, newStatus: string) {
    setStatusMenuId(null)
    // When completing, open tip dialog first
    if (newStatus === "completed") {
      const appt = appointments.find((a) => a.id === apptId)
      setCompletingApptId(apptId)
      setCompletingApptPrice(appt?.price || 0)
      setTipAmount(0)
      setTipCustom("")
      setTipDialogOpen(true)
      return
    }
    try {
      await fetch(`/api/appointments/${apptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      await fetchData()
    } catch (err) {
      console.error("Status update failed:", err)
    }
  }

  async function completeWithTip() {
    if (!completingApptId) return
    try {
      await fetch(`/api/appointments/${completingApptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", tip_amount: tipAmount }),
      })
      setTipDialogOpen(false)
      setCompletingApptId(null)
      await fetchData()
    } catch (err) {
      console.error("Complete with tip failed:", err)
    }
  }

  // Quick tip buttons: calculate tip from service price
  function setTipPercent(percent: number) {
    setTipAmount(Math.round(completingApptPrice * percent / 100))
    setTipCustom("")
  }

  function setTipCustomAmount(dollars: string) {
    setTipCustom(dollars)
    const cents = Math.round(parseFloat(dollars) * 100)
    setTipAmount(isNaN(cents) ? 0 : cents)
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
                {form.customer_id && customerPets.length === 0 && (
                  <p className="text-xs text-red-600 mt-1.5">This customer has no pets. Add a pet in the Pets page first.</p>
                )}
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
                            {apt.tip_amount > 0 && (
                              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                <DollarSign className="h-3 w-3" />
                                +${(apt.tip_amount / 100).toFixed(0)} tip
                              </span>
                            )}
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
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setStatusMenuId(statusMenuId === apt.id ? null : apt.id)}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        {statusMenuId === apt.id && (
                          <div className="absolute right-0 top-full mt-1 w-36 rounded-lg border bg-white shadow-lg z-10 py-1 status-dropdown">
                            {apt.status === "completed" && (
                              <button
                                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                onClick={() => { setStatusMenuId(null); router.push(`/invoices/${apt.id}`) }}
                              >
                                <FileText className="h-3 w-3" /> View Invoice
                              </button>
                            )}
                            {apt.status !== "completed" && (
                              <button
                                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                                onClick={() => handleStatusChange(apt.id, "completed")}
                              >
                                <Check className="h-3 w-3" /> Mark Completed
                              </button>
                            )}
                            {apt.status !== "canceled" && (
                              <button
                                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-red-50 hover:text-red-700 transition-colors"
                                onClick={() => handleStatusChange(apt.id, "canceled")}
                              >
                                <X className="h-3 w-3" /> Cancel
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Photo section */}
                  {(apt.photo_before_url || apt.photo_after_url || apt.status !== "canceled") && (
                    <div className="mt-3 flex items-center gap-3 border-t pt-3">
                      {/* Before Photo */}
                      <div className="flex items-center gap-2">
                        <label className="relative group cursor-pointer">
                          {apt.photo_before_url ? (
                            <img
                              src={apt.photo_before_url}
                              alt="Before"
                              className="h-12 w-12 rounded-lg object-cover border"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 text-muted-foreground group-hover:border-primary/50 transition-colors">
                              {uploadingPhoto === apt.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Camera className="h-4 w-4" />
                              )}
                            </div>
                          )}
                          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap">
                            Before
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handlePhotoUpload(apt.id, "before", file)
                            }}
                            disabled={uploadingPhoto === apt.id}
                          />
                        </label>
                      </div>

                      {/* After Photo */}
                      <div className="flex items-center gap-2">
                        <label className="relative group cursor-pointer">
                          {apt.photo_after_url ? (
                            <img
                              src={apt.photo_after_url}
                              alt="After"
                              className="h-12 w-12 rounded-lg object-cover border"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 text-muted-foreground group-hover:border-primary/50 transition-colors">
                              {uploadingPhoto === apt.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <ImageIcon className="h-4 w-4" />
                              )}
                            </div>
                          )}
                          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap">
                            After
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handlePhotoUpload(apt.id, "after", file)
                            }}
                            disabled={uploadingPhoto === apt.id}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Tip Dialog — opens when marking appointment as completed */}
      <Dialog open={tipDialogOpen} onOpenChange={setTipDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Complete Appointment</DialogTitle>
            <DialogDescription>Add a tip for the groomer (optional).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-sm text-muted-foreground">
              Service: <span className="font-semibold text-foreground">${(completingApptPrice / 100).toFixed(0)}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Button variant="outline" size="sm" onClick={() => { setTipAmount(0); setTipCustom("") }}>
                No tip
              </Button>
              <Button variant="outline" size="sm" onClick={() => setTipPercent(10)}>
                10%
              </Button>
              <Button variant="outline" size="sm" onClick={() => setTipPercent(15)}>
                15%
              </Button>
              <Button variant="outline" size="sm" onClick={() => setTipPercent(20)}>
                20%
              </Button>
            </div>
            <div>
              <label className="text-sm font-semibold">Custom tip ($)</label>
              <Input
                type="number"
                step="0.01"
                value={tipCustom}
                onChange={(e) => setTipCustomAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1.5"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
              <span className="text-sm text-muted-foreground">Total (service + tip)</span>
              <span className="font-bold text-lg">
                ${((completingApptPrice + tipAmount) / 100).toFixed(2)}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setTipDialogOpen(false); setCompletingApptId(null) }}>
              Cancel
            </Button>
            <Button type="button" variant="gradient" onClick={completeWithTip}>
              <Check className="h-4 w-4 mr-1.5" />
              Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
