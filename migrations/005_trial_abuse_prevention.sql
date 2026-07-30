-- Prevent repeated free trials from the same browser/device.
-- The device token is an opaque random cookie; only its SHA-256 hash is stored.
CREATE TABLE IF NOT EXISTS public.trial_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    device_hash TEXT NOT NULL UNIQUE,
    email_normalized TEXT NOT NULL,
    ip_hash TEXT,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trial_claims_email ON public.trial_claims(email_normalized);
CREATE INDEX IF NOT EXISTS idx_trial_claims_claimed_at ON public.trial_claims(claimed_at);

ALTER TABLE public.trial_claims ENABLE ROW LEVEL SECURITY;
-- No client access. Server-side service-role code performs the claim check/write.
REVOKE ALL ON public.trial_claims FROM anon, authenticated;

-- Do not grant trials implicitly to users created through OAuth/admin paths.
-- The server-side signup route explicitly grants the 14-day trial after the claim check.
ALTER TABLE public.shops ALTER COLUMN trial_ends_at DROP DEFAULT;
