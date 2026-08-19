-- National tasting kits do not require a tentative visit date.
ALTER TABLE public.tasting_requests
  ALTER COLUMN desired_date DROP NOT NULL;
