
-- 1. Add columns to courses
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS num_days integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS client_id text;

-- 2. Add columns to course_enrollments
ALTER TABLE public.course_enrollments
  ADD COLUMN IF NOT EXISTS payment_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_emit_certificate boolean NOT NULL DEFAULT false;

-- 3. Create course_attendance table
CREATE TABLE IF NOT EXISTS public.course_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  student_email text NOT NULL,
  student_name text,
  day integer NOT NULL DEFAULT 1,
  confirmed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_attendance_course ON public.course_attendance(course_id);
CREATE INDEX IF NOT EXISTS idx_course_attendance_email ON public.course_attendance(lower(student_email));

ALTER TABLE public.course_attendance ENABLE ROW LEVEL SECURITY;

-- Public can insert (attendance is filled via public /presenca page)
CREATE POLICY "Anyone can insert attendance"
  ON public.course_attendance FOR INSERT
  WITH CHECK (true);

-- Public can read attendance for a course (needed for "already confirmed" check)
CREATE POLICY "Anyone can read attendance"
  ON public.course_attendance FOR SELECT
  USING (true);

-- Only the course owner can delete
CREATE POLICY "Course owners can delete attendance"
  ON public.course_attendance FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_attendance.course_id AND c.user_id = auth.uid()
  ));

-- 4. Create client_branding table
CREATE TABLE IF NOT EXISTS public.client_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  logo_url text,
  instagram_handle text,
  facebook_url text,
  youtube_url text,
  linkedin_url text,
  primary_color text DEFAULT '#B9FF4B',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_branding ENABLE ROW LEVEL SECURITY;

-- Public can read branding (used by public attendance page)
CREATE POLICY "Anyone can read client branding"
  ON public.client_branding FOR SELECT
  USING (true);

CREATE POLICY "Users manage own branding"
  ON public.client_branding FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_client_branding_updated_at
  BEFORE UPDATE ON public.client_branding
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Allow public read of courses by id (needed for /presenca page to fetch title)
DROP POLICY IF EXISTS "Anyone can read course basic info" ON public.courses;
CREATE POLICY "Anyone can read course basic info"
  ON public.courses FOR SELECT
  USING (true);

-- 6. Allow public read of enrollments (needed to validate email on /presenca page)
DROP POLICY IF EXISTS "Anyone can read enrollment by email" ON public.course_enrollments;
CREATE POLICY "Anyone can read enrollment by email"
  ON public.course_enrollments FOR SELECT
  USING (true);

-- 7. Enable realtime on course_attendance
ALTER PUBLICATION supabase_realtime ADD TABLE public.course_attendance;
ALTER TABLE public.course_attendance REPLICA IDENTITY FULL;
