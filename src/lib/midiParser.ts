import { Midi } from '@tonejs/midi';
import { NoteEvent, DifficultyLevel } from '@/types/song';

export interface ParsedMidiResult {
  title: string;
  artist: string;
  duration: number; // in seconds
  bpm: number;
  trackCount: number;
  totalNotes: number;
  leftHandNotes: number;
  rightHandNotes: number;
  difficulty: DifficultyLevel;
  notesData: NoteEvent[];
}

/**
 * Calculates difficulty based strictly on note density (notes per second)
 */
export function calculateDifficulty(totalNotes: number, duration: number): DifficultyLevel {
  if (duration <= 0 || totalNotes <= 0) return 'Beginner';
  const density = totalNotes / duration;
  if (density < 3) return 'Beginner';
  if (density < 7) return 'Intermediate';
  return 'Advanced';
}

const FAMOUS_COMPOSERS = [
  'Ludwig van Beethoven',
  'Beethoven',
  'Frédéric Chopin',
  'Chopin',
  'Wolfgang Amadeus Mozart',
  'Mozart',
  'Johann Sebastian Bach',
  'J. S. Bach',
  'Bach',
  'Claude Debussy',
  'Debussy',
  'Franz Liszt',
  'Liszt',
  'Pyotr Ilyich Tchaikovsky',
  'Tchaikovsky',
  'Johannes Brahms',
  'Brahms',
  'Franz Schubert',
  'Schubert',
  'Robert Schumann',
  'Schumann',
  'Antonio Vivaldi',
  'Vivaldi',
  'Erik Satie',
  'Satie',
  'Maurice Ravel',
  'Ravel',
  'Sergei Rachmaninoff',
  'Rachmaninoff',
  'Yiruma',
  'Ludovico Einaudi',
  'Einaudi',
  'Joe Hisaishi',
  'Scott Joplin',
  'Joplin',
  'Yann Tiersen',
  'JVKE',
];

/**
 * Automatically parses title and artist from filename or MIDI metadata
 */
export function extractTitleAndArtist(rawName: string, midiMetadata?: any): { title: string; artist: string } {
  // Remove file extension and clean formatting
  let clean = rawName
    .replace(/\.[^/.]+$/, '') // remove .mid / .midi
    .replace(/^[0-9]+[\.\-\_\s]+/, '') // remove leading track numbers e.g. "01 - " or "1. "
    .trim();

  let title = clean;
  let artist = 'Unknown Artist';

  // Check if midi metadata has copyright or track info with artist
  if (midiMetadata && typeof midiMetadata === 'object') {
    if (midiMetadata.copyright && typeof midiMetadata.copyright === 'string') {
      const match = midiMetadata.copyright.match(/(?:by|©|\(c\))\s*([A-Za-z\s]+)/i);
      if (match && match[1]?.trim().length > 2) {
        artist = match[1].trim();
      }
    }
  }

  // 1. Pattern: "Title by Artist" or "Title By Artist"
  if (/\s+by\s+/i.test(clean)) {
    const parts = clean.split(/\s+by\s+/i);
    if (parts.length >= 2) {
      title = parts[0].trim();
      artist = parts[1].trim();
      return { title, artist };
    }
  }

  // 2. Pattern: "Artist - Title" or "Title - Artist" (dash / en-dash / em-dash / underscore)
  if (clean.includes(' - ') || clean.includes(' – ') || clean.includes(' — ')) {
    const parts = clean.split(/\s*[-–—]\s*/);
    if (parts.length >= 2) {
      const p1 = parts[0].trim();
      const p2 = parts[1].trim();

      // Check if p1 is a composer/artist
      const p1IsComposer = FAMOUS_COMPOSERS.some(
        (c) => p1.toLowerCase() === c.toLowerCase() || p1.toLowerCase().includes(c.toLowerCase())
      );
      const p2IsComposer = FAMOUS_COMPOSERS.some(
        (c) => p2.toLowerCase() === c.toLowerCase() || p2.toLowerCase().includes(c.toLowerCase())
      );

      if (p1IsComposer) {
        artist = p1;
        title = parts.slice(1).join(' - ');
      } else if (p2IsComposer) {
        title = p1;
        artist = p2;
      } else {
        // Default standard convention: "Artist - Title"
        artist = p1;
        title = parts.slice(1).join(' - ');
      }
      return { title, artist };
    }
  }

  // 3. Pattern: "Title (Artist)" or "Title [Artist]"
  const parenMatch = clean.match(/^([^(]+)\s*\(([^)]+)\)$/);
  if (parenMatch) {
    const possibleTitle = parenMatch[1].trim();
    const possibleArtist = parenMatch[2].trim();
    const isComposer = FAMOUS_COMPOSERS.some((c) =>
      possibleArtist.toLowerCase().includes(c.toLowerCase())
    );
    if (isComposer) {
      return { title: possibleTitle, artist: possibleArtist };
    }
  }

  // 4. Check for known composer in the string: e.g. "Chopin_Nocturne_Op9"
  const cleanWithSpaces = clean.replace(/_/g, ' ');
  for (const composer of FAMOUS_COMPOSERS) {
    const regex = new RegExp(`\\b${composer}\\b`, 'i');
    if (regex.test(cleanWithSpaces)) {
      artist = composer;
      title = cleanWithSpaces.replace(regex, '').replace(/^[-_\s]+|[-_\s]+$/g, '').trim();
      if (!title) title = cleanWithSpaces;
      return { title, artist };
    }
  }

  // Fallback: replace underscores with spaces
  title = clean.replace(/_/g, ' ').trim();
  return { title, artist };
}

/**
 * Parses a MIDI file (ArrayBuffer) client-side using @tonejs/midi.
 */
export async function parseMidiFile(
  data: ArrayBuffer | Uint8Array,
  fallbackTitle: string = 'Untitled Piece'
): Promise<ParsedMidiResult> {
  const midi = new Midi(data);

  // Extract BPM / Tempo
  let bpm = 120;
  if (midi.header.tempos && midi.header.tempos.length > 0) {
    const firstTempo = midi.header.tempos[0].bpm;
    if (firstTempo && firstTempo > 20 && firstTempo < 300) {
      bpm = Math.round(firstTempo);
    }
  }

  // Duration
  const duration = Math.max(1, Math.round(midi.duration * 100) / 100);

  // Auto-parse Title and Artist from MIDI Name or filename
  const midiName = midi.name?.trim();
  const rawSource = midiName && midiName.length > 2 ? midiName : fallbackTitle;
  const { title, artist } = extractTitleAndArtist(rawSource, midi.header);

  const trackCount = midi.tracks.length;
  const notesData: NoteEvent[] = [];
  let leftHandNotes = 0;
  let rightHandNotes = 0;

  // Process tracks and determine left / right hand notes
  midi.tracks.forEach((track, trackIndex) => {
    const trackNameLower = (track.name || '').toLowerCase();
    const isNamedLeft =
      trackNameLower.includes('left') ||
      trackNameLower.includes('bass') ||
      trackNameLower.includes('lh') ||
      trackNameLower.includes('hand 2') ||
      trackNameLower.includes('part 2');
    const isNamedRight =
      trackNameLower.includes('right') ||
      trackNameLower.includes('treble') ||
      trackNameLower.includes('rh') ||
      trackNameLower.includes('hand 1') ||
      trackNameLower.includes('part 1');

    track.notes.forEach((note) => {
      let hand: 'left' | 'right' = 'right';

      if (isNamedLeft) {
        hand = 'left';
      } else if (isNamedRight) {
        hand = 'right';
      } else if (midi.tracks.length > 1) {
        hand = trackIndex === 0 ? 'right' : 'left';
      } else {
        hand = note.midi < 60 ? 'left' : 'right';
      }

      if (hand === 'left') {
        leftHandNotes++;
      } else {
        rightHandNotes++;
      }

      notesData.push({
        pitch: note.name,
        midi: note.midi,
        time: Math.round(note.time * 1000) / 1000,
        duration: Math.max(0.05, Math.round(note.duration * 1000) / 1000),
        velocity: Math.round((note.velocity || 0.8) * 100) / 100,
        hand,
      });
    });
  });

  // Sort notes chronologically
  notesData.sort((a, b) => a.time - b.time);

  const totalNotes = notesData.length;
  const difficulty = calculateDifficulty(totalNotes, duration);

  return {
    title,
    artist,
    duration,
    bpm,
    trackCount,
    totalNotes,
    leftHandNotes,
    rightHandNotes,
    difficulty,
    notesData,
  };
}
