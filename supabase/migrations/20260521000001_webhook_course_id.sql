-- Link webhook endpoints directly to courses (so enrollments are auto-created on form submit)
ALTER TABLE public.webhook_endpoints
  ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_course_id ON public.webhook_endpoints(course_id);
