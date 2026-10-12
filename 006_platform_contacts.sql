-- =====================================================================
-- Migration: platform support contacts
-- Adds public support channels to platform_settings so the trial wall
-- and paywalls can show contact info when a payment has a problem.
--
-- Also allows any authenticated user to READ platform_settings. This is
-- safe now that the KHQR.dev credentials live in Edge Function secrets
-- (KHQRDEV_TOKEN / KHQRDEV_WEBHOOK_SECRET) and are no longer stored here.
-- Writes remain super-admin only via the existing policy.
-- =====================================================================

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS support_phone text,
  ADD COLUMN IF NOT EXISTS support_facebook text,
  ADD COLUMN IF NOT EXISTS support_telegram text;

-- Read-only access for logged-in users (they are the ones who see the paywall).
-- Permissive SELECT policies OR together, so super admins keep full access.
DROP POLICY IF EXISTS platform_settings_read_authenticated ON public.platform_settings;
CREATE POLICY platform_settings_read_authenticated ON public.platform_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Verify after running:
-- SELECT support_phone, support_facebook, support_telegram FROM platform_settings;
