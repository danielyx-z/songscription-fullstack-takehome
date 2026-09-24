export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface NoteEvent {
  pitch: string;
  midi: number;
  time: number;
  duration: number;
  velocity: number;
  hand?: 'left' | 'right';
}

export interface PracticeSession {
  id: string;
  date: string;
  durationSeconds: number;
  accuracyPercent: number;
  tempoMultiplier: number;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number;
  bpm: number;
  trackCount: number;
  totalNotes: number;
  difficulty: DifficultyLevel;
  isFavorite: boolean;
  inProgress: boolean;
  isPublic?: boolean;
  isTrending?: boolean;
  collectionId?: string | null;
  midiUrl?: string;
  notesData?: NoteEvent[];
  practiceHistory: PracticeSession[];
  totalPracticeSeconds: number;
  averageAccuracy: number;
  createdAt: string;
  lastPracticedAt?: string | null;
}

export type SortOption =
  | 'recent'
  | 'oldest'
  | 'last_practiced'
  | 'difficulty_asc'
  | 'difficulty_desc'
  | 'bpm_desc'
  | 'duration_desc'
  | 'title_asc';

export type FilterStatus = 'all' | 'favorites' | 'in_progress';

export type PublicFilterStatus = 'all' | 'trending' | 'new';

export type ViewMode = 'grid' | 'table';

export type LibraryTab = 'my_library' | 'public_songs';
