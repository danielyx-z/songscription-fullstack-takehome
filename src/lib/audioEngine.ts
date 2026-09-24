import * as Tone from 'tone';
import { NoteEvent } from '@/types/song';

export class AudioEngine {
  private synth: Tone.PolySynth | null = null;
  private isPlaying: boolean = false;
  private notes: NoteEvent[] = [];
  private duration: number = 0;
  private currentTime: number = 0;
  private tempoMultiplier: number = 1.0;
  private scheduledEventIds: number[] = [];
  private progressInterval: ReturnType<typeof setInterval> | null = null;
  private onProgressCallback?: (time: number, isFinished: boolean) => void;

  constructor() {
    // Synth will be initialized on first user interaction
  }

  private initSynth() {
    if (this.synth) return;
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.005,
        decay: 0.25,
        sustain: 0.3,
        release: 0.8,
      },
      volume: -6,
    }).toDestination();
  }

  public loadSong(notes: NoteEvent[], duration: number) {
    this.stop();
    this.notes = notes;
    this.duration = duration;
    this.currentTime = 0;
  }

  public setProgressCallback(cb: (time: number, isFinished: boolean) => void) {
    this.onProgressCallback = cb;
  }

  public setTempoMultiplier(speed: number) {
    const wasPlaying = this.isPlaying;
    const current = this.currentTime;
    if (wasPlaying) {
      this.pause();
    }
    this.tempoMultiplier = Math.max(0.5, Math.min(2.0, speed));
    this.currentTime = current;
    if (wasPlaying) {
      this.play();
    }
  }

  public async play() {
    if (this.isPlaying) return;
    await Tone.start();
    this.initSynth();

    this.isPlaying = true;
    this.clearScheduledEvents();

    Tone.Transport.bpm.value = 120 * this.tempoMultiplier;
    // We schedule in raw seconds regardless of bpm, so keep transport's
    // playback rate tied to tempoMultiplier instead of bpm math.
    Tone.Transport.bpm.value = 120;
    Tone.Transport.playbackRate = this.tempoMultiplier;

    // Schedule every remaining note relative to the transport's own clock,
    // so pausing/seeking cancels them cleanly via Tone.Transport.clear.
    this.notes.forEach((n) => {
      if (n.time < this.currentTime) return;
      const id = Tone.Transport.schedule((time) => {
        this.synth?.triggerAttackRelease(n.pitch, Math.max(0.08, n.duration), time, n.velocity);
      }, n.time);
      this.scheduledEventIds.push(id);
    });

    // Schedule end-of-song stop
    const endId = Tone.Transport.schedule(() => {
      this.currentTime = this.duration;
      this.stop();
      if (this.onProgressCallback) {
        this.onProgressCallback(this.duration, true);
      }
    }, this.duration);
    this.scheduledEventIds.push(endId);

    Tone.Transport.seconds = this.currentTime;
    Tone.Transport.start();

    if (this.progressInterval) clearInterval(this.progressInterval);
    this.progressInterval = setInterval(() => {
      this.currentTime = Tone.Transport.seconds;
      if (this.onProgressCallback) {
        this.onProgressCallback(this.currentTime, false);
      }
    }, 40);
  }

  public pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.currentTime = Tone.Transport.seconds;
    Tone.Transport.pause();
    this.clearScheduledEvents();
    if (this.synth) {
      this.synth.releaseAll();
    }
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  public seek(seconds: number) {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.pause();
    }
    this.currentTime = Math.max(0, Math.min(this.duration, seconds));
    if (this.onProgressCallback) {
      this.onProgressCallback(this.currentTime, false);
    }
    if (wasPlaying) {
      this.play();
    }
  }

  public stop() {
    this.isPlaying = false;
    Tone.Transport.stop();
    this.clearScheduledEvents();
    if (this.synth) {
      this.synth.releaseAll();
    }
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    this.currentTime = 0;
  }

  private clearScheduledEvents() {
    this.scheduledEventIds.forEach((id) => {
      Tone.Transport.clear(id);
    });
    this.scheduledEventIds = [];
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public destroy() {
    this.stop();
    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }
  }
}