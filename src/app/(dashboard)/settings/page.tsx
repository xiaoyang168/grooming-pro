"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Store, Clock, Scissors, CreditCard, Plus, Pencil, Sparkles, Loader2, Share2, Copy, X, CheckCircle, Users, Trash2 } from "lucide-react"
import QRCode from "qrcode"
import type { Service } from "@/types"

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

interface ShopData {
  name: string
  slug: string
  phone: string
  email: string
  address: string
  business_hours?: Record<string, { open: string; close: string } | null>
  subscription_tier?: string
  subscription_status?: string
}

export default function SettingsPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [shop, setShop] = useState<ShopData | null>(null)
  const [shopForm, setShopForm] = useState({ name: "", phone: "", email: "", address: "" })
  const [hours, setHours] = useState<Record<string, { open: string; close: string } | null>>({})

  const [saveLoading, setSaveLoading] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [serviceDialogOpen, setServiceDialogOpen] = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const [serviceSubmitting, setServiceSubmitting] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [serviceForm, setServiceForm] = useState({
    name: "",
    category: "bath",
    duration_minutes: "",
    price: "",
    description: "",
  })

  // Staff state
  const [staffList, setStaffList] = useState<{ id: string; name: string; role: string; phone: string | null; email: string | null; is_active: boolean }[]>([])
  const [staffDialogOpen, setStaffDialogOpen] = useState(false)
  const [staffForm, setStaffForm] = useState({ name: "", role: "groomer", phone: "", email: "" })

  // Service edit state
  const [editServiceOpen, setEditServiceOpen] = useState(false)
  const [editServiceForm, setEditServiceForm] = useState({ id: "", name: "", duration_minutes: "", price: "", description: "" })

  async function handleUpgrade(plan: "pro" | "business") {
    setUpgradeLoading(true)
    try {
      const res = await fetch("/api/creem/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const json = await res.json()
      // Debug: log checkout response to see what productId is being used
      console.log("[upgrade] plan:", plan, "| response:", json)
      if (!res.ok) throw new Error(json.error || "Checkout failed")
      if (json.url) window.location.href = json.url
    } catch (err: unknown) {
      setSaveMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Checkout failed — Creem keys may not be configured",
      })
      setUpgradeLoading(false)
    }
  }

  async function handleManageSubscription() {
    setPortalLoading(true)
    try {
      const res = await fetch("/api/creem/portal", { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to open portal")
      if (json.url) window.location.href = json.url
    } catch (err: unknown) {
      setSaveMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to open Creem portal",
      })
      setPortalLoading(false)
    }
  }

  async function openShare() {
    const url = shop?.slug ? `https://petsalonos.com/booking/${shop.slug}` : ""
    if (!url) return
    try {
      const dataUrl = await QRCode.toDataURL(url, { width: 240, margin: 1, color: { dark: "#6366f1", light: "#ffffff" } })
      setQrDataUrl(dataUrl)
    } catch { setQrDataUrl("") }
    setShowShare(true)
  }

  async function copyBookingLink() {
    const url = shop?.slug ? `https://petsalonos.com/booking/${shop.slug}` : ""
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const bookingLink = shop?.slug ? `https://petsalonos.com/booking/${shop.slug}` : ""

  async function fetchData() {
    try {
      const [svcRes, shopRes, staffRes] = await Promise.all([
        fetch("/api/services").then((r) => r.json()),
        fetch("/api/shop").then((r) => r.json()),
        fetch("/api/staff").then((r) => r.json()),
      ])
      if (svcRes.data) setServices(svcRes.data)
      if (staffRes.data) setStaffList(staffRes.data)
      if (shopRes.data) {
        setShop(shopRes.data)
        setShopForm({
          name: shopRes.data.name || "",
          phone: shopRes.data.phone || "",
          email: shopRes.data.email || "",
          address: shopRes.data.address || "",
        })
        const savedHours = shopRes.data.business_hours || {}
        const defaultHours: Record<string, { open: string; close: string } | null> = {}
        DAYS.forEach((day, i) => {
          defaultHours[day] = savedHours[day] || (i === 6 ? null : { open: "09:00", close: "18:00" })
        })
        setHours(defaultHours)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function saveShopInfo(e: React.FormEvent) {
    e.preventDefault()
    setSaveLoading(true)
    setSaveMsg(null)
    try {
      const res = await fetch("/api/shop", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shopForm),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to save")
      setSaveMsg({ type: "success", text: "Shop info saved!" })
      if (json.data) setShop(json.data)
    } catch (err: unknown) {
      setSaveMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to save" })
    } finally {
      setSaveLoading(false)
    }
  }

  async function saveHours(e: React.FormEvent) {
    e.preventDefault()
    setSaveLoading(true)
    setSaveMsg(null)
    try {
      const res = await fetch("/api/shop/hours", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hours),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to save hours")
      setSaveMsg({ type: "success", text: "Business hours saved!" })
    } catch (err: unknown) {
      setSaveMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to save hours" })
    } finally {
      setSaveLoading(false)
    }
  }

  async function addService(e: React.FormEvent) {
    e.preventDefault()
    setServiceSubmitting(true)
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: serviceForm.name,
          category: serviceForm.category,
          duration_minutes: parseInt(serviceForm.duration_minutes, 10),
          price: Math.round(parseFloat(serviceForm.price) * 100),
          description: serviceForm.description || null,
          is_active: true,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to add service")
      setServiceForm({ name: "", category: "bath", duration_minutes: "", price: "", description: "" })
      await fetchData()
      setServiceDialogOpen(false)
    } catch (err: unknown) {
      setSaveMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to add service" })
    } finally {
      setServiceSubmitting(false)
    }
  }

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`
  const formatDuration = (mins: number) => (mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} min`)

  async function addStaff(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffForm),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to add staff")
      setStaffForm({ name: "", role: "groomer", phone: "", email: "" })
      await fetchData()
      setStaffDialogOpen(false)
    } catch (err: unknown) {
      setSaveMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to add staff" })
    }
  }

  async function removeStaff(id: string) {
    try {
      const res = await fetch(`/api/staff/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to remove staff")
      setStaffList(staffList.filter((s) => s.id !== id))
    } catch (err: unknown) {
      setSaveMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to remove staff" })
    }
  }

  function openEditService(svc: Service) {
    setEditServiceForm({
      id: svc.id,
      name: svc.name,
      duration_minutes: String(svc.duration_minutes),
      price: String(svc.price / 100),
      description: svc.description || "",
    })
    setEditServiceOpen(true)
  }

  async function handleEditService(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch(`/api/services/${editServiceForm.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editServiceForm.name,
          duration_minutes: parseInt(editServiceForm.duration_minutes, 10),
          price: Math.round(parseFloat(editServiceForm.price) * 100),
          description: editServiceForm.description || null,
        }),
      })
      if (!res.ok) throw new Error("Failed to update service")
      await fetchData()
      setEditServiceOpen(false)
    } catch { /* ignore */ }
  }

  async function handleDeleteService(id: string) {
    if (!confirm("Delete this service? Existing appointments will keep the record.")) return
    try {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete service")
      setServices(services.filter((s) => s.id !== id))
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Shop Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage shop info, business hours, and services</p>
      </div>

      {saveMsg && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            saveMsg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {saveMsg.text}
        </div>
      )}

      {/* Shop Info */}
      <form onSubmit={saveShopInfo}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Store className="h-4 w-4 text-primary" />
              </div>
              <CardTitle>Shop Info</CardTitle>
            </div>
            <CardDescription>Information visible to customers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold">Shop Name</label>
                <Input
                  value={shopForm.name}
                  onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Phone</label>
                <Input
                  value={shopForm.phone}
                  onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Email</label>
                <Input
                  type="email"
                  value={shopForm.email}
                  onChange={(e) => setShopForm({ ...shopForm, email: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Address</label>
                <Input
                  value={shopForm.address}
                  onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>
            <Button type="submit" variant="gradient" size="sm" disabled={saveLoading}>
              {saveLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </form>

      {/* Business Hours */}
      <form onSubmit={saveHours}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle>Business Hours</CardTitle>
            </div>
            <CardDescription>Set weekly business hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DAYS.map((day, i) => {
                const dayHours = hours[day]
                const closed = !dayHours
                return (
                  <div key={day} className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2">
                    <span className="w-14 text-sm font-semibold">{DAY_LABELS[i]}</span>
                    <Input
                      className="w-28 h-9 text-sm"
                      type="time"
                      value={dayHours?.open || ""}
                      disabled={closed}
                      onChange={(e) =>
                        setHours({
                          ...hours,
                          [day]: { open: e.target.value, close: dayHours?.close || "18:00" },
                        })
                      }
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input
                      className="w-28 h-9 text-sm"
                      type="time"
                      value={dayHours?.close || ""}
                      disabled={closed}
                      onChange={(e) =>
                        setHours({
                          ...hours,
                          [day]: { open: dayHours?.open || "09:00", close: e.target.value },
                        })
                      }
                    />
                    <Button
                      type="button"
                      variant={closed ? "outline" : "ghost"}
                      size="sm"
                      className="ml-auto text-xs"
                      onClick={() => setHours({ ...hours, [day]: closed ? { open: "09:00", close: "18:00" } : null })}
                    >
                      {closed ? "Closed" : "Open"}
                    </Button>
                  </div>
                )
              })}
            </div>
            <Button type="submit" variant="gradient" size="sm" className="mt-4" disabled={saveLoading}>
              {saveLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Hours
            </Button>
          </CardContent>
        </Card>
      </form>

      {/* Services */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                <Scissors className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <CardTitle>Services & Pricing</CardTitle>
                <CardDescription>Manage grooming services</CardDescription>
              </div>
            </div>
            <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient" size="sm">
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Service</DialogTitle>
                  <DialogDescription>Add a new grooming service.</DialogDescription>
                </DialogHeader>
                <form onSubmit={addService} className="space-y-4 py-2">
                  <div>
                    <label className="text-sm font-semibold">Name *</label>
                    <Input
                      value={serviceForm.name}
                      onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                      required
                      placeholder="Full Groom"
                      className="mt-1.5"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold">Category</label>
                      <Select
                        value={serviceForm.category}
                        onValueChange={(v) => setServiceForm({ ...serviceForm, category: v })}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["bath", "groom", "spa", "nail", "dental", "other"].map((c) => (
                            <SelectItem key={c} value={c}>
                              {c.charAt(0).toUpperCase() + c.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold">Duration (min) *</label>
                      <Input
                        type="number"
                        value={serviceForm.duration_minutes}
                        onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: e.target.value })}
                        required
                        placeholder="60"
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Price (USD) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={serviceForm.price}
                      onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                      required
                      placeholder="55.00"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Description</label>
                    <Input
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                      placeholder="Service description"
                      className="mt-1.5"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setServiceDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="gradient" disabled={serviceSubmitting}>
                      {serviceSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Add Service
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No services yet. Click "Add" to create your first service.
            </div>
          ) : (
            <div className="space-y-2">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-amber-400/20">
                      <Scissors className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{svc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(svc.duration_minutes)}
                        {svc.description ? ` · ${svc.description}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-primary">{formatPrice(svc.price)}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditService(svc)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteService(svc.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Service Dialog */}
      <Dialog open={editServiceOpen} onOpenChange={setEditServiceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>Update service details below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditService} className="space-y-4 py-2">
            <div>
              <label className="text-sm font-semibold">Name *</label>
              <Input value={editServiceForm.name} onChange={(e) => setEditServiceForm({ ...editServiceForm, name: e.target.value })} required className="mt-1.5" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold">Duration (minutes)</label>
                <Input type="number" value={editServiceForm.duration_minutes} onChange={(e) => setEditServiceForm({ ...editServiceForm, duration_minutes: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <label className="text-sm font-semibold">Price ($)</label>
                <Input type="number" step="0.01" value={editServiceForm.price} onChange={(e) => setEditServiceForm({ ...editServiceForm, price: e.target.value })} className="mt-1.5" />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold">Description</label>
              <Input value={editServiceForm.description} onChange={(e) => setEditServiceForm({ ...editServiceForm, description: e.target.value })} className="mt-1.5" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditServiceOpen(false)}>Cancel</Button>
              <Button type="submit" variant="gradient">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Staff Management */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle>Staff</CardTitle>
                <CardDescription>Manage your grooming team</CardDescription>
              </div>
            </div>
            <Dialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient" size="sm">
                  <Plus className="mr-1 h-4 w-4" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Staff Member</DialogTitle>
                  <DialogDescription>Add a groomer or receptionist</DialogDescription>
                </DialogHeader>
                <form onSubmit={addStaff} className="space-y-4 pt-2">
                  <Input
                    placeholder="Full name"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    required
                  />
                  <Select value={staffForm.role} onValueChange={(v) => setStaffForm({ ...staffForm, role: v })}>
                    <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="groomer">Groomer</SelectItem>
                      <SelectItem value="bather">Bather</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Phone (optional)"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  />
                  <Input
                    placeholder="Email (optional)"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  />
                  <DialogFooter>
                    <Button type="submit" variant="gradient">Save</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {staffList.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No staff yet. Click "Add" to add your first team member.
            </div>
          ) : (
            <div className="space-y-2">
              {staffList.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{member.role}{member.phone ? ` · ${member.phone}` : ""}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeStaff(member.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <CreditCard className="h-4 w-4 text-emerald-600" />
            </div>
            <CardTitle>Subscription</CardTitle>
          </div>
          <CardDescription>Your current plan & billing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-xl border bg-gradient-to-r from-primary/5 to-amber-400/5 p-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-lg">
                  {shop?.subscription_tier === "pro" ? "Pro Plan" :
                   shop?.subscription_tier === "business" ? "Business Plan" :
                   "Free Trial"}
                </p>
                <Badge
                  variant={shop?.subscription_status === "active" ? "success" : "secondary"}
                  className="text-xs"
                >
                  {shop?.subscription_status === "active" ? "Active" :
                   shop?.subscription_status === "canceled" ? "Canceled" :
                   "14 days left"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {shop?.subscription_tier === "pro" ? "Up to 200 pets · AI scheduling · Email reminders" :
                 shop?.subscription_tier === "business" ? "Unlimited pets · Advanced AI · Priority support" :
                 "Up to 50 pets · Basic features"}
              </p>
            </div>
            {shop?.subscription_status === "active" ? (
              <Button variant="outline" onClick={handleManageSubscription} disabled={portalLoading}>
                {portalLoading ? "Opening..." : "Manage in Creem"}
              </Button>
            ) : (
              <Button variant="gradient" onClick={() => handleUpgrade("pro")} disabled={upgradeLoading}>
                {upgradeLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
                {upgradeLoading ? "Redirecting..." : "Upgrade to Pro"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Share Booking Link */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
              <Share2 className="h-4 w-4 text-violet-600" />
            </div>
            <CardTitle>Booking Link</CardTitle>
          </div>
          <CardDescription>Share this link so customers can book online</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
              value={bookingLink}
              readOnly
            />
            <Button variant="outline" size="sm" onClick={copyBookingLink}>
              {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="ml-1.5">{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>
          <Button variant="outline" className="w-full" onClick={openShare}>
            <Share2 className="h-4 w-4 mr-2" /> Show QR Code
          </Button>
        </CardContent>
      </Card>

      {/* QR Modal */}
      {showShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowShare(false)}>
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Booking QR Code</h3>
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
              <p className="text-xs text-muted-foreground text-center">Print or share this QR code for customers to scan</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
