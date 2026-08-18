-- ============================================================
-- Queens Hidro — Correo del cliente en órdenes
-- ============================================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS email text;
