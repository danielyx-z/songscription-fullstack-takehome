import * as Tone from 'tone';
import { NoteEvent } from '@/types/song';

export class AudioEngine {
  private sampler: Tone.Sampler | null = null;
  private fallbackSynth: Tone.PolySynth | null = null;
  private fallbackFilter: Tone.Filter | null = null;
  private isPlaying: boolean = false;
  private notes: NoteEvent[] = [];
  private duration: number = 0;
  private currentTime: number = 0;
  private tempoMultiplier: number = 1.0;
  private scheduledEventIds: number[] = [];
  private progressInterval: ReturnType<typeof setInterval> | null = null;
  private onProgressCallback?: (time: number, isFinished: boolean) => void;

  constructor() {
    // Piano audio engine will initialize on user interaction
  }

  private initPiano() {
    if (this.sampler || this.fallbackSynth) return;

    // 1. High-fidelity acoustic grand piano sampler using Salamander grand piano samples
    this.sampler = new Tone.Sampler({
      urls: {
        A0: 'A0.mp3',
        C1: 'C1.mp3',
        'D#1': 'Ds1.mp3',
        'F#1': 'Fs1.mp3',
        A1: 'A1.mp3',
        C2: 'C2.mp3',
        'D#2': 'Ds2.mp3',
        'F#2': 'Fs2.mp3',
        A2: 'A2.mp3',
        C3: 'C3.mp3',
        'D#3': 'Ds3.mp3',
        'F#3': 'Fs3.mp3',
        A3: 'A3.mp3',
        C4: 'C4.mp3',
        'D#4': 'Ds4.mp3',
        'F#4': 'Fs4.mp3',
        A4: 'A4.mp3',
        C5: 'C5.mp3',
        'D#5': 'Ds5.mp3',
        'F#5': 'Fs5.mp3',
        A5: 'A5.mp3',
        C6: 'C6.mp3',
        'D#6': 'Ds6.mp3',
        'F#6': 'Fs6.mp3',
        A6: 'A6.mp3',
        C7: 'C7.mp3',
        'D#7': 'Ds7.mp3',
        'F#7': 'Fs7.mp3',
        A7: 'A7.mp3',
        C8: 'C8.mp3',
      },
      release: 1.2,
      baseUrl: 'https://tonejs.github.io/audio/salamander/',
    }).toDestination();

    // 2. Warm acoustic piano synthesizer (fallback before sampler finishes loading or if offline)
    this.fallbackFilter = new Tone.Filter({
      frequency: 2800,
      type: 'lowpass',
      rolloff: -12,
    }).toDestination();

    this.fallbackSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'sine8', // warm harmonic overtone series modeled after acoustic piano strings
      },
      envelope: {
        attack: 0.005,
        decay: 2.2,
        sustain: 0.12,
        release: 1.2,
      },
      volume: -3,
    }).connect(this.fallbackFilter);
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
    this.initPiano();

    this.isPlaying = true;
    this.clearScheduledEvents();

    Tone.Transport.bpm.value = 120;
    (Tone.Transport as any).playbackRate = this.tempoMultiplier;

    // Schedule each note using acoustic piano tone
    this.notes.forEach((n) => {
      if (n.time < this.currentTime) return;
      const id = Tone.Transport.schedule((time) => {
        const dur = Math.max(0.08, n.duration);
        const vel = typeof n.velocity === 'number' ? Math.max(0.1, Math.min(1.0, n.velocity)) : 0.8;

        if (this.sampler && this.sampler.loaded) {
          this.sampler.triggerAttackRelease(n.pitch, dur, time, vel);
        } else {
          this.fallbackSynth?.triggerAttackRelease(n.pitch, dur, time, vel);
        }
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
    if (this.sampler) {
      this.sampler.releaseAll();
    }
    if (this.fallbackSynth) {
      this.fallbackSynth.releaseAll();
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
    if (this.sampler) {
      this.sampler.releaseAll();
    }
    if (this.fallbackSynth) {
      this.fallbackSynth.releaseAll();
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
    if (this.sampler) {
      this.sampler.dispose();
      this.sampler = null;
    }
    if (this.fallbackSynth) {
      this.fallbackSynth.dispose();
      this.fallbackSynth = null;
    }
    if (this.fallbackFilter) {
      this.fallbackFilter.dispose();
      this.fallbackFilter = null;
    }
  }
}