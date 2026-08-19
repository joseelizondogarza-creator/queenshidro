-- ============================================================
-- Queens Hidro - Comunidad Nosotros: imagenes y videos
-- ============================================================

CREATE TABLE public.nosotros_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_ref text NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  alt text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX nosotros_gallery_customer_order_idx
  ON public.nosotros_gallery (customer_ref, sort_order, created_at);

CREATE INDEX nosotros_gallery_public_order_idx
  ON public.nosotros_gallery (active, sort_order, created_at);

ALTER TABLE public.nosotros_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nosotros_gallery_anon_read"
  ON public.nosotros_gallery
  FOR SELECT
  TO anon
  USING (active = true);

CREATE POLICY "nosotros_gallery_authenticated_read"
  ON public.nosotros_gallery
  FOR SELECT
  TO authenticated
  USING (active = true OR EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
  ));

CREATE POLICY "nosotros_gallery_admin_insert"
  ON public.nosotros_gallery
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
  ));

CREATE POLICY "nosotros_gallery_admin_update"
  ON public.nosotros_gallery
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
  ));

CREATE POLICY "nosotros_gallery_admin_delete"
  ON public.nosotros_gallery
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
  ));

INSERT INTO public.site_content (section, key, value)
VALUES
  ('nosotros', 'nosotros_title', 'De la colmena <em class="accent--rasp">a tu fiesta</em>'),
  ('nosotros', 'nosotros_sub', 'Trabajamos con los mejores apicultores de la región.'),
  ('nosotros', 'nosotros_text', 'Queens Hidro es hidromiel artesanal con frutas reales —fresa, zarzamora, mango y manzana— y <strong>miel 100% mexicana</strong>. Trabajamos con los mejores apicultores de la región y cuidamos cada fermentación como ellos cuidan sus colmenas. <strong>Cada compra apoya a quienes mantienen vivas las abejas de nuestra tierra.</strong>')
ON CONFLICT (key) DO UPDATE SET
  section = EXCLUDED.section,
  value = EXCLUDED.value,
  updated_at = now();
