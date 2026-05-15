-- Add num_days to courses (how many days the course spans)
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS num_days INTEGER DEFAULT 1;

-- Add day to course_attendance (which day the student confirmed presence)
ALTER TABLE public.course_attendance ADD COLUMN IF NOT EXISTS day INTEGER DEFAULT 1;
