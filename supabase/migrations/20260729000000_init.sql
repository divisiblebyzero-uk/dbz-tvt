-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE media_type AS ENUM ('movie', 'tv');
CREATE TYPE kanban_state AS ENUM ('not_available', 'available', 'prioritised', 'watching', 'watched');

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
    state kanban_state DEFAULT 'available'::kanban_state NOT NULL,
    current_season INT DEFAULT 1 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(profile_id, media_item_id)
);

-- 3. AUTOMATED PROFILE PROVISIONING TRIGGER
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

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable security constraints on your tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_media_states ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users (you and your wife) to read/write all data collectively
CREATE POLICY "Allow full shared access to profiles" 
    ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow full shared access to media_items" 
    ON public.media_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow full shared access to user_media_states" 
    ON public.user_media_states FOR ALL TO authenticated USING (true) WITH CHECK (true);
