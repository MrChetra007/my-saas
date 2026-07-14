-- =====================================================================
-- Migration: payment-proof + grace-period flow on top of 002_khqr_billing.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. subscription_invoices — add proof + review fields, extend status
-- ---------------------------------------------------------------------
ALTER TABLE public.subscription_invoices DROP CONSTRAINT subscription_invoices_status_check;
ALTER TABLE public.subscription_invoices
  ADD CONSTRAINT subscription_invoices_status_check
  CHECK (status IN ('pending', 'pending_review', 'paid', 'rejected', 'void'));

ALTER TABLE public.subscription_invoices
  ADD COLUMN proof_url text,
  ADD COLUMN submitted_at timestamptz,
  ADD COLUMN rejected_reason text,
  ADD COLUMN rejected_at timestamptz;

-- ---------------------------------------------------------------------
-- 2. restaurants — grace period, separate from the confirmed plan_expires_at.
--    plan_expires_at = last CONFIRMED paid-through date.
--    grace_period_ends_at = temporary allowance while a proof is under review.
--    Access is granted if now() < plan_expires_at OR now() < grace_period_ends_at.
-- ---------------------------------------------------------------------
ALTER TABLE public.restaurants
  ADD COLUMN grace_period_ends_at timestamptz;

-- ---------------------------------------------------------------------
-- 3. Storage bucket for proof screenshots (private).
--    Create the bucket itself via the Supabase dashboard/CLI:
--      supabase storage create payment-proofs --no-public
--    Then apply these RLS policies on storage.objects.
--    Path convention: {restaurant_id}/{invoice_id}/{filename}
-- ---------------------------------------------------------------------
CREATE POLICY "restaurant admins upload own payment proof"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND (storage.foldername(name))[1] = (
    SELECT restaurant_id::text FROM public.users WHERE id = auth.uid()
  )
);

CREATE POLICY "restaurant admins and super admins read payment proof"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-proofs'
  AND (
    (storage.foldername(name))[1] = (
      SELECT restaurant_id::text FROM public.users WHERE id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_super_admin)
  )
);

-- ---------------------------------------------------------------------
-- 4. Allow restaurant admins to read+update their OWN pending invoices
--    (they need to attach proof_url and flip pending -> pending_review).
--    Existing policy `invoices_restaurant_read_own` already covers SELECT.
-- ---------------------------------------------------------------------
CREATE POLICY invoices_restaurant_update_own_pending ON public.subscription_invoices
  FOR UPDATE
  USING (
    restaurant_id IN (SELECT restaurant_id FROM public.users WHERE id = auth.uid())
    AND status IN ('pending', 'rejected')
  )
  WITH CHECK (
    restaurant_id IN (SELECT restaurant_id FROM public.users WHERE id = auth.uid())
    AND status = 'pending_review'
  );

-- Note: in practice the edge function `submit-payment-proof` does this update
-- with the service role, so this policy is a fallback / defense-in-depth if
-- you ever let the client update directly. Keeping it narrow (only pending/
-- rejected -> pending_review) so a restaurant admin can't self-approve.
