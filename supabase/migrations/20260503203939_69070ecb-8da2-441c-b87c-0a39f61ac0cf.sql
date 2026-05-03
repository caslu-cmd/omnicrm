
INSERT INTO storage.buckets (id, name, public)
VALUES ('aira-recordings', 'aira-recordings', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload aira recordings"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'aira-recordings');

CREATE POLICY "Authenticated users can read aira recordings"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'aira-recordings');

CREATE POLICY "Authenticated users can delete aira recordings"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'aira-recordings');
