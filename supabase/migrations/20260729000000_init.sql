-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE media_type AS ENUM ('movie', 'tv');

-- 🟢 Refactored state enum mapping to support the collapsed matrix board design
CREATE TYPE kanban_state AS ENUM ('long_list', 'short_list', 'watching', 'watched');

-- 2. TABLES DEFINITIONS

-- Profiles table (Linked to Supabase Auth via trigger)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Shared media cache metadata
CREATE TABLE public.media_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tmdb_id TEXT NOT NULL UNIQUE,
    imdb_id TEXT,
    title TEXT NOT NULL,
    type media_type NOT NULL,
    description TEXT,
    rotten_tomatoes_score INT,
    streaming_services JSONB DEFAULT '[]'::jsonb NOT NULL,
    genres TEXT[] DEFAULT '{}'::text[] NOT NULL,
    total_seasons INT DEFAULT 1 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User-specific tracker progress states
CREATE TABLE public.user_media_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    media_item_id UUID REFERENCES public.media_items(id) ON DELETE CASCADE NOT NULL,
    state kanban_state DEFAULT 'long_list'::kanban_state NOT NULL, -- Defaults to long_list (available tracking baseline)
    current_season INT DEFAULT 1 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(profile_id, media_item_id)
);

-- 3. INTER-TABLE INTEGRITY ENGINE RULES
-- Enforce a database level check matrix rule to automatically assert streaming availability
CREATE OR REPLACE FUNCTION public.verify_media_availability(media_id UUID, targeted_state kanban_state)
RETURNS BOOLEAN AS $$
DECLARE
    has_providers BOOLEAN;
BEGIN
    -- Check if the streaming_services array contains at least one item
    SELECT (jsonb_array_length(streaming_services) > 0) INTO has_providers
    FROM public.media_items
    WHERE id = media_id;

    -- Items with no streaming providers are restricted from tracking lanes; fallback to 'not_available' handled dynamically by GUI
    IF NOT has_providers THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- 🟢 Fixed: Cleaned up language string parameter here

-- Bind the function check parameter constraint rule straight onto user rows
ALTER TABLE public.user_media_states
DROP CONSTRAINT IF EXISTS check_streaming_availability;

ALTER TABLE public.user_media_states
ADD CONSTRAINT check_streaming_availability 
CHECK (public.verify_media_availability(media_item_id, state) = TRUE);

-- 4. AUTOMATED PROFILE PROVISIONING TRIGGER
-- Automatically copies user metadata into public.profiles on Google OAuth sign-in
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
        new.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable security constraints on your tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_media_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full shared access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow full shared access to media_items" ON public.media_items;
DROP POLICY IF EXISTS "Allow full shared access to user_media_states" ON public.user_media_states;

CREATE POLICY "Allow full shared access to profiles" ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow full shared access to media_items" ON public.media_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow full shared access to user_media_states" ON public.user_media_states FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


-- 🟢 GRANT ACCESS ROLE PRIVILEGES: Explicitly allow the developer anon role to read local tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.media_items TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_media_states TO anon, authenticated;
