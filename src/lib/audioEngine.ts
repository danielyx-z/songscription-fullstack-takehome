import * as Tone from 'tone';
import { NoteEvent } from '@/types/song';

// Shared master audio chain (limiter + volume stage) to avoid polyphonic clipping
let masterLimiter: Tone.Limiter | null = null;
let sharedSampler: Tone.Sampler | null = null;
let sharedFallbackSynth: Tone.PolySynth | null = null;
let sharedFallbackFilter: Tone.Filter | null = null;
let samplerLoadingPromise: Promise<void> | null = null;

function getMasterLimiter(): Tone.Limiter {
  if (!masterLimiter) {
    masterLimiter = new Tone.Limiter(-2).toDestination();
  }
  return masterLimiter;
}

function initSharedPiano(): Promise<void> {
  if (samplerLoadingPromise) return samplerLoadingPromise;

  const limiter = getMasterLimiter();

  // Warm acoustic synth fallback
  if (!sharedFallbackFilter) {
    sharedFallbackFilter = new Tone.Filter({
      frequency: 2400,
      type: 'lowpass',
      rolloff: -24,
    }).connect(limiter);
  }

  if (!sharedFallbackSynth) {
    sharedFallbackSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine8' },
      envelope: { attack: 0.005, decay: 1.8, sustain: 0.1, release: 0.8 },
      volume: -8,
    }).connect(sharedFallbackFilter);
  }

  // Salamander Grand Piano sampler
  samplerLoadingPromise = new Promise<void>((resolve) => {
    sharedSampler = new Tone.Sampler({
      urls: {
        A0: 'A0.mp3', C1: 'C1.mp3', 'D#1': 'Ds1.mp3', 'F#1': 'Fs1.mp3',
        A1: 'A1.mp3', C2: 'C2.mp3', 'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3',
        A2: 'A2.mp3', C3: 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3',
        A3: 'A3.mp3', C4: 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3',
        A4: 'A4.mp3', C5: 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3',
        A5: 'A5.mp3', C6: 'C6.mp3', 'D#6': 'Ds6.mp3', 'F#6': 'Fs6.mp3',
        A6: 'A6.mp3', C7: 'C7.mp3', 'D#7': 'Ds7.mp3', 'F#7': 'Fs7.mp3',
        A7: 'A7.mp3', C8: 'C8.mp3',
      },
      volume: -4,
      release: 1.2,
      baseUrl: 'https://tonejs.github.io/audio/salamander/',
      onload: () => resolve(),
    }).connect(limiter);
  });

  return samplerLoadingPromise;
}

function triggerNote(pitch: string, dur: number, time: number, vel: number) {
  if (sharedSampler && sharedSampler.loaded) {
    sharedSampler.triggerAttackRelease(pitch, dur, time, vel);
  } else if (sharedFallbackSynth) {
    sharedFallbackSynth.triggerAttackRelease(pitch, dur, time, vel);
  }
}

export class AudioEngine {
  private isPlaying: boolean = false;
  private notes: NoteEvent[] = [];
  private duration: number = 0;
  // songPosition is always in *song-seconds* (unscaled). This is what we
  // use to seek into the note array and report progress to the UI.
  private songPosition: number = 0;
  private tempoMultiplier: number = 1.0;
  private scheduledEventIds: number[] = [];
  private progressInterval: ReturnType<typeof setInterval> | null = null;
  private onProgressCallback?: (time: number, isFinished: boolean) => void;
  // Wall-clock time at which the current play segment started (Tone.now())
  private playStartedAt: number = 0;
  // songPosition at the moment play() was last called
  private songPositionAtPlayStart: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      initSharedPiano();
    }
  }

  public loadSong(notes: NoteEvent[], duration: number) {
    this.stopInternal(false);
    this.notes = notes;
    this.duration = duration;
    this.songPosition = 0;
  }

  public setProgressCallback(cb: (time: number, isFinished: boolean) => void) {
    this.onProgressCallback = cb;
  }

  // Returns the current song-seconds based on elapsed wall time + tempo
  private calcCurrentSongPosition(): number {
    if (!this.isPlaying) return this.songPosition;
    const wallElapsed = Tone.now() - this.playStartedAt;
    return this.songPositionAtPlayStart + wallElapsed * this.tempoMultiplier;
  }

  public setTempoMultiplier(speed: number) {
    const newMultiplier = Math.max(0.5, Math.min(2.0, speed));
    if (newMultiplier === this.tempoMultiplier) return;

    if (this.isPlaying) {
      // Capture exact song position before changing anything
      const snapPosition = this.calcCurrentSongPosition();
      this.songPosition = Math.max(0, Math.min(this.duration, snapPosition));
      this.tempoMultiplier = newMultiplier;
      // Restart playback from the captured position at new speed
      this.stopTransport();
      this.scheduleAndStart();
    } else {
      this.tempoMultiplier = newMultiplier;
    }
  }

  public async play() {
    if (this.isPlaying) return;
    await Tone.start();
    initSharedPiano();
    this.scheduleAndStart();
  }

  private scheduleAndStart() {
    this.clearScheduledEvents();
    this.isPlaying = true;

    // Each AudioEngine gets its own isolated Transport offset.
    // We don't touch Transport.playbackRate at all — instead we scale
    // note times ourselves so the Transport always runs at 1× real-time.
    // This means multiple AudioEngine instances don't fight over the global rate.
    Tone.Transport.cancel();
    Tone.Transport.stop();

    const startSongPos = this.songPosition;
    this.playStartedAt = Tone.now();
    this.songPositionAtPlayStart = startSongPos;

    // Schedule notes at scaled wall-clock offsets from "now"
    this.notes.forEach((n) => {
      if (n.time < startSongPos) return;
      // Convert song-seconds to wall-seconds
      const wallOffset = (n.time - startSongPos) / this.tempoMultiplier;
      const id = Tone.Transport.schedule((time) => {
        const dur = Math.max(0.08, n.duration / this.tempoMultiplier);
        const vel = Math.max(0.15, Math.min(0.9, typeof n.velocity === 'number' ? n.velocity : 0.75));
        triggerNote(n.pitch, dur, time, vel);
      }, `+${wallOffset}`);
      this.scheduledEventIds.push(id);
    });

    // Schedule end-of-song
    const remaining = (this.duration - startSongPos) / this.tempoMultiplier;
    const endId = Tone.Transport.schedule(() => {
      this.songPosition = this.duration;
      this.stopInternal(true);
    }, `+${remaining}`);
    this.scheduledEventIds.push(endId);

    Tone.Transport.start();

    if (this.progressInterval) clearInterval(this.progressInterval);
    this.progressInterval = setInterval(() => {
      const pos = this.calcCurrentSongPosition();
      this.songPosition = Math.min(pos, this.duration);
      this.onProgressCallback?.(this.songPosition, false);
    }, 40);
  }

  private stopTransport() {
    this.isPlaying = false;
    Tone.Transport.stop();
    Tone.Transport.cancel();
    this.clearScheduledEvents();
    if (sharedSampler) sharedSampler.releaseAll();
    if (sharedFallbackSynth) sharedFallbackSynth.releaseAll();
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  private stopInternal(finished: boolean) {
    const wasPlaying = this.isPlaying;
    this.stopTransport();
    if (finished) {
      this.songPosition = this.duration;
      this.onProgressCallback?.(this.duration, true);
    }
  }

  public pause() {
    if (!this.isPlaying) return;
    // Snapshot exact song position before stopping
    this.songPosition = Math.min(this.calcCurrentSongPosition(), this.duration);
    this.stopTransport();
  }

  public seek(seconds: number) {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.songPosition = Math.min(this.calcCurrentSongPosition(), this.duration);
      this.stopTransport();
    }
    this.songPosition = Math.max(0, Math.min(this.duration, seconds));
    this.onProgressCallback?.(this.songPosition, false);
    if (wasPlaying) {
      this.scheduleAndStart();
    }
  }

  public stop() {
    this.songPosition = 0;
    this.stopInternal(false);
  }

  private clearScheduledEvents() {
    this.scheduledEventIds.forEach((id) => Tone.Transport.clear(id));
    this.scheduledEventIds = [];
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTime(): number {
    return this.isPlaying ? this.calcCurrentSongPosition() : this.songPosition;
  }

  public destroy() {
    this.stop();
  }
}