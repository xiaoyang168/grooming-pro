"use client"

import { useState } from "react"
import { PawPrint, Clock, Scissors, Sparkles } from "lucide-react"

const services = [
  { name: "Full Groom", price: "$85", duration: "90 min", desc: "Bath, haircut, nails & ear cleaning" },
  { name: "Bath & Brush", price: "$45", duration: "45 min", desc: "Bath, blow-dry & brushing" },
  { name: "Nail Trim", price: "$15", duration: "20 min", desc: "Nail trim & filing" },
  { name: "Spa Package", price: "$120", duration: "60 min", desc: "Premium shampoo, coat care & paw massage" },
]

const timeSlots = ["09:00", "10:30", "11:00", "13:00", "14:30", "16:00"]

export default function BookingPage({ params }: { params: { shopId: string } }) {
  const [selectedPet, setSelectedPet] = useState("buddy")
  const [selectedService, setSelectedService] = useState(0)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [notes, setNotes] = useState("")

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 h-[200px] w-[200px] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-[180px] w-[180px] rounded-full bg-amber-300/8 blur-3xl" />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-primary/10 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-amber-500 shadow-md shadow-primary/20">
            <PawPrint className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg">Happy Paws Grooming</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> 09:00 - 18:00
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 space-y-5">
        {/* Step 1: Select Pet */}
        <section className="rounded-2xl bg-white/90 backdrop-blur p-5 shadow-sm border">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-sm font-extrabold text-primary">1</span>
            Select Pet
          </h2>
          <div className="space-y-3">
            {[
              { id: "buddy", name: "Buddy", breed: "Golden Retriever · 70 lb", emoji: "🐕" },
              { id: "luna", name: "Luna", breed: "Persian · 10 lb", emoji: "🐱" },
            ].map((pet) => (
              <label
                key={pet.id}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                  selectedPet === pet.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <input
                  type="radio"
                  name="pet"
                  className="h-4 w-4 accent-primary"
                  checked={selectedPet === pet.id}
                  onChange={() => setSelectedPet(pet.id)}
                />
                <span className="text-2xl">{pet.emoji}</span>
                <div>
                  <p className="font-semibold">{pet.name}</p>
                  <p className="text-xs text-muted-foreground">{pet.breed}</p>
                </div>
              </label>
            ))}
          </div>
          <button className="mt-3 text-sm font-semibold text-primary hover:underline">
            + Add New Pet
          </button>
        </section>

        {/* Step 2: Select Service */}
        <section className="rounded-2xl bg-white/90 backdrop-blur p-5 shadow-sm border">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-sm font-extrabold text-amber-600">2</span>
            Select Service
          </h2>
          <div className="space-y-2">
            {services.map((svc, i) => (
              <label
                key={i}
                className={`flex items-center justify-between rounded-xl border-2 p-4 cursor-pointer transition-all ${
                  selectedService === i
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="service"
                    className="h-4 w-4 accent-primary"
                    checked={selectedService === i}
                    onChange={() => setSelectedService(i)}
                  />
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-amber-400/20">
                    <Scissors className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{svc.name}</p>
                    <p className="text-xs text-muted-foreground">{svc.duration} · {svc.desc}</p>
                  </div>
                </div>
                <span className="text-lg font-extrabold text-primary">{svc.price}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Step 3: Select Time */}
        <section className="rounded-2xl bg-white/90 backdrop-blur p-5 shadow-sm border">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-sm font-extrabold text-blue-600">3</span>
            Select Time
          </h2>
          <input
            type="date"
            className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            defaultValue="2026-07-10"
          />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {timeSlots.map((time) => (
              <button
                key={time}
                className={`rounded-xl border-2 py-3 text-sm font-semibold transition-all ${
                  selectedTime === time
                    ? "border-primary bg-primary text-white shadow-md"
                    : "border-border hover:border-primary/50 hover:text-primary"
                }`}
                onClick={() => setSelectedTime(time)}
              >
                {time}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" />
            AI recommends: 10:30 AM tends to be less busy
          </p>
        </section>

        {/* Step 4: Notes */}
        <section className="rounded-2xl bg-white/90 backdrop-blur p-5 shadow-sm border">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-sm font-extrabold text-emerald-600">4</span>
            Special Requests
          </h2>
          <textarea
            className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow resize-none"
            rows={3}
            placeholder="Allergies, special requests, notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </section>

        {/* Confirm */}
        <button className="w-full rounded-2xl bg-gradient-to-r from-primary to-amber-500 py-4 text-lg font-extrabold text-white shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-[0.98]">
          Confirm Booking — {services[selectedService].price}
        </button>

        <p className="text-center text-xs text-muted-foreground pb-8">
          You will only be charged upon confirmation · Cancel anytime
        </p>
      </main>
    </div>
  )
}
