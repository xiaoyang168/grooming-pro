"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Customer, Pet } from "@/types"
import {
  ArrowLeft, Phone, Mail, Calendar, PawPrint, Plus,
} from "lucide-react"

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddPet, setShowAddPet] = useState(false)
  const [newPet, setNewPet] = useState({ name: "", species: "", breed: "", age_years: 0 })

  useEffect(() => {
    loadCustomer()
  }, [id])

  async function loadCustomer() {
    try {
      const { data: c } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .single()
      if (c) setCustomer(c)

      const { data: p } = await supabase
        .from("pets")
        .select("*")
        .eq("customer_id", id)
        .order("name")
      if (p) setPets(p)
    } catch {
      // Supabase not configured — will show "Customer not found"
    } finally {
      setLoading(false)
    }
  }

  async function addPet() {
    if (!newPet.name || !newPet.species) return
    const { data, error } = await supabase
      .from("pets")
      .insert({
        customer_id: id,
        name: newPet.name,
        species: newPet.species,
        breed: newPet.breed || null,
        age_years: newPet.age_years || null,
      })
      .select()
      .single()
    if (!error && data) {
      setPets([...pets, data as Pet])
      setNewPet({ name: "", species: "", breed: "", age_years: 0 })
      setShowAddPet(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="h-48 rounded-xl bg-muted" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mx-auto mb-4">
          <PawPrint className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium">Customer not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
      </div>
    )
  }

  const petEmojis: Record<string, string> = {
    "dog": "🐕", "cat": "🐱", "rabbit": "🐰", "bird": "🐦",
    "hamster": "🐹", "doggo": "🐶", "kitty": "🐱",
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-amber-500 text-white text-lg shadow-md shadow-primary/20">
          {customer.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">
            Customer since {new Date(customer.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-strong">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Phone className="h-3.5 w-3.5 text-primary" />
              </div>
              Contact Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {customer.phone ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{customer.phone}</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No phone on file</p>
            )}
            {customer.email ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{customer.email}</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No email on file</p>
            )}
            <div className="flex gap-4 pt-2">
              <Badge variant="secondary" className="gap-1">
                <Calendar className="h-3 w-3" />
                {customer.total_visits || 0} visits
              </Badge>
              <Badge variant="secondary" className="gap-1 font-semibold">
                ${(customer.total_spent || 0).toFixed(0)} spent
              </Badge>
            </div>
          </CardContent>
        </Card>

        {customer.notes ? (
          <Card className="glass-strong">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{customer.notes}</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-strong border-dashed">
            <CardContent className="flex h-full items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">No notes yet</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pets */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
              <PawPrint className="h-3.5 w-3.5 text-amber-600" />
            </div>
            Pets ({pets.length})
          </h2>
          <Button variant="gradient" size="sm" onClick={() => setShowAddPet(!showAddPet)}>
            <Plus className="mr-1 h-4 w-4" />
            Add Pet
          </Button>
        </div>

        {showAddPet && (
          <Card className="mb-4 border-primary/30 bg-primary/5">
            <CardContent className="grid gap-3 pt-5 sm:grid-cols-2">
              <Input
                placeholder="Pet name"
                value={newPet.name}
                onChange={(e) => setNewPet({ ...newPet, name: e.target.value })}
              />
              <Input
                placeholder="Species (e.g. dog, cat)"
                value={newPet.species}
                onChange={(e) => setNewPet({ ...newPet, species: e.target.value })}
              />
              <Input
                placeholder="Breed (optional)"
                value={newPet.breed}
                onChange={(e) => setNewPet({ ...newPet, breed: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Age"
                value={newPet.age_years || ""}
                onChange={(e) => setNewPet({ ...newPet, age_years: Number(e.target.value) })}
              />
              <div className="flex gap-2 sm:col-span-2">
                <Button variant="gradient" onClick={addPet} disabled={!newPet.name || !newPet.species}>
                  Save
                </Button>
                <Button variant="ghost" onClick={() => setShowAddPet(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pets.map((pet) => {
            const emoji = petEmojis[pet.species?.toLowerCase()] || "🐾"
            return (
              <Card key={pet.id} className="glass-strong hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-2xl shadow-sm">
                      {emoji}
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold">{pet.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {pet.species}{pet.breed ? ` · ${pet.breed}` : ""}
                      </p>
                    </div>
                  </div>
                  {pet.age_years != null && (
                    <Badge variant="secondary" className="mb-2">
                      {pet.age_years} {pet.age_years === 1 ? "year old" : "years old"}
                    </Badge>
                  )}
                  {pet.allergies && pet.allergies.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {pet.allergies.map((a: string) => (
                        <Badge key={a} variant="destructive" className="text-xs">
                          ⚠ {a}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {pet.medical_notes && (
                    <p className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                      📋 {pet.medical_notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
          {pets.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mx-auto mb-3">
                <PawPrint className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No pets yet</p>
              <p className="text-xs text-muted-foreground mt-1">Click "Add Pet" to add the first one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
