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
import { Plus, Package, Loader2, Trash2, Pencil, AlertTriangle } from "lucide-react"

interface InventoryItem {
  id: string; name: string; sku: string | null; category: string;
  cost_cents: number; price_cents: number; stock_quantity: number;
  low_stock_threshold: number; description: string | null; is_active: boolean;
}

const CATEGORIES = [
  { value: "shampoo", label: "Shampoo" },
  { value: "brush", label: "Brush" },
  { value: "collar", label: "Collar" },
  { value: "treat", label: "Treat" },
  { value: "toy", label: "Toy" },
  { value: "other", label: "Other" },
]

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: "", category: "other", sku: "", price: "", cost: "", stock: "", threshold: "5", description: "" })

  async function fetchItems() {
    try {
      const res = await fetch("/api/inventory")
      const data = await res.json()
      if (data.data) setItems(data.data)
    } catch { /* ignore */ }
  }

  useEffect(() => { setLoading(true); fetchItems().finally(() => setLoading(false)) }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch("/api/inventory", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, category: form.category, sku: form.sku || null,
          price_cents: Math.round(parseFloat(form.price) * 100),
          cost_cents: form.cost ? Math.round(parseFloat(form.cost) * 100) : 0,
          stock_quantity: form.stock ? parseInt(form.stock) : 0,
          low_stock_threshold: parseInt(form.threshold) || 5,
          description: form.description || null, is_active: true,
        }),
      })
      if (!res.ok) throw new Error("Failed to add item")
      setForm({ name: "", category: "other", sku: "", price: "", cost: "", stock: "", threshold: "5", description: "" })
      await fetchItems()
      setDialogOpen(false)
    } catch { /* ignore */ } finally { setSubmitting(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this item?")) return
    try {
      await fetch(`/api/inventory/${id}`, { method: "DELETE" })
      setItems(items.filter((i) => i.id !== id))
    } catch { /* ignore */ }
  }

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage retail products and stock levels</p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Add Item
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle><DialogDescription>Add a retail product to your inventory.</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div><label className="text-sm font-semibold">Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Oatmeal Shampoo" className="mt-1.5" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="text-sm font-semibold">Category</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-semibold">SKU</label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SH-001" className="mt-1.5" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="text-sm font-semibold">Price ($)</label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required placeholder="15.99" className="mt-1.5" /></div>
              <div><label className="text-sm font-semibold">Cost ($)</label><Input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="8.50" className="mt-1.5" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="text-sm font-semibold">Stock Quantity</label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="20" className="mt-1.5" /></div>
              <div><label className="text-sm font-semibold">Low Stock Alert</label><Input type="number" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} placeholder="5" className="mt-1.5" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" variant="gradient" disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Save Item</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {items.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">No inventory items yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const lowStock = item.stock_quantity <= item.low_stock_threshold
            return (
              <Card key={item.id} className="card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Package className="h-5 w-5 text-primary" /></div>
                      <div><h3 className="font-semibold text-sm">{item.name}</h3><p className="text-xs text-muted-foreground capitalize">{item.category}{item.sku ? ` · ${item.sku}` : ""}</p></div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div><p className="text-lg font-bold text-primary">{fmt(item.price_cents)}</p>{item.cost_cents > 0 && <p className="text-xs text-muted-foreground">Cost: {fmt(item.cost_cents)}</p>}</div>
                    <Badge variant={lowStock ? "destructive" : "secondary"} className="text-xs">
                      {lowStock && <AlertTriangle className="h-3 w-3 mr-1" />}{item.stock_quantity} in stock
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
