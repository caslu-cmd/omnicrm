
DO $$
DECLARE me uuid := '93459bef-0a02-4bb9-9f49-e82ed07ed9f8';
BEGIN
  DELETE FROM public.contacts WHERE user_id <> me;
  DELETE FROM public.deals WHERE user_id <> me;
  DELETE FROM public.pipelines WHERE user_id <> me;
  DELETE FROM public.automations WHERE user_id <> me;
  DELETE FROM public.course_enrollments WHERE user_id <> me;
  DELETE FROM public.courses WHERE user_id <> me;
  DELETE FROM public.integrations WHERE user_id <> me;
  DELETE FROM public.scheduled_posts WHERE user_id <> me;
  DELETE FROM public.social_connections WHERE user_id <> me;
  DELETE FROM public.agent_proposals WHERE user_id <> me;
  DELETE FROM public.client_calendar_events WHERE user_id <> me;
  DELETE FROM public.notifications WHERE user_id <> me;
END $$;
