-- Las lecturas publicas y las operaciones administrativas no deben compartir
-- una politica permisiva para el mismo comando y rol.
DROP POLICY IF EXISTS "nosotros_gallery_public_read" ON public.nosotros_gallery;
DROP POLICY IF EXISTS "nosotros_gallery_admin_all" ON public.nosotros_gallery;

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
