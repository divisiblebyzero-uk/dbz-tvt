-- 1. SEED AUTHENTICATED USERS (Creates the parents inside the internal auth schema)
-- We populate instance metadata, matching static UUIDs, roles, and a dummy password hash.
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
)
VALUES 
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'husband@test.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Husband Test","avatar_url":"https://dicebear.com"}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'wife@test.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Wife Test","avatar_url":"https://dicebear.com"}'::jsonb,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- NOTE: Your database trigger `on_auth_user_created` will automatically copy 
-- these records straight into `public.profiles` for you right now!

-- 2. POPULATE CACHED MEDIA METADATA ASSETS
INSERT INTO public.media_items (id, tmdb_id, imdb_id, title, type, description, rotten_tomatoes_score, streaming_services, genres, total_seasons)
VALUES
  (
    gen_random_uuid(), '550', 'tt0137523', 'Fight Club', 'movie', 
    'An insomniac office worker and a devil-may-care soap maker form an underground fight club.', 
    79, '[{"name": "Disney+", "logo": ""}]'::jsonb, '{Drama, Thriller}', 1
  ),
  (
    gen_random_uuid(), '1399', 'tt0944947', 'Game of Thrones', 'tv', 
    'Seven noble families fight for control of the mythical land of Westeros.', 
    89, '[{"name": "Sky Go", "logo": ""}, {"name": "NOW", "logo": ""}]'::jsonb, '{Action, Adventure, Drama}', 8
  ),
  (
    gen_random_uuid(), '60625', 'tt2085059', 'Rick and Morty', 'tv', 
    'An animated series about the infinite adventures of a sociopathic scientist and his grandson.', 
    92, '[{"name": "Netflix", "logo": ""}]'::jsonb, '{Animation, Comedy, Sci-Fi}', 7
  )
ON CONFLICT (tmdb_id) DO NOTHING;

-- 3. LINK PROGRESSION SNAPSHOT ROWS SHOWING SPLIT STATES
-- Links Game of Thrones where Husband is on Season 2 but Wife is on Season 1
INSERT INTO public.user_media_states (profile_id, media_item_id, state, current_season)
SELECT 
  (SELECT id FROM public.profiles WHERE display_name = 'Husband Test'),
  (SELECT id FROM public.media_items WHERE title = 'Game of Thrones'),
  'watching'::kanban_state,
  2
ON CONFLICT DO NOTHING;

INSERT INTO public.user_media_states (profile_id, media_item_id, state, current_season)
SELECT 
  (SELECT id FROM public.profiles WHERE display_name = 'Wife Test'),
  (SELECT id FROM public.media_items WHERE title = 'Game of Thrones'),
  'watching'::kanban_state,
  1
ON CONFLICT DO NOTHING;

-- Link Fight Club as a shared prioritised item for both users
INSERT INTO public.user_media_states (profile_id, media_item_id, state, current_season)
SELECT 
  p.id,
  (SELECT id FROM public.media_items WHERE title = 'Fight Club'),
  'prioritised'::kanban_state,
  1
FROM public.profiles p
ON CONFLICT DO NOTHING;
