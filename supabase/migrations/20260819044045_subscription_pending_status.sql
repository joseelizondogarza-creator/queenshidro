-- Allow subscriptions to remain pending while Mercado Pago confirms payment.
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'pending', 'cancelled', 'expired'));
