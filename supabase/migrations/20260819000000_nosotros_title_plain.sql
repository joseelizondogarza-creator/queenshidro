-- El titulo de Nosotros se guarda como texto plano para no exponer etiquetas HTML.
UPDATE public.site_content
SET value = 'De la colmena a tu fiesta', updated_at = now()
WHERE key = 'nosotros_title';
