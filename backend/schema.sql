-- Play Anything - Clean Supabase Table Schema
-- Run this in your Supabase SQL Editor.

DROP TABLE IF EXISTS public.songs CASCADE;
DROP TABLE IF EXISTS public.collections CASCADE;

-- 1. Collections Table (No presets seeded; users create their own)
CREATE TABLE public.collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Songs Table (Private & Global Public Songs with Trending & New support)
CREATE TABLE public.songs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT 'Unknown Artist',
  duration NUMERIC NOT NULL DEFAULT 0,
  bpm NUMERIC NOT NULL DEFAULT 120,
  track_count INTEGER NOT NULL DEFAULT 1,
  total_notes INTEGER NOT NULL DEFAULT 0,
  difficulty TEXT NOT NULL DEFAULT 'Beginner', -- 'Beginner' | 'Intermediate' | 'Advanced'
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  in_progress BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT false, -- false = Private Library, true = Public Songs Catalogue
  is_trending BOOLEAN NOT NULL DEFAULT false, -- For Public Songs 'Trending' filter
  collection_id TEXT REFERENCES public.collections(id) ON DELETE SET NULL,
  midi_url TEXT,
  notes_data JSONB,
  practice_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_practice_seconds INTEGER NOT NULL DEFAULT 0,
  average_accuracy NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_practiced_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_songs_is_public ON public.songs(is_public);
CREATE INDEX idx_songs_is_trending ON public.songs(is_trending);
CREATE INDEX idx_songs_collection ON public.songs(collection_id);
CREATE INDEX idx_songs_created_at ON public.songs(created_at DESC);

-- Enable RLS and public access policies
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to collections" ON public.collections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to songs" ON public.songs FOR ALL USING (true) WITH CHECK (true);
