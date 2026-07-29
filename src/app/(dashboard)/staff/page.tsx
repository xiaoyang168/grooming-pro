"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Plus, Users, Loader2, Pencil, Trash2, Phone, Mail } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface StaffMember {
  id: string; name: string; role: string;
  phone: string | null; email: string | null; is_active: boolean;
}

const ROLES = [
  { value: "groomer", label: "Groomer" },
  { value: "bather", label: "Bather" },
  { value: "receptionist", label: "Receptionist" },
  { value: "manager", label: "Manager" },
  { value: "assistant", label: "Assistant" },
]

const ROLE_LABEL: Record<string, string> = {
  groomer: "Groomer", bather: "Bather", receptionist: "Receptionist",
  manager: "Manager", assistant: "Assistant",
}

const emptyForm = { name: "", role: "groomer", phone: "", email: "" }

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(emptyForm)

  // Delete confirm
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchStaff() {
    try {
      const res = await fetch("/api/staff")
      const data = await res.json()
      if (data.data) setStaff(data.data)
    } catch { /* ignore */ }
  }

  useEffect(() => { setLoading(true); fetchStaff().finally(() => setLoading(false)) }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch("/api/staff", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, role: form.role,
          phone: form.phone || null, email: form.email || null,
        }),
      })
      if (!res.ok) throw new Error("Failed to add staff")
      setForm(emptyForm)
      await fetchStaff()
      setDialogOpen(false)
    } catch { /* ignore */ } finally { setSubmitting(false) }
  }

  function openEdit(s: StaffMember) {
    setEditingId(s.id)
    setForm({ name: s.name, role: s.role, phone: s.phone || "", email: s.email || "" })
    setEditOpen(true)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/staff/${editingId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, role: form.role,
          phone: form.phone || null, email: form.email || null,
        }),
      })
      if (!res.ok) throw new Error("Failed to update")
      setForm(emptyForm)
      setEditingId(null)
      setEditOpen(false)
      await fetchStaff()
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
      await fetch(`/api/staff/${deletingId}`, { method: "DELETE" })
      setStaff(staff.filter((s) => s.id !== deletingId))
      setDeleteOpen(false)
      setDeletingId(null)
    } catch { /* ignore */ } finally { setDeleting(false) }
  }

  const renderForm = (onSubmit: (e: React.FormEvent) => void, label: string) => (
    <form onSubmit={onSubmit} className="space-y-4 py-2">
      <div>
        <label className="text-sm font-semibold">Name *</label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Jane Smith" className="mt-1.5" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold">Role</label>
          <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>{ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-semibold">Phone</label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" className="mt-1.5" />
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold">Email</label>
        <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@salon.com" className="mt-1.5" />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditOpen(false) }}>Cancel</Button>
        <Button type="submit" variant="gradient" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{label}
        </Button>
      </DialogFooter>
    </form>
  )

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your team members and their roles</p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => { setForm(emptyForm); setDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />Add Staff
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Staff Member</DialogTitle><DialogDescription>Add a new team member to your salon.</DialogDescription></DialogHeader>
          {renderForm(handleSubmit, "Add Staff")}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Staff Member</DialogTitle><DialogDescription>Update team member details.</DialogDescription></DialogHeader>
          {renderForm(handleEdit, "Save Changes")}
        </DialogContent>
      </Dialog>

      {staff.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">No staff members yet</p>
          <p className="text-xs mt-1">Add your first team member to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((s) => (
            <Card key={s.id} className="card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{s.name}</h3>
                      <Badge variant="secondary" className="text-xs mt-0.5">{ROLE_LABEL[s.role] || s.role}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(s.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 pt-3 border-t">
                  {s.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />{s.phone}
                    </p>
                  )}
                  {s.email && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3 w-3" />{s.email}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Remove this staff member?"
        description="They will be marked as inactive and won't appear in appointment assignments. This action cannot be undone."
        confirmText="Remove"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
