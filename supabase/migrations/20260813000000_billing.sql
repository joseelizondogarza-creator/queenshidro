-- ============================================================
-- Queens Hidro — Suscripciones recurrentes + transferencia bancaria
-- ============================================================

-- Órdenes: distinguir método de pago (mercadopago | transferencia)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'mercadopago';

UPDATE public.orders SET payment_method = 'mercadopago' WHERE payment_method IS NULL;

-- Suscripciones: cobro real
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS mp_preapproval_id text,
  ADD COLUMN IF NOT EXISTS mp_payment_id text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS last_charge_at timestamptz;

UPDATE public.subscriptions SET payment_status = 'pagado' WHERE status = 'active' AND payment_status = 'pendiente';

-- Datos de la cuenta bancaria para transferencia directa (editables en Admin > Contenido)
INSERT INTO public.site_content (section, key, value)
VALUES
  ('pago', 'transfer_bank',          'BBVA'),
  ('pago', 'transfer_holder',        'QUEENS HIDRO S. DE R.L.'),
  ('pago', 'transfer_clabe',         '012345678901234567'),
  ('pago', 'transfer_account',       '0123456789'),
  ('pago', 'transfer_instructions',  'Realiza la transferencia por el total exacto y envíanos tu comprobante para confirmar tu pedido.')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
