-- Create public storage bucket for post media uploads
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-media',
  'post-media',
  true,
  52428800, -- 50 MB
  array['image/jpeg','image/jpg','image/png','image/gif','image/webp','video/mp4','video/quicktime']
)
on conflict (id) do nothing;

-- Allow authenticated users to upload files
create policy "Authenticated users can upload post media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'post-media');

-- Allow authenticated users to update their own files
create policy "Authenticated users can update post media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'post-media');

-- Allow public read access
create policy "Public read access for post media"
  on storage.objects for select
  to public
  using (bucket_id = 'post-media');

-- Allow authenticated users to delete their own files
create policy "Authenticated users can delete post media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'post-media');
