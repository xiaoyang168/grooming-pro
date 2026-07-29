"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
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
import { Search, Plus, Phone, ChevronRight, PawPrint, CalendarCheck, Loader2, X, Pencil, Trash2 } from "lucide-react"
import type { Customer } from "@/types"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

export default function CustomersPage() {
  const [search, setSearch] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [form, setForm] = useState({ name: "", email: "", phone: "", tags: "" })
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", notes: "" })

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchCustomers() {
    try {
      const res = await fetch("/api/customers")
      const data = await res.json()
      if (data.data) setCustomers(data.data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    setLoading(true)
    fetchCustomers().finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFeedback(null)
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to create customer")
      setFeedback({ type: "success", message: "Customer created!" })
      setForm({ name: "", email: "", phone: "", tags: "" })
      await fetchCustomers()
      setTimeout(() => setDialogOpen(false), 700)
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to create customer",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase())
  )

  function openEdit(c: Customer) {
    setEditingId(c.id)
    setEditForm({ name: c.name, email: c.email || "", phone: c.phone || "", notes: c.notes || "" })
    setEditDialogOpen(true)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return
    try {
      const res = await fetch(`/api/customers/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email || null,
          phone: editForm.phone || null,
          notes: editForm.notes || null,
        }),
      })
      if (!res.ok) throw new Error("Failed to update customer")
      await fetchCustomers()
      setEditDialogOpen(false)
    } catch { /* ignore */ }
  }

  function handleDelete(id: string) {
    setDeletingId(id)
    setDeleteOpen(true)
  }

  async function confirmDelete() {
    if (!deletingId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/customers/${deletingId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete customer")
      setCustomers(customers.filter((c) => c.id !== deletingId))
      setDeleteOpen(false)
      setDeletingId(null)
    } catch { /* ignore */ } finally { setDeleting(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your customers and their pets</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient" size="sm">
              <Plus className="h-4 w-4 mr-2" />Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>Fill in the customer details below.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div>
                <label className="text-sm font-semibold">Name *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="John Doe"
                  className="mt-1.5"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">Email</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="john@example.com"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Phone</label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="212-555-0100"
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold">Tags (comma separated)</label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="vip, dog, new"
                  className="mt-1.5"
                />
              </div>
              {feedback && (
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    feedback.type === "success"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {feedback.message}
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Customer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customer Cards */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <UsersIcon />
          <p className="text-sm mt-2">{customers.length === 0 ? "No customers yet" : "No matches found"}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className="relative group">
              <Link href={`/customers/${c.id}`}>
                <Card className="card-hover h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                          {c.name[0]}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{c.name}</h3>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {c.phone || "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={c.total_visits > 20 ? "success" : c.total_visits < 10 ? "warning" : "default"}
                        className="text-xs"
                      >
                        {c.total_visits > 20 ? "Loyal" : c.total_visits < 10 ? "New" : "Active"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                      <div className="text-center">
                        <PawPrint className="h-4 w-4 mx-auto text-amber-500 mb-1" />
                        <p className="text-sm font-bold">—</p>
                        <p className="text-xs text-muted-foreground">Pets</p>
                      </div>
                      <div className="text-center">
                        <CalendarCheck className="h-4 w-4 mx-auto text-blue-500 mb-1" />
                        <p className="text-sm font-bold">{c.total_visits}</p>
                        <p className="text-xs text-muted-foreground">Visits</p>
                      </div>
                      <div className="text-center">
                        <ChevronRight className="h-4 w-4 mx-auto text-emerald-500 mb-1" />
                        <p className="text-sm font-bold">${(c.total_spent / 100).toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">Spent</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <div className="absolute top-3 right-3 flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7 bg-white/80 shadow-sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEdit(c) }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 bg-white/80 shadow-sm text-muted-foreground hover:text-destructive" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(c.id) }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer details below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 py-2">
            <div>
              <label className="text-sm font-semibold">Name *</label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required className="mt-1.5" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold">Email</label>
                <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <label className="text-sm font-semibold">Phone</label>
                <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="mt-1.5" />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold">Notes</label>
              <Input value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Special preferences, notes..." className="mt-1.5" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="gradient">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this customer?"
        description="All their pets and appointments will remain but be unlinked from this customer. This action cannot be undone."
        confirmText="Delete"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

function UsersIcon() {
  return (
    <svg className="h-10 w-10 mx-auto mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  )
}
