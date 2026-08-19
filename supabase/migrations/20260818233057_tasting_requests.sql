-- ============================================================
-- Queens Hidro — Solicitudes de degustación
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tasting_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type text NOT NULL CHECK (request_type IN ('local', 'nacional')),
  desired_date date NOT NULL,
  municipality text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  desired_volume text NOT NULL DEFAULT '',
  lead_type text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'nuevo' CHECK (status IN ('nuevo', 'en_revision', 'confirmado', 'atendido', 'descartado')),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  decision_notes text NOT NULL DEFAULT '',
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasting_requests_status_idx ON public.tasting_requests(status);
CREATE INDEX IF NOT EXISTS tasting_requests_date_idx ON public.tasting_requests(desired_date);
CREATE INDEX IF NOT EXISTS tasting_requests_created_idx ON public.tasting_requests(created_at DESC);

ALTER TABLE public.tasting_requests ENABLE ROW LEVEL SECURITY;

GRANT SELECT, UPDATE, DELETE ON public.tasting_requests TO authenticated;
GRANT ALL ON public.tasting_requests TO service_role;

DROP POLICY IF EXISTS "Admins can read tasting requests" ON public.tasting_requests;
CREATE POLICY "Admins can read tasting requests"
  ON public.tasting_requests FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins can update tasting requests" ON public.tasting_requests;
CREATE POLICY "Admins can update tasting requests"
  ON public.tasting_requests FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins can delete tasting requests" ON public.tasting_requests;
CREATE POLICY "Admins can delete tasting requests"
  ON public.tasting_requests FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

INSERT INTO public.site_content (section, key, value)
VALUES
  ('distribuye', 'dist_tag', 'Degustación Queens'),
  ('distribuye', 'dist_title', 'Prueba Queens en tu negocio'),
  ('distribuye', 'dist_sub', 'Primero probamos. Después platicamos sobre la mejor forma de trabajar juntos.'),
  ('distribuye', 'dist_text', 'Cuéntanos sobre tu negocio y lo que quieres construir. Nosotros te escuchamos, probamos juntos y vemos el siguiente paso.'),
  ('distribuye', 'dist_btn', 'Solicitar visita'),
  ('distribuye', 'dist_hint_bottle', 'Botella — cuéntanos qué formato imaginas para tu negocio.'),
  ('distribuye', 'dist_hint_barrel', 'Barril — cuéntanos cómo te gustaría servir Queens.'),
  ('distribuye', 'dist_feat1_title', 'Platicamos primero'),
  ('distribuye', 'dist_feat1_desc', 'Entendemos tu negocio antes de proponerte una forma de trabajar.'),
  ('distribuye', 'dist_feat2_title', 'Prueba sin presión'),
  ('distribuye', 'dist_feat2_desc', 'Conoce Queens y descubre qué experiencia hace sentido para tu comunidad.'),
  ('distribuye', 'dist_feat3_title', 'Impacto real'),
  ('distribuye', 'dist_feat3_desc', 'Cada conversación puede abrir una nueva forma de apoyar a los apicultores de Nuevo León.'),
  ('distribuye', 'dist_contact_title', 'Una conversación que empieza con una prueba'),
  ('distribuye', 'dist_contact_sub', 'Una conversación directa para entender tu negocio y encontrar la forma correcta de llevar Queens a tu comunidad.')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
