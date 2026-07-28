"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, Printer, ArrowLeft } from "lucide-react"

interface InvoiceData {
  id: string
  start_time: string
  status: string
  price: number
  tip_amount: number
  is_paid: boolean
  notes: string | null
  customer: { name: string; phone: string | null; email: string | null }
  pet: { name: string; breed: string | null }
  staff: { name: string } | null
  shop: { name: string; phone: string | null; email: string | null; address: string | null }
}

export default function InvoicePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const res = await fetch(`/api/appointments/${params.id}`)
        const json = await res.json()
        if (json.data) setData(json.data)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchInvoice()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-muted-foreground">Invoice not found</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    )
  }

  const invoiceNo = data.id.slice(0, 8).toUpperCase()
  const serviceDate = new Date(data.start_time).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  })
  const subtotal = data.price / 100
  const tip = data.tip_amount / 100
  const total = subtotal + tip

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      {/* Action bar — hidden in print */}
      <div className="flex items-center justify-between mb-6 no-print">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Button variant="gradient" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Print / Save PDF
        </Button>
      </div>

      {/* Invoice paper */}
      <div className="bg-white rounded-2xl border shadow-sm p-8 sm:p-10 invoice-paper">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-primary">{data.shop.name}</h1>
            {data.shop.address && <p className="text-sm text-gray-500 mt-1">{data.shop.address}</p>}
            <p className="text-sm text-gray-500">
              {data.shop.phone && `${data.shop.phone}`}
              {data.shop.email && ` · ${data.shop.email}`}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-gray-900">INVOICE</h2>
            <p className="text-sm text-gray-500">#{invoiceNo}</p>
            <p className="text-sm text-gray-500">{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </div>

        {/* Bill to + Service info */}
        <div className="grid grid-cols-2 gap-6 py-6">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Bill To</p>
            <p className="font-semibold text-gray-900">{data.customer.name}</p>
            {data.customer.phone && <p className="text-sm text-gray-500">{data.customer.phone}</p>}
            {data.customer.email && <p className="text-sm text-gray-500">{data.customer.email}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Service Date</p>
            <p className="font-semibold text-gray-900">{serviceDate}</p>
            <p className="text-sm text-gray-500">Pet: {data.pet.name}{data.pet.breed ? ` (${data.pet.breed})` : ""}</p>
            {data.staff && <p className="text-sm text-gray-500">Groomer: {data.staff.name}</p>}
          </div>
        </div>

        {/* Line items */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-gray-400 uppercase">
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-3">
                <p className="font-medium">Grooming Service</p>
                {data.notes && <p className="text-xs text-gray-500">{data.notes}</p>}
              </td>
              <td className="py-3 text-right font-medium">${subtotal.toFixed(2)}</td>
            </tr>
            {tip > 0 && (
              <tr className="border-b">
                <td className="py-3 text-gray-600">Tip</td>
                <td className="py-3 text-right text-gray-600">${tip.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td className="py-3 font-bold text-lg">Total</td>
              <td className="py-3 text-right font-bold text-lg text-primary">${total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Payment status */}
        <div className="mt-6 flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${data.is_paid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {data.is_paid ? "PAID" : "PAYMENT DUE"}
          </span>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t pt-4 text-center">
          <p className="text-xs text-gray-400">Thank you for choosing {data.shop.name}!</p>
          <p className="text-xs text-gray-400 mt-1">Powered by GroomingPro — AI-powered pet grooming management</p>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .invoice-paper { border: none; box-shadow: none; border-radius: 0; }
        }
      `}</style>
    </div>
  )
}
