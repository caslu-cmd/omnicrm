-- Add client_id to courses so each course belongs to a specific client workspace
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS client_id text;

-- Add student phone for WhatsApp sending
ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS student_phone text;

-- Index for filtering by client
CREATE INDEX IF NOT EXISTS idx_courses_client_id ON public.courses(client_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON public.course_enrollments(course_id);
