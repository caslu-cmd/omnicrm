-- Table for AI-generated (or manual) checklists per course
CREATE TABLE public.course_checklists (
  id           uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id    uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL,
  client_id    text,
  title        text NOT NULL,
  description  text,
  status       text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','in_progress','completed')),
  responsible  text NOT NULL DEFAULT 'student'
                 CHECK (responsible IN ('agency','student')),
  order_index  integer NOT NULL DEFAULT 0,
  notes        text,
  completed_at timestamp with time zone,
  created_at   timestamp with time zone NOT NULL DEFAULT now(),
  updated_at   timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX course_checklists_course_id_idx ON public.course_checklists(course_id);
CREATE INDEX course_checklists_client_id_idx ON public.course_checklists(client_id);

ALTER TABLE public.course_checklists ENABLE ROW LEVEL SECURITY;

-- Owner (agency) manages their checklists
CREATE POLICY "Users can view own course checklists"
  ON public.course_checklists FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own course checklists"
  ON public.course_checklists FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own course checklists"
  ON public.course_checklists FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own course checklists"
  ON public.course_checklists FOR DELETE USING (auth.uid() = user_id);

-- Portal (anonymous/public) can read checklists by client_id
CREATE POLICY "Portal can read checklists by client_id"
  ON public.course_checklists FOR SELECT
  USING (client_id IS NOT NULL);

-- updated_at trigger
CREATE TRIGGER update_course_checklists_updated_at
  BEFORE UPDATE ON public.course_checklists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
