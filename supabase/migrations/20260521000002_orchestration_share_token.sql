ALTER TABLE public.orchestration_runs
  ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- Allow anon to read a run when it has a share token
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'orchestration_runs'
      AND policyname = 'orchestration_share_public_read'
  ) THEN
    EXECUTE $p$
      CREATE POLICY orchestration_share_public_read
        ON public.orchestration_runs
        FOR SELECT TO anon
        USING (share_token IS NOT NULL)
    $p$;
  END IF;
END $$;

-- Allow anon to read tasks that belong to a shared run
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'orchestration_tasks'
      AND policyname = 'orchestration_tasks_share_public_read'
  ) THEN
    EXECUTE $p$
      CREATE POLICY orchestration_tasks_share_public_read
        ON public.orchestration_tasks
        FOR SELECT TO anon
        USING (
          run_id IN (
            SELECT id FROM public.orchestration_runs
            WHERE share_token IS NOT NULL
          )
        )
    $p$;
  END IF;
END $$;
