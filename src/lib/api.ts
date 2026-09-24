import { supabase } from './supabase';
import { Song, Collection } from '@/types/song';

export interface DatabaseSongRow {
  id: string;
  title: string;
  artist: string;
  duration: number;
  bpm: number;
  track_count: number;
  total_notes: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  is_favorite: boolean;
  in_progress: boolean;
  is_public?: boolean;
  is_trending?: boolean;
  collection_id?: string | null;
  midi_url?: string | null;
  notes_data?: any;
  practice_history?: any;
  total_practice_seconds: number;
  average_accuracy: number;
  created_at: string;
  last_practiced_at?: string | null;
}

export function mapRowToSong(row: DatabaseSongRow): Song {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    duration: Number(row.duration) || 0,
    bpm: Number(row.bpm) || 120,
    trackCount: Number(row.track_count) || 1,
    totalNotes: Number(row.total_notes) || 0,
    difficulty: row.difficulty || 'Beginner',
    isFavorite: Boolean(row.is_favorite),
    inProgress: Boolean(row.in_progress),
    isPublic: Boolean(row.is_public),
    isTrending: Boolean(row.is_trending),
    collectionId: row.collection_id || null,
    midiUrl: row.midi_url || undefined,
    notesData: Array.isArray(row.notes_data) ? row.notes_data : [],
    practiceHistory: Array.isArray(row.practice_history) ? row.practice_history : [],
    totalPracticeSeconds: Number(row.total_practice_seconds) || 0,
    averageAccuracy: Number(row.average_accuracy) || 0,
    createdAt: row.created_at,
    lastPracticedAt: row.last_practiced_at,
  };
}

export function mapSongToRow(song: Song): DatabaseSongRow {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    duration: song.duration,
    bpm: song.bpm,
    track_count: song.trackCount,
    total_notes: song.totalNotes,
    difficulty: song.difficulty,
    is_favorite: song.isFavorite,
    in_progress: song.inProgress,
    is_public: Boolean(song.isPublic),
    is_trending: Boolean(song.isTrending),
    collection_id: song.collectionId || null,
    midi_url: song.midiUrl || null,
    notes_data: song.notesData || [],
    practice_history: song.practiceHistory || [],
    total_practice_seconds: song.totalPracticeSeconds,
    average_accuracy: song.averageAccuracy,
    created_at: song.createdAt,
    last_practiced_at: song.lastPracticedAt || null,
  };
}

export async function getSongsFromSupabase(): Promise<{ data: Song[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    const songs = (data || []).map((row) => mapRowToSong(row as DatabaseSongRow));
    return { data: songs, error: null };
  } catch (err: any) {
    return { data: [], error: err?.message || 'Failed to connect to Supabase' };
  }
}

export async function saveSongToSupabase(song: Song): Promise<{ error: string | null }> {
  try {
    const row = mapSongToRow(song);
    const { error } = await supabase.from('songs').upsert(row);
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err?.message || 'Error saving song to Supabase' };
  }
}

export async function updateSongInSupabase(
  id: string,
  updates: Partial<Song>
): Promise<{ error: string | null }> {
  try {
    const dbUpdates: Partial<DatabaseSongRow> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.artist !== undefined) dbUpdates.artist = updates.artist;
    if (updates.difficulty !== undefined) dbUpdates.difficulty = updates.difficulty;
    if (updates.isFavorite !== undefined) dbUpdates.is_favorite = updates.isFavorite;
    if (updates.inProgress !== undefined) dbUpdates.in_progress = updates.inProgress;
    if (updates.isPublic !== undefined) dbUpdates.is_public = updates.isPublic;
    if (updates.isTrending !== undefined) dbUpdates.is_trending = updates.isTrending;
    if (updates.collectionId !== undefined) dbUpdates.collection_id = updates.collectionId;
    if (updates.practiceHistory !== undefined) dbUpdates.practice_history = updates.practiceHistory;
    if (updates.totalPracticeSeconds !== undefined) dbUpdates.total_practice_seconds = updates.totalPracticeSeconds;
    if (updates.averageAccuracy !== undefined) dbUpdates.average_accuracy = updates.averageAccuracy;
    if (updates.lastPracticedAt !== undefined) dbUpdates.last_practiced_at = updates.lastPracticedAt;

    const { error } = await supabase.from('songs').update(dbUpdates).eq('id', id);
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err?.message || 'Error updating song' };
  }
}

export async function deleteSongFromSupabase(id: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.from('songs').delete().eq('id', id);
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err?.message || 'Error deleting song' };
  }
}

export async function getCollectionsFromSupabase(): Promise<{ data: Collection[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data || []) as Collection[], error: null };
  } catch (err: any) {
    return { data: [], error: err?.message || 'Failed to fetch collections' };
  }
}

export async function createCollectionInSupabase(name: string): Promise<{ data: Collection | null; error: string | null }> {
  try {
    const id = `col-${Date.now()}`;
    const newCol = { id, name };
    const { data, error } = await supabase
      .from('collections')
      .insert(newCol)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to create collection' };
  }
}

export async function uploadMidiToStorage(file: File, path: string): Promise<{ url: string | null; error: string | null }> {
  try {
    const { data, error } = await supabase.storage
      .from('midi-files')
      .upload(path, file, { upsert: true });

    if (error) {
      return { url: null, error: error.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from('midi-files')
      .getPublicUrl(data.path);

    return { url: publicUrlData.publicUrl, error: null };
  } catch (err: any) {
    return { url: null, error: err?.message || 'Storage upload error' };
  }
}
