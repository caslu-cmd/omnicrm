-- Social connections per client per platform
CREATE TABLE public.social_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('instagram', 'facebook', 'linkedin')),
  account_id text,
  account_name text,
  account_username text,
  followers_count integer DEFAULT 0,
  access_token text,
  token_expires_at timestamptz,
  connected boolean NOT NULL DEFAULT false,
  connected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, client_id, platform)
);

ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own social connections"
  ON public.social_connections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Scheduled / published posts
CREATE TABLE public.scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id text NOT NULL,
  platforms text[] NOT NULL DEFAULT '{}',
  caption text,
  media_url text,
  media_type text DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'text')),
  scheduled_at timestamptz,
  published_at timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed')),
  fb_post_id text,
  ig_media_id text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own scheduled posts"
  ON public.scheduled_posts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_social_connections_updated_at
  BEFORE UPDATE ON public.social_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_posts_updated_at
  BEFORE UPDATE ON public.scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
