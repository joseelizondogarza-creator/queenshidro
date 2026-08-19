-- No hace falta guardar el nombre del cliente para mostrar el slider publico.
ALTER TABLE public.nosotros_gallery
  DROP COLUMN IF EXISTS customer_name;
