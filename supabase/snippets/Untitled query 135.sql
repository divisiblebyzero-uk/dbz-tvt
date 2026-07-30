GRANT ALL PRIVILEGES ON TABLE public.profiles TO anon, authenticated, service_role;

-- Grant full read/write privileges to all developer and user roles on media items
GRANT ALL PRIVILEGES ON TABLE public.media_items TO anon, authenticated, service_role;

-- Grant full read/write privileges to all developer and user roles on media states
GRANT ALL PRIVILEGES ON TABLE public.user_media_states TO anon, authenticated, service_role;