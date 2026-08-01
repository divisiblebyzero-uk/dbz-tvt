-- 1. SEED AUTHENTICATED USERS (Creates parents inside the internal auth schema)
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES 
  (
    '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001',
    'authenticated', 'authenticated', 'husband@test.com', crypt('password123', gen_salt('bf')),
    NOW(), '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Husband Test","avatar_url":"https://dicebear.com"}'::jsonb, NOW(), NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002',
    'authenticated', 'authenticated', 'wife@test.com', crypt('password123', gen_salt('bf')),
    NOW(), '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Wife Test","avatar_url":"https://dicebear.com"}'::jsonb, NOW(), NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 2. POPULATE CACHED MEDIA METADATA ASSETS
INSERT INTO public.media_items (id, tmdb_id, imdb_id, title, type, description, rotten_tomatoes_score, streaming_services, genres, total_seasons)
VALUES
  (
    'a0000000-0000-0000-0000-000000000001', '550', 'tt0137523', 'Fight Club', 'movie', 
    'An insomniac office worker and a devil-may-care soap maker form an underground fight club.', 
    79, '[{"name": "Disney+", "logo": ""}]'::jsonb, '{Drama, Thriller}', 1
  ),
  (
    'a0000000-0000-0000-0000-000000000002', '1399', 'tt0944947', 'Game of Thrones', 'tv', 
    'Seven noble families fight for control of the mythical land of Westeros.', 
    89, '[{"name": "Sky Go", "logo": ""}, {"name": "NOW", "logo": ""}]'::jsonb, '{Action, Adventure, Drama}', 8
  ),
  (
    'a0000000-0000-0000-0000-000000000003', '60625', 'tt2085059', 'Rick and Morty', 'tv', 
    'An animated series about the infinite adventures of a sociopathic scientist and his grandson.', 
    92, '[{"name": "Netflix", "logo": ""}]'::jsonb, '{Animation, Comedy, Sci-Fi}', 7
  ),
  (
    'a0000000-0000-0000-0000-000000000004', '27205', 'tt1375666', 'Inception', 'movie',
    'A thief who steals corporate secrets through the use of dream-sharing technology.',
    87, '[{"name": "Prime Video", "logo": ""}]'::jsonb, '{Action, Sci-Fi}', 1
  ),
  (
    'a0000000-0000-0000-0000-000000000005', '66732', 'tt4508902', 'Stranger Things', 'tv',
    'When a young boy vanishes, a small town uncovers a mystery involving secret experiments.',
    93, '[{"name": "Netflix", "logo": ""}]'::jsonb, '{Drama, Fantasy, Horror}', 4
  ),
  (
    'a0000000-0000-0000-0000-000000000006', '157336', 'tt0816692', 'Interstellar', 'movie',
    'A team of explorers travel through a wormhole in space in an attempt to ensure humanity survival.',
    73, '[{"name": "Paramount+", "logo": ""}]'::jsonb, '{Adventure, Drama, Sci-Fi}', 1
  ),
  (
    'a0000000-0000-0000-0000-000000000007', '99999', 'tt9999999', 'Unreleased Blockbuster', 'movie', 
    'A future cinema release with no streaming availability. Restricted by DB constraints from operational lanes.', 
    null, '[]'::jsonb, '{Mystery}', 1
  )
ON CONFLICT (tmdb_id) DO NOTHING;

-- 3. LINK PROGRESSION SNAPSHOT ROWS VERIFYING ALL COLLAPSE SCENARIOS

-- Scenario 1: Convergent Matrix Match (Game of Thrones)
-- Filter "Both": Should COLLAPSE into a single Active entry with a "Both" badge.
INSERT INTO public.user_media_states (profile_id, media_item_id, state, current_season) VALUES
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'watching'::kanban_state, 2),
  ('00000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'watching'::kanban_state, 2)
ON CONFLICT DO NOTHING;

-- Scenario 2: Divergent Matrix Match (Fight Club)
-- Filter "Both": Should SPLIT into Shortlist (Husband Tag) and Longlist (Wife Tag).
INSERT INTO public.user_media_states (profile_id, media_item_id, state, current_season) VALUES
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'short_list'::kanban_state, 1),
  ('00000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'long_list'::kanban_state, 1)
ON CONFLICT DO NOTHING;

-- Scenario 3: Single-User Explicit Interest (Inception)
-- Filter "Both" or "Husband": Shows in Shortlist (Husband Tag). Filter "Wife": Hidden completely (No record).
INSERT INTO public.user_media_states (profile_id, media_item_id, state, current_season) VALUES
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'short_list'::kanban_state, 1)
ON CONFLICT DO NOTHING;

-- Scenario 4: Single-User Explicit Interest (Stranger Things)
-- Filter "Both" or "Wife": Shows in Watching (Wife Tag). Filter "Husband": Hidden completely (No record).
INSERT INTO public.user_media_states (profile_id, media_item_id, state, current_season) VALUES
  ('00000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', 'watching'::kanban_state, 4)
ON CONFLICT DO NOTHING;

-- Scenario 5: Dual Convergent Completion (Interstellar)
-- Filter "Both": Collapses into Done lane with a "Both" badge.
INSERT INTO public.user_media_states (profile_id, media_item_id, state, current_season) VALUES
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000006', 'watched'::kanban_state, 1),
  ('00000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000006', 'watched'::kanban_state, 1)
ON CONFLICT DO NOTHING;

-- NOTE: Rick and Morty ('a0000000-0000-0000-0000-000000000003') has providers but NO user tracking states.
-- Filter "Both": Will automatically be driven into the Long List lane as unassigned baseline interest.
