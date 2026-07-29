// ============================================================
// GroomingPro — Pet Grooming Salon Management SaaS
// Type definitions
// ============================================================

// ── Shop / Tenant ─────────────────────────────────────────────
export interface Shop {
  id: string
  name: string
  slug: string
  phone: string
  email: string
  address: string
  timezone: string
  businessHours: BusinessHours
  subscription_tier: 'free' | 'pro' | 'business'
  subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled'
  trial_ends_at: string | null
  created_at: string
}

export interface BusinessHours {
  monday: DayHours | null
  tuesday: DayHours | null
  wednesday: DayHours | null
  thursday: DayHours | null
  friday: DayHours | null
  saturday: DayHours | null
  sunday: DayHours | null
}

export interface DayHours {
  open: string  // "09:00"
  close: string // "18:00"
}

// ── Staff ─────────────────────────────────────────────────────
export interface Staff {
  id: string
  shop_id: string
  name: string
  email: string
  phone: string
  role: 'groomer' | 'bather' | 'receptionist' | 'manager' | 'owner'
  services: string[]  // service IDs
  color: string       // calendar color
  is_active: boolean
  created_at: string
}

// ── Customer ──────────────────────────────────────────────────
export interface Customer {
  id: string
  shop_id: string
  name: string
  email: string
  phone: string
  notes: string
  tags: string[]
  total_visits: number
  total_spent: number
  last_visit: string | null
  churn_risk: 'low' | 'medium' | 'high'
  created_at: string
}

// ── Pet ───────────────────────────────────────────────────────
export interface Pet {
  id: string
  customer_id: string
  shop_id: string
  name: string
  species: 'dog' | 'cat' | 'other'
  breed: string
  gender: 'male' | 'female'
  is_neutered: boolean
  age_years: number | null
  weight_kg: number | null
  color: string
  allergies: string[]
  medical_notes: string
  behavior_notes: string
  photo_url: string | null
  birthday: string | null
  created_at: string
}

// ── Vaccination ──────────────────────────────────────────────
export interface Vaccination {
  id: string
  pet_id: string
  shop_id: string
  vaccine_name: string
  administered_date: string
  expires_at: string | null
  notes: string | null
  created_at: string
}

// ── Service ───────────────────────────────────────────────────
export interface Service {
  id: string
  shop_id: string
  name: string
  category: 'bath' | 'groom' | 'spa' | 'nail' | 'dental' | 'other'
  duration_minutes: number
  price: number
  description: string
  is_active: boolean
  created_at: string
}

// ── Appointment ───────────────────────────────────────────────
export type AppointmentStatus =
  | 'pending'     // Pending confirmation
  | 'confirmed'   // Confirmed
  | 'checked_in'  // Checked in
  | 'in_progress' // In progress
  | 'completed'   // Completed
  | 'canceled'    // Canceled
  | 'no_show'     // No show

export interface Appointment {
  id: string
  shop_id: string
  customer_id: string
  pet_id: string
  staff_id: string
  service_ids: string[]
  start_time: string
  end_time: string
  status: AppointmentStatus
  notes: string
  price: number
  tip_amount: number
  is_paid: boolean
  created_by: 'shop' | 'customer'
  created_at: string
  reminder_sent_at: string | null
  photo_before_url: string | null
  photo_after_url: string | null
  payment_status: string | null
}

// ── Appointment (with joins) ──────────────────────────────────
export interface AppointmentWithDetails extends Appointment {
  customer: Pick<Customer, 'id' | 'name' | 'phone'>
  pet: Pick<Pet, 'id' | 'name' | 'breed' | 'photo_url'>
  staff: Pick<Staff, 'id' | 'name' | 'color'>
  services: Pick<Service, 'id' | 'name' | 'duration_minutes' | 'price'>[]
}

// ── AI ────────────────────────────────────────────────────────
export interface AiScheduleSuggestion {
  staff_id: string
  staff_name: string
  start_time: string
  end_time: string
  score: number
  reason: string
}

export interface ChurnAlert {
  customer_id: string
  customer_name: string
  last_visit: string
  days_since_last: number
  risk_level: 'low' | 'medium' | 'high'
  suggested_action: string
}

export interface AiQueryResult {
  answer: string
  chart_data?: {
    type: 'bar' | 'line' | 'pie'
    labels: string[]
    datasets: { label: string; data: number[] }[]
  }
}

// ── Common ────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  page_size: number
}

export interface ApiResponse<T> {
  data?: T
  error?: string
}
