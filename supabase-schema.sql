-- ============================================================
-- GroomingPro — Supabase Database Schema
-- ============================================================

-- ── Enable UUID extension ────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Shops (Tenants) ──────────────────────────────────────────
CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    timezone TEXT DEFAULT 'America/New_York',
    business_hours JSONB DEFAULT '{}',
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'business')),
    subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled')),
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Staff ─────────────────────────────────────────────────────
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT DEFAULT 'groomer' CHECK (role IN ('groomer', 'bather', 'receptionist', 'manager', 'owner')),
    services UUID[] DEFAULT '{}',
    color TEXT DEFAULT '#6366f1',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Customers ─────────────────────────────────────────────────
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    total_visits INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0, -- cents
    last_visit TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Pets ──────────────────────────────────────────────────────
CREATE TABLE pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    species TEXT DEFAULT 'dog' CHECK (species IN ('dog', 'cat', 'other')),
    breed TEXT,
    gender TEXT CHECK (gender IN ('male', 'female')),
    is_neutered BOOLEAN DEFAULT false,
    age_years REAL,
    weight_kg REAL,
    color TEXT,
    allergies TEXT[] DEFAULT '{}',
    medical_notes TEXT,
    behavior_notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Services ──────────────────────────────────────────────────
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'groom' CHECK (category IN ('bath', 'groom', 'spa', 'nail', 'dental', 'other')),
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    price INTEGER NOT NULL DEFAULT 0, -- cents
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Appointments ──────────────────────────────────────────────
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    service_ids UUID[] NOT NULL DEFAULT '{}',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'in_progress', 'completed', 'canceled', 'no_show')),
    notes TEXT,
    price INTEGER DEFAULT 0,
    is_paid BOOLEAN DEFAULT false,
    created_by TEXT DEFAULT 'shop' CHECK (created_by IN ('shop', 'customer')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Auto-create shop for new users ───────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_slug TEXT;
BEGIN
    new_slug := 'shop-' || substr(md5(random()::text), 1, 8);

    WHILE EXISTS (SELECT 1 FROM public.shops WHERE slug = new_slug) LOOP
        new_slug := 'shop-' || substr(md5(random()::text), 1, 8);
    END LOOP;

    INSERT INTO public.shops (name, slug, owner_id)
    VALUES ('My Grooming Salon', new_slug, NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_shops_owner ON shops(owner_id);
CREATE INDEX idx_staff_shop ON staff(shop_id);
CREATE INDEX idx_customers_shop ON customers(shop_id);
CREATE INDEX idx_pets_customer ON pets(customer_id);
CREATE INDEX idx_pets_shop ON pets(shop_id);
CREATE INDEX idx_services_shop ON services(shop_id);
CREATE INDEX idx_appointments_shop ON appointments(shop_id);
CREATE INDEX idx_appointments_customer ON appointments(customer_id);
CREATE INDEX idx_appointments_start ON appointments(start_time);
CREATE INDEX idx_appointments_status ON appointments(status);

-- ── RLS Policies ──────────────────────────────────────────────
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Shops: owner can read/write
CREATE POLICY "Owner can manage shop" ON shops
    FOR ALL USING (owner_id = auth.uid());

-- Staff: shop members can read
CREATE POLICY "Shop members can view staff" ON staff
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM shops WHERE id = staff.shop_id AND owner_id = auth.uid())
    );

CREATE POLICY "Shop owner can manage staff" ON staff
    FOR ALL USING (
        EXISTS (SELECT 1 FROM shops WHERE id = staff.shop_id AND owner_id = auth.uid())
    );

-- Customers
CREATE POLICY "Shop can manage customers" ON customers
    FOR ALL USING (
        EXISTS (SELECT 1 FROM shops WHERE id = customers.shop_id AND owner_id = auth.uid())
    );

-- Pets
CREATE POLICY "Shop can manage pets" ON pets
    FOR ALL USING (
        EXISTS (SELECT 1 FROM shops WHERE id = pets.shop_id AND owner_id = auth.uid())
    );

-- Services
CREATE POLICY "Shop can manage services" ON services
    FOR ALL USING (
        EXISTS (SELECT 1 FROM shops WHERE id = services.shop_id AND owner_id = auth.uid())
    );

-- Appointments
CREATE POLICY "Shop can manage appointments" ON appointments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM shops WHERE id = appointments.shop_id AND owner_id = auth.uid())
    );
