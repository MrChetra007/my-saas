-- =====================================================================
-- Migration: KHQR.dev automated payment flow
-- Builds on 002_khqr_billing.sql + 003_khqr_proof_flow.sql
-- Changes:
--   1. Update plan prices: Starter $15, Pro $25, no volume fee
--   2. Add khqrdev_token + khqrdev_webhook_secret to platform_settings
--   3. Add khqr_tran_id + khqrdev_md5 to subscription_invoices (for KHQR.dev)
--   4. Extend status to include 'expired' (KHQR.dev payment timeout)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Update plan prices (Starter $15, Pro $25, 0% volume fee)
-- ---------------------------------------------------------------------
UPDATE public.plans
SET monthly_fee = 15, transaction_fee_percent = 0, updated_at = now()
WHERE id = 'starter';

UPDATE public.plans
SET monthly_fee = 25, transaction_fee_percent = 0, updated_at = now()
WHERE id = 'pro';

-- ---------------------------------------------------------------------
-- 2. Add KHQR.dev credentials to platform_settings
--    khqrdev_token    — the store's permanent Bearer token (from KHQR.dev dashboard)
--    khqrdev_webhook_secret — the Webhook Secret for HMAC verification
-- Note: store these only here, never in the frontend bundle.
-- ---------------------------------------------------------------------
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS khqrdev_token text,
  ADD COLUMN IF NOT EXISTS khqrdev_webhook_secret text;

-- ---------------------------------------------------------------------
-- 3. Add KHQR.dev transaction tracking to subscription_invoices
--    khqrdev_md5     — the md5 returned by KHQR.dev generate_qr
--    khqrdev_tran_id — the tran_id from KHQR.dev (human-readable reference)
--    khqrdev_checkout_url — the full-page checkout URL from KHQR.dev
-- Note: khqr_md5 (existing col) was for Bakong library; khqrdev_md5 is for KHQR.dev API.
-- ---------------------------------------------------------------------
ALTER TABLE public.subscription_invoices
  ADD COLUMN IF NOT EXISTS khqrdev_md5 text,
  ADD COLUMN IF NOT EXISTS khqrdev_tran_id text,
  ADD COLUMN IF NOT EXISTS khqrdev_checkout_url text;

-- Extend status check to include 'expired' (KHQR.dev 10-min QR timeout)
ALTER TABLE public.subscription_invoices DROP CONSTRAINT IF EXISTS subscription_invoices_status_check;
ALTER TABLE public.subscription_invoices
  ADD CONSTRAINT subscription_invoices_status_check
  CHECK (status IN ('pending', 'pending_review', 'paid', 'rejected', 'void', 'expired'));

-- Index for fast webhook lookups by khqrdev_md5
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_khqrdev_md5
  ON public.subscription_invoices(khqrdev_md5)
  WHERE khqrdev_md5 IS NOT NULL;

-- ---------------------------------------------------------------------
-- 4. Force all restaurants to manual billing (KHQR.dev flow)
-- ---------------------------------------------------------------------
UPDATE public.restaurants SET billing_type = 'manual';

-- Verify after running:
-- SELECT id, monthly_fee, transaction_fee_percent FROM plans;
--   starter: 15, 0 | pro: 25, 0
-- SELECT khqrdev_token, khqrdev_webhook_secret FROM platform_settings;
--   NULL initially -- fill via Super Admin Settings
