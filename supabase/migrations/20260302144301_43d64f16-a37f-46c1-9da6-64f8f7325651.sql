-- Allow admins to read all white label settings
CREATE OR REPLACE FUNCTION public.get_all_white_label_settings()
RETURNS SETOF public.white_label_settings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.white_label_settings
  WHERE public.has_role(auth.uid(), 'admin')
$$;

-- Allow admins to read all profiles
CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles
  WHERE public.has_role(auth.uid(), 'admin')
$$;