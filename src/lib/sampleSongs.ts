import { Song, Collection } from '@/types/song';
import { parseMidiFile } from './midiParser';

// No preset collections as requested
export const DEFAULT_COLLECTIONS: Collection[] = [];

export const INITIAL_USER_SONG = {
  id: 'user-fur-elise',
  file: 'beethoven-fur-elise.mid',
  title: 'Für Elise (WoO 59)',
  artist: 'Ludwig van Beethoven',
  isFavorite: true,
  inProgress: true,
  isPublic: false,
  difficulty: 'Intermediate' as const,
  collectionId: null,
  practiceHistory: [
    { id: 'p1', date: '2026-09-18T10:00:00Z', durationSeconds: 600, accuracyPercent: 84, tempoMultiplier: 0.8 },
    { id: 'p2', date: '2026-09-20T14:30:00Z', durationSeconds: 900, accuracyPercent: 91, tempoMultiplier: 0.9 },
    { id: 'p3', date: '2026-09-22T16:15:00Z', durationSeconds: 720, accuracyPercent: 94, tempoMultiplier: 1.0 },
    { id: 'p4', date: '2026-09-24T11:00:00Z', durationSeconds: 1200, accuracyPercent: 96, tempoMultiplier: 1.0 },
  ],
  totalPracticeSeconds: 3420,
  averageAccuracy: 91,
  createdAt: '2026-09-15T08:00:00Z',
  lastPracticedAt: '2026-09-24T11:00:00Z',
};

// Global / Public songs with trending & date data
export const GLOBAL_PUBLIC_SONGS_INFO = [
  {
    id: 'pub-river-flows',
    file: 'beethoven-fur-elise.mid',
    title: 'River Flows In You',
    artist: 'Yiruma',
    difficulty: 'Intermediate' as const,
    duration: 185,
    bpm: 72,
    trackCount: 2,
    totalNotes: 420,
    isTrending: true,
    collectionId: null,
    createdAt: '2026-09-20T00:00:00Z', // New
  },
  {
    id: 'pub-howls-moving-castle',
    file: 'beethoven-fur-elise.mid',
    title: 'Merry-Go-Round of Life',
    artist: 'Joe Hisaishi',
    difficulty: 'Intermediate' as const,
    duration: 245,
    bpm: 110,
    trackCount: 2,
    totalNotes: 530,
    isTrending: true,
    collectionId: null,
    createdAt: '2026-09-22T00:00:00Z', // New
  },
  {
    id: 'pub-golden-hour',
    file: 'beethoven-fur-elise.mid',
    title: 'Golden Hour',
    artist: 'JVKE',
    difficulty: 'Advanced' as const,
    duration: 215,
    bpm: 88,
    trackCount: 2,
    totalNotes: 610,
    isTrending: true,
    collectionId: null,
    createdAt: '2026-09-24T00:00:00Z', // New
  },
  {
    id: 'pub-clair-de-lune',
    file: 'beethoven-fur-elise.mid',
    title: 'Clair de Lune',
    artist: 'Claude Debussy',
    difficulty: 'Advanced' as const,
    duration: 310,
    bpm: 60,
    trackCount: 2,
    totalNotes: 780,
    isTrending: false,
    collectionId: null,
    createdAt: '2026-08-10T00:00:00Z',
  },
  {
    id: 'pub-nuvole-bianche',
    file: 'beethoven-fur-elise.mid',
    title: 'Nuvole Bianche',
    artist: 'Ludovico Einaudi',
    difficulty: 'Intermediate' as const,
    duration: 340,
    bpm: 76,
    trackCount: 2,
    totalNotes: 640,
    isTrending: false,
    collectionId: null,
    createdAt: '2026-08-15T00:00:00Z',
  },
  {
    id: 'pub-twinkle',
    file: 'twinkle-twinkle.mid',
    title: 'Twinkle, Twinkle, Little Star',
    artist: 'Traditional / W. A. Mozart',
    difficulty: 'Beginner' as const,
    duration: 8,
    bpm: 110,
    trackCount: 1,
    totalNotes: 14,
    isTrending: false,
    collectionId: null,
    createdAt: '2026-07-01T00:00:00Z',
  },
  {
    id: 'pub-scale',
    file: 'c-major-scale.mid',
    title: 'C Major Scale Technique',
    artist: 'Piano Exercise',
    difficulty: 'Beginner' as const,
    duration: 4,
    bpm: 100,
    trackCount: 1,
    totalNotes: 8,
    isTrending: false,
    collectionId: null,
    createdAt: '2026-07-05T00:00:00Z',
  },
];

export async function loadInitialSongs(): Promise<Song[]> {
  const songs: Song[] = [];

  // Load User Library Song
  try {
    const res = await fetch(`/samples/${INITIAL_USER_SONG.file}`);
    const buffer = await res.arrayBuffer();
    const parsed = await parseMidiFile(buffer, INITIAL_USER_SONG.title);

    songs.push({
      id: INITIAL_USER_SONG.id,
      title: INITIAL_USER_SONG.title,
      artist: INITIAL_USER_SONG.artist,
      duration: parsed.duration,
      bpm: parsed.bpm,
      trackCount: parsed.trackCount,
      totalNotes: parsed.totalNotes,
      difficulty: INITIAL_USER_SONG.difficulty,
      isFavorite: INITIAL_USER_SONG.isFavorite,
      inProgress: INITIAL_USER_SONG.inProgress,
      isPublic: false,
      isTrending: false,
      collectionId: null,
      midiUrl: `/samples/${INITIAL_USER_SONG.file}`,
      notesData: parsed.notesData,
      practiceHistory: INITIAL_USER_SONG.practiceHistory,
      totalPracticeSeconds: INITIAL_USER_SONG.totalPracticeSeconds,
      averageAccuracy: INITIAL_USER_SONG.averageAccuracy,
      createdAt: INITIAL_USER_SONG.createdAt,
      lastPracticedAt: INITIAL_USER_SONG.lastPracticedAt,
    });
  } catch (e) {
    console.warn('Error loading initial user song:', e);
  }

  // Load Public Songs
  for (const pub of GLOBAL_PUBLIC_SONGS_INFO) {
    try {
      const res = await fetch(`/samples/${pub.file}`);
      const buffer = await res.arrayBuffer();
      const parsed = await parseMidiFile(buffer, pub.title);

      songs.push({
        id: pub.id,
        title: pub.title,
        artist: pub.artist,
        duration: pub.duration || parsed.duration,
        bpm: pub.bpm || parsed.bpm,
        trackCount: pub.trackCount || parsed.trackCount,
        totalNotes: pub.totalNotes || parsed.totalNotes,
        difficulty: pub.difficulty || parsed.difficulty,
        isFavorite: false,
        inProgress: false,
        isPublic: true,
        isTrending: pub.isTrending,
        collectionId: null,
        midiUrl: `/samples/${pub.file}`,
        notesData: parsed.notesData,
        practiceHistory: [],
        totalPracticeSeconds: 0,
        averageAccuracy: 0,
        createdAt: pub.createdAt,
        lastPracticedAt: null,
      });
    } catch (e) {
      console.warn(`Error loading public song ${pub.title}:`, e);
    }
  }

  return songs;
}