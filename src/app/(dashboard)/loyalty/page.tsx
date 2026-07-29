"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Plus, Gift, Loader2, Trash2 } from "lucide-react"

interface Pkg {
  id: string; name: string; description: string | null;
  total_visits: number; price_cents: number; is_active: boolean; created_at: string;
}

export default function LoyaltyPage() {
  const [packages, setPackages] = useState<Pkg[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", visits: "5", price: "" })

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchPackages() {
    try {
      const res = await fetch("/api/packages")
      const data = await res.json()
      if (data.data) setPackages(data.data)
    } catch { /* ignore */ }
  }

  useEffect(() => { setLoading(true); fetchPackages().finally(() => setLoading(false)) }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch("/api/packages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, description: form.description || null,
          total_visits: parseInt(form.visits), price_cents: Math.round(parseFloat(form.price) * 100),
          service_ids: [], is_active: true,
        }),
      })
      if (!res.ok) throw new Error("Failed to add package")
      setForm({ name: "", description: "", visits: "5", price: "" })
      await fetchPackages()
      setDialogOpen(false)
    } catch { /* ignore */ } finally { setSubmitting(false) }
  }

  function handleDelete(id: string) {
    setDeletingId(id)
    setDeleteOpen(true)
  }

  async function confirmDelete() {
    if (!deletingId) return
    setDeleting(true)
    try {
      await fetch(`/api/packages/${deletingId}`, { method: "DELETE" })
      setPackages(packages.filter((p) => p.id !== deletingId))
      setDeleteOpen(false)
      setDeletingId(null)
    } catch { /* ignore */ } finally { setDeleting(false) }
  }

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Loyalty & Packages</h1>
          <p className="text-sm text-muted-foreground mt-1">Create prepaid packages for repeat customers</p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Add Package
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Package</DialogTitle><DialogDescription>Create a prepaid package for customers.</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div><label className="text-sm font-semibold">Package Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="5-Visit Full Groom Package" className="mt-1.5" /></div>
            <div><label className="text-sm font-semibold">Description</label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Prepaid 5 full grooms, save 10%" className="mt-1.5" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="text-sm font-semibold">Total Visits *</label><Input type="number" value={form.visits} onChange={(e) => setForm({ ...form, visits: e.target.value })} required placeholder="5" className="mt-1.5" /></div>
              <div><label className="text-sm font-semibold">Price ($) *</label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required placeholder="250.00" className="mt-1.5" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" variant="gradient" disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Save Package</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {packages.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Gift className="h-10 w-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">No packages yet</p>
          <p className="text-xs mt-1">Create prepaid packages to boost customer retention</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100"><Gift className="h-5 w-5 text-amber-600" /></div>
                    <div><h3 className="font-semibold text-sm">{pkg.name}</h3>{pkg.description && <p className="text-xs text-muted-foreground">{pkg.description}</p>}</div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(pkg.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <p className="text-lg font-bold text-primary">{fmt(pkg.price_cents)}</p>
                  <Badge variant="secondary" className="text-xs">{pkg.total_visits} visits</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{fmt(pkg.price_cents / pkg.total_visits)} per visit</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this package?"
        description="Customers who purchased this package will keep their remaining visits. This action cannot be undone."
        confirmText="Delete"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
