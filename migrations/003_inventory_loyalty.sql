-- =============================================
-- Migration 003: Inventory & Loyalty Programs
-- Run in Supabase SQL Editor
-- =============================================

-- 1. Inventory items (retail products sold by salon)
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT,
    category TEXT DEFAULT 'other' CHECK (category IN ('shampoo', 'brush', 'collar', 'treat', 'toy', 'other')),
    cost_cents INTEGER DEFAULT 0,
    price_cents INTEGER NOT NULL DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_shop ON inventory_items(shop_id);

-- 2. Inventory transactions (sales, restocks, adjustments)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('sale', 'restock', 'adjustment')),
    quantity_change INTEGER NOT NULL, -- negative for sale, positive for restock
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_tx_item ON inventory_transactions(item_id, created_at DESC);

-- 3. Loyalty/Package programs
CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    service_ids UUID[] NOT NULL DEFAULT '{}', -- array of services included
    total_visits INTEGER NOT NULL DEFAULT 1,
    price_cents INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_packages_shop ON packages(shop_id);

-- 4. Customer packages (tracks which customer bought which package, visits remaining)
CREATE TABLE IF NOT EXISTS customer_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,
    visits_remaining INTEGER NOT NULL,
    visits_used INTEGER DEFAULT 0,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_customer_packages_customer ON customer_packages(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_packages_active ON customer_packages(is_active) WHERE is_active = true;

-- 5. RLS policies
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop can manage inventory" ON inventory_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM shops WHERE id = inventory_items.shop_id AND owner_id = auth.uid())
    );

CREATE POLICY "Shop can manage inventory tx" ON inventory_transactions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM shops WHERE id = inventory_transactions.shop_id AND owner_id = auth.uid())
    );

CREATE POLICY "Shop can manage packages" ON packages
    FOR ALL USING (
        EXISTS (SELECT 1 FROM shops WHERE id = packages.shop_id AND owner_id = auth.uid())
    );

CREATE POLICY "Shop can manage customer packages" ON customer_packages
    FOR ALL USING (
        EXISTS (SELECT 1 FROM shops WHERE id = customer_packages.shop_id AND owner_id = auth.uid())
    );