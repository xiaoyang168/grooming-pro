"use client"

import { useState, useEffect } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Plus, PawPrint, Cake, AlertTriangle, Heart, Edit, Trash2, Loader2, Syringe, ShieldCheck, Calendar, X } from "lucide-react"
import type { Pet, Customer, Vaccination } from "@/types"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface PetWithOwner extends Pet {
  customer?: { id: string; name: string }
}

const emptyForm = {
  name: "",
  customer_id: "",
  species: "dog" as "dog" | "cat" | "other",
  breed: "",
  gender: "male" as "male" | "female",
  age_years: "",
  weight_kg: "",
  color: "",
}

export default function PetsPage() {
  const [search, setSearch] = useState("")
  const [pets, setPets] = useState<PetWithOwner[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingPetId, setEditingPetId] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [form, setForm] = useState(emptyForm)

  // Vaccination state
  const [vaxDialogOpen, setVaxDialogOpen] = useState(false)
  const [vaxPetId, setVaxPetId] = useState<string | null>(null)
  const [vaxPetName, setVaxPetName] = useState("")
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [vaxLoading, setVaxLoading] = useState(false)
  const [vaxForm, setVaxForm] = useState({ vaccine_name: "", administered_date: "", expires_at: "", notes: "" })
  const [vaxSubmitting, setVaxSubmitting] = useState(false)

  // Delete confirm dialog state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchPets() {
    try {
      const res = await fetch("/api/pets")
      const data = await res.json()
      if (data.data) setPets(data.data)
    } catch (e) {
      console.error(e)
    }
  }

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
    Promise.all([fetchPets(), fetchCustomers()]).finally(() => setLoading(false))
  }, [])

  function openAdd() {
    setEditingPetId(null)
    setForm(emptyForm)
    setFeedback(null)
    setDialogOpen(true)
  }

  function openEdit(pet: PetWithOwner) {
    setEditingPetId(pet.id)
    setForm({
      name: pet.name,
      customer_id: pet.customer_id,
      species: pet.species,
      breed: pet.breed || "",
      gender: pet.gender,
      age_years: pet.age_years != null ? String(pet.age_years) : "",
      weight_kg: pet.weight_kg != null ? String(pet.weight_kg) : "",
      color: pet.color || "",
    })
    setFeedback(null)
    setEditDialogOpen(true)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    await savePet("POST", "/api/pets", dialogOpen, setDialogOpen)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingPetId) return
    await savePet("PATCH", `/api/pets/${editingPetId}`, editDialogOpen, setEditDialogOpen)
  }

  async function savePet(
    method: "POST" | "PATCH",
    url: string,
    _open: boolean,
    close: (v: boolean) => void
  ) {
    // Client-side validation: prevent empty customer_id from reaching the API
    if (!form.name.trim()) {
      setFeedback({ type: "error", message: "Pet name is required" })
      return
    }
    if (method === "POST" && !form.customer_id) {
      setFeedback({ type: "error", message: "Please select an owner" })
      return
    }
    setSubmitting(true)
    setFeedback(null)
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        species: form.species,
        breed: form.breed || null,
        gender: form.gender,
        age_years: form.age_years ? parseFloat(form.age_years) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        color: form.color || null,
      }
      // Only include customer_id when present (avoid sending empty string for PATCH)
      if (form.customer_id) payload.customer_id = form.customer_id
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to save pet")
      setFeedback({ type: "success", message: method === "POST" ? "Pet created!" : "Pet updated!" })
      await fetchPets()
      setTimeout(() => close(false), 700)
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to save pet",
      })
    } finally {
      setSubmitting(false)
    }
  }

  function handleDeletePet(petId: string) {
    setDeletingId(petId)
    setDeleteOpen(true)
  }

  async function confirmDeletePet() {
    if (!deletingId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/pets/${deletingId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete pet")
      setPets(pets.filter((p) => p.id !== deletingId))
      setDeleteOpen(false)
      setDeletingId(null)
    } catch {
      // ignore
    } finally {
      setDeleting(false)
    }
  }

  // ── Vaccination helpers ──────────────────────────────────────
  async function openVaccinations(pet: PetWithOwner) {
    setVaxPetId(pet.id)
    setVaxPetName(pet.name)
    setVaxDialogOpen(true)
    setVaxLoading(true)
    setVaxForm({ vaccine_name: "", administered_date: "", expires_at: "", notes: "" })
    try {
      const res = await fetch(`/api/pets/${pet.id}/vaccinations`)
      const data = await res.json()
      if (data.data) setVaccinations(data.data)
    } catch {
      setVaccinations([])
    } finally {
      setVaxLoading(false)
    }
  }

  async function addVaccination(e: React.FormEvent) {
    e.preventDefault()
    if (!vaxPetId) return
    if (!vaxForm.vaccine_name.trim() || !vaxForm.administered_date) return
    setVaxSubmitting(true)
    try {
      const res = await fetch(`/api/pets/${vaxPetId}/vaccinations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vaccine_name: vaxForm.vaccine_name.trim(),
          administered_date: vaxForm.administered_date,
          expires_at: vaxForm.expires_at || null,
          notes: vaxForm.notes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to add")
      setVaccinations([json.data, ...vaccinations])
      setVaxForm({ vaccine_name: "", administered_date: "", expires_at: "", notes: "" })
    } catch {
      // ignore
    } finally {
      setVaxSubmitting(false)
    }
  }

  async function deleteVaccination(vid: string) {
    if (!vaxPetId) return
    try {
      await fetch(`/api/pets/${vaxPetId}/vaccinations?vid=${vid}`, { method: "DELETE" })
      setVaccinations(vaccinations.filter((v) => v.id !== vid))
    } catch {
      // ignore
    }
  }

  function getVaxStatus(v: Vaccination): "valid" | "expiring" | "expired" | "no_expiry" {
    if (!v.expires_at) return "no_expiry"
    const now = new Date()
    const expiry = new Date(v.expires_at)
    const daysLeft = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysLeft < 0) return "expired"
    if (daysLeft <= 30) return "expiring"
    return "valid"
  }

  const filtered = pets.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.customer?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.breed || "").toLowerCase().includes(search.toLowerCase())
  )

  const customerPets = pets.filter((p) => p.customer_id === form.customer_id)

  const renderForm = (onSubmit: (e: React.FormEvent) => void, submitLabel: string) => (
    <form onSubmit={onSubmit} className="space-y-4 py-2">
      <div>
        <label className="text-sm font-semibold">Name *</label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          placeholder="Buddy"
          className="mt-1.5"
        />
      </div>
      <div>
        <label className="text-sm font-semibold">Owner *</label>
        <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="Select owner" />
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold">Species</label>
          <Select value={form.species} onValueChange={(v: "dog" | "cat" | "other") => setForm({ ...form, species: v })}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dog">Dog</SelectItem>
              <SelectItem value="cat">Cat</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-semibold">Gender</label>
          <Select value={form.gender} onValueChange={(v: "male" | "female") => setForm({ ...form, gender: v })}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold">Breed</label>
          <Input
            value={form.breed}
            onChange={(e) => setForm({ ...form, breed: e.target.value })}
            placeholder="Golden Retriever"
            className="mt-1.5"
          />
        </div>
        <div>
          <label className="text-sm font-semibold">Color</label>
          <Input
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            placeholder="Golden"
            className="mt-1.5"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold">Age (years)</label>
          <Input
            type="number"
            step="0.1"
            value={form.age_years}
            onChange={(e) => setForm({ ...form, age_years: e.target.value })}
            placeholder="3"
            className="mt-1.5"
          />
        </div>
        <div>
          <label className="text-sm font-semibold">Weight (kg)</label>
          <Input
            type="number"
            step="0.1"
            value={form.weight_kg}
            onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
            placeholder="25"
            className="mt-1.5"
          />
        </div>
      </div>
      {feedback && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            feedback.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </div>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => (editingPetId ? setEditDialogOpen(false) : setDialogOpen(false))}>
          Cancel
        </Button>
        <Button type="submit" variant="gradient" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )

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
          <h1 className="text-2xl font-bold tracking-tight">Pet Profiles</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage pet records and health notes</p>
        </div>
        <Button variant="gradient" size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />Add Pet
        </Button>
      </div>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Pet</DialogTitle>
            <DialogDescription>Fill in the pet details below.</DialogDescription>
          </DialogHeader>
          {renderForm(handleAdd, "Save Pet")}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pet</DialogTitle>
            <DialogDescription>Update pet details below.</DialogDescription>
          </DialogHeader>
          {renderForm(handleEdit, "Update Pet")}
        </DialogContent>
      </Dialog>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, breed, or owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <PawPrint className="h-10 w-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">{pets.length === 0 ? "No pets yet" : "No matches found"}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pet) => (
            <Card key={pet.id} className="card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">
                      {pet.name[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold">{pet.name}</h3>
                      <p className="text-xs text-muted-foreground">Owner: {pet.customer?.name || "—"}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openVaccinations(pet)} title="Vaccination records">
                      <Syringe className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(pet)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeletePet(pet.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant="default" className="text-xs">
                    <PawPrint className="h-3 w-3 mr-1" />
                    {pet.species}
                  </Badge>
                  {pet.breed && <Badge variant="secondary" className="text-xs">{pet.breed}</Badge>}
                  {pet.age_years != null && (
                    <Badge variant="secondary" className="text-xs">
                      <Cake className="h-3 w-3 mr-1" />
                      {pet.age_years} yr
                    </Badge>
                  )}
                  {pet.weight_kg != null && (
                    <Badge variant="secondary" className="text-xs">{pet.weight_kg} kg</Badge>
                  )}
                </div>

                {pet.allergies && pet.allergies.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 rounded-lg px-2.5 py-1.5 mb-2">
                    <AlertTriangle className="h-3 w-3" />
                    Allergies: {pet.allergies.join(", ")}
                  </div>
                )}

                {pet.medical_notes && (
                  <div className="flex items-start gap-1 text-xs text-muted-foreground bg-muted/50 rounded-lg px-2.5 py-1.5 mb-3">
                    <Heart className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>{pet.medical_notes}</span>
                  </div>
                )}

                {pet.gender && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    {pet.gender === "male" ? "♂" : "♀"} {pet.gender}
                    {pet.is_neutered ? " · Neutered" : ""}
                    {pet.color ? ` · ${pet.color}` : ""}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Vaccination Dialog */}
      <Dialog open={vaxDialogOpen} onOpenChange={setVaxDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Syringe className="h-4 w-4 text-primary" />
              {vaxPetName}'s Vaccinations
            </DialogTitle>
            <DialogDescription>Track vaccine records and expiry dates.</DialogDescription>
          </DialogHeader>

          {/* Add form */}
          <form onSubmit={addVaccination} className="space-y-3 border-b pb-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold">Vaccine name *</label>
                <Input
                  value={vaxForm.vaccine_name}
                  onChange={(e) => setVaxForm({ ...vaxForm, vaccine_name: e.target.value })}
                  placeholder="Rabies, DHPP..."
                  required
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Administered *</label>
                <Input
                  type="date"
                  value={vaxForm.administered_date}
                  onChange={(e) => setVaxForm({ ...vaxForm, administered_date: e.target.value })}
                  required
                  className="mt-1 h-9 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold">Expires (optional)</label>
                <Input
                  type="date"
                  value={vaxForm.expires_at}
                  onChange={(e) => setVaxForm({ ...vaxForm, expires_at: e.target.value })}
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Notes</label>
                <Input
                  value={vaxForm.notes}
                  onChange={(e) => setVaxForm({ ...vaxForm, notes: e.target.value })}
                  placeholder="Batch #, vet..."
                  className="mt-1 h-9 text-sm"
                />
              </div>
            </div>
            <Button type="submit" variant="gradient" size="sm" disabled={vaxSubmitting}>
              {vaxSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Add Record
            </Button>
          </form>

          {/* Records list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {vaxLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : vaccinations.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-20" />
                No vaccination records yet
              </div>
            ) : (
              vaccinations.map((v) => {
                const status = getVaxStatus(v)
                return (
                  <div key={v.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{v.vaccine_name}</p>
                        <Badge
                          variant={status === "expired" ? "destructive" : status === "expiring" ? "warning" : "secondary"}
                          className="text-[10px]"
                        >
                          {status === "expired" ? "Expired" : status === "expiring" ? "Expiring" : status === "valid" ? "Valid" : "No expiry"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {v.administered_date}
                        {v.expires_at && ` → expires ${v.expires_at}`}
                        {v.notes ? ` · ${v.notes}` : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteVaccination(v.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this pet?"
        description="This will permanently remove the pet profile. This action cannot be undone."
        confirmText="Delete"
        danger
        loading={deleting}
        onConfirm={confirmDeletePet}
      />
    </div>
  )
}
