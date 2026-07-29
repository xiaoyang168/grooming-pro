-- ============================================================
-- 004 — First-party analytics + operator admin support
-- ============================================================

-- ── Page views (first-party traffic analytics) ──────────────
CREATE TABLE IF NOT EXISTS page_views (
    id BIGSERIAL PRIMARY KEY,
    path TEXT NOT NULL,
    referrer TEXT,
    title TEXT,
    visitor_id TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor ON page_views(visitor_id);

-- RLS: deny all direct access. Writes happen via service_role (bypasses RLS),
-- reads only happen inside the protected /admin server component.
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
