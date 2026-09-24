'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Song } from '@/types/song';
import { AudioEngine } from '@/lib/audioEngine';
import { updateSongInSupabase } from '@/lib/api';
import {
  Play,
  Pause,
  RotateCcw,
  Calendar,
  Download,
  Check,
  Edit2,
  Minus,
  Plus,
} from 'lucide-react';

interface SongDetailPanelProps {
  song: Song | null;
  onClose: () => void;
  onSongUpdated: (updatedSong: Song) => void;
}

export const SongDetailPanel: React.FC<SongDetailPanelProps> = ({
  song,
  onClose,
  onSongUpdated,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // BPM Control (stepper by 5 BPM)
  const [currentBpm, setCurrentBpm] = useState(song?.bpm || 120);

  // Editable Title & Artist inline (ONLY for private library songs)
  const [editableTitle, setEditableTitle] = useState(song?.title || '');
  const [editableArtist, setEditableArtist] = useState(song?.artist || '');
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  const audioEngineRef = useRef<AudioEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (song) {
      setEditableTitle(song.title);
      setEditableArtist(song.artist);
      setCurrentBpm(song.bpm || 120);
    }
  }, [song]);

  useEffect(() => {
    if (!song) return;

    const engine = new AudioEngine();
    audioEngineRef.current = engine;

    if (song.notesData) {
      engine.loadSong(song.notesData, song.duration);
    }

    engine.setProgressCallback((time, isFinished) => {
      setCurrentTime(time);
      if (isFinished) {
        setIsPlaying(false);
      }
    });

    return () => {
      engine.destroy();
      audioEngineRef.current = null;
    };
  }, [song]);

  // High-contrast clean piano roll canvas
  useEffect(() => {
    if (!song || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth || 500;
    const height = 120;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0d1527';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let y = 20; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const notes = song.notesData || [];
    const songDuration = Math.max(1, song.duration);

    if (notes.length > 0) {
      let minPitch = 127;
      let maxPitch = 0;
      notes.forEach((n) => {
        if (n.midi < minPitch) minPitch = n.midi;
        if (n.midi > maxPitch) maxPitch = n.midi;
      });

      const pitchPadding = 3;
      minPitch = Math.max(21, minPitch - pitchPadding);
      maxPitch = Math.min(108, maxPitch + pitchPadding);
      const pitchRange = Math.max(12, maxPitch - minPitch);

      notes.forEach((n) => {
        const x = (n.time / songDuration) * width;
        const w = Math.max(2.5, (n.duration / songDuration) * width);
        const normPitch = (n.midi - minPitch) / pitchRange;
        const y = height - normPitch * (height - 12) - 10;
        const h = Math.max(2.5, Math.min(5, (height / pitchRange) * 1.3));

        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(x, y, w, h);
      });
    }

    // Playhead line
    const playheadX = (currentTime / songDuration) * width;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
  }, [song, currentTime]);

  if (!song) return null;

  // Auto-save on blur or when pressing Enter (disabled for public songs)
  const handleAutoSave = async () => {
    if (song.isPublic) return;
    if (!editableTitle.trim()) return;
    const finalTitle = editableTitle.trim();
    const finalArtist = editableArtist.trim() || 'Unknown Artist';

    if (finalTitle === song.title && finalArtist === song.artist) return;

    const updatedSong: Song = {
      ...song,
      title: finalTitle,
      artist: finalArtist,
    };

    await updateSongInSupabase(song.id, { title: finalTitle, artist: finalArtist });
    onSongUpdated(updatedSong);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2000);
  };

  // Adjust BPM in increments of 5
  const handleAdjustBpm = (delta: number) => {
    const originalBpm = song.bpm || 120;
    const nextBpm = Math.max(30, Math.min(300, currentBpm + delta));
    setCurrentBpm(nextBpm);

    const multiplier = nextBpm / originalBpm;
    audioEngineRef.current?.setTempoMultiplier(multiplier);
  };

  const handleResetBpm = () => {
    const originalBpm = song.bpm || 120;
    setCurrentBpm(originalBpm);
    audioEngineRef.current?.setTempoMultiplier(1.0);
  };

  const togglePlayPause = async () => {
    const engine = audioEngineRef.current;
    if (!engine) return;

    if (isPlaying) {
      engine.pause();
      setIsPlaying(false);
    } else {
      const originalBpm = song.bpm || 120;
      engine.setTempoMultiplier(currentBpm / originalBpm);
      await engine.play();
      setIsPlaying(true);
    }
  };

  const handleScrub = (seconds: number) => {
    setCurrentTime(seconds);
    audioEngineRef.current?.seek(seconds);
  };

  const formatSeconds = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.floor(totalSecs % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isBpmModified = currentBpm !== (song.bpm || 120);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-fadeIn cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-full max-w-xl flex-col bg-[#131b2e] border-l border-slate-700 shadow-2xl overflow-y-auto cursor-default text-white"
      >
        {/* Floating save toast. No header bar - click outside the panel to close. */}
        <div
          className={`pointer-events-none fixed top-4 right-4 z-30 transition-all duration-300 ${
            isSavedRecently ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
          }`}
        >
          <span className="flex items-center gap-1.5 rounded-xl border border-brand/30 bg-[#131b2e]/95 px-3 py-1.5 text-xs font-semibold text-brand shadow-lg backdrop-blur-md">
            <Check className="h-3.5 w-3.5" /> Details saved
          </span>
        </div>

        {/* Content */}
        <div className="p-6 pt-8 space-y-6">
          {/* Title & Artist - Editable ONLY if not public; static clean typography if public */}
          <div className="space-y-1">
            {!song.isPublic ? (
              <>
                <div className="group/title relative flex items-center">
                  <input
                    type="text"
                    value={editableTitle}
                    onChange={(e) => setEditableTitle(e.target.value)}
                    onBlur={handleAutoSave}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    placeholder="Song Title"
                    title="Click to edit title"
                    className="w-full text-2xl font-bold text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-brand focus:bg-slate-900/40 rounded-lg px-2 py-1 -ml-2 transition-all focus:outline-none"
                  />
                  <Edit2 className="h-4 w-4 text-slate-500 opacity-30 group-hover/title:opacity-100 transition-opacity pointer-events-none -ml-6" />
                </div>

                <div className="group/artist relative flex items-center">
                  <input
                    type="text"
                    value={editableArtist}
                    onChange={(e) => setEditableArtist(e.target.value)}
                    onBlur={handleAutoSave}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    placeholder="Artist or Composer"
                    title="Click to edit artist"
                    className="w-full text-sm font-medium text-slate-300 bg-transparent border-b border-transparent hover:border-slate-600 focus:border-brand focus:bg-slate-900/40 rounded-lg px-2 py-0.5 -ml-2 transition-all focus:outline-none"
                  />
                  <Edit2 className="h-3.5 w-3.5 text-slate-500 opacity-30 group-hover/artist:opacity-100 transition-opacity pointer-events-none -ml-6" />
                </div>
              </>
            ) : (
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">{song.title}</h1>
                <p className="text-sm font-medium text-slate-300 mt-1">{song.artist}</p>
                <p className="text-xs font-semibold text-slate-500 mt-2">Public Piece</p>
              </div>
            )}
          </div>

          {/* Quick Metrics Bar including Difficulty badge */}
          <div className="grid grid-cols-4 gap-2.5">
            <div className="rounded-xl bg-slate-950/70 border border-slate-700 p-3">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Difficulty</span>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-bold ${
                  song.difficulty === 'Beginner'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : song.difficulty === 'Intermediate'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {song.difficulty}
              </span>
            </div>
            <div className="rounded-xl bg-slate-950/70 border border-slate-700 p-3">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Tempo</span>
              <span className="text-sm font-bold text-white mt-1 block">{song.bpm} BPM</span>
            </div>
            <div className="rounded-xl bg-slate-950/70 border border-slate-700 p-3">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Duration</span>
              <span className="text-sm font-bold text-white mt-1 block">
                {formatSeconds(song.duration)}
              </span>
            </div>
            <div className="rounded-xl bg-slate-950/70 border border-slate-700 p-3">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Notes</span>
              <span className="text-sm font-bold text-white mt-1 block">{song.totalNotes}</span>
            </div>
          </div>

          {/* Synthesizer Audio Preview */}
          <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Audio Preview
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {formatSeconds(currentTime)} / {formatSeconds(song.duration)}
              </span>
            </div>

            {/* Piano Roll Preview */}
            <div className="relative rounded-xl overflow-hidden border border-slate-700">
              <canvas
                ref={canvasRef}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const ratio = clickX / rect.width;
                  handleScrub(ratio * song.duration);
                }}
                className="w-full h-[120px] cursor-pointer"
                title="Click anywhere to scrub playback"
              />
            </div>

            {/* Scrub Slider */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={song.duration || 1}
                step={0.1}
                value={currentTime}
                onChange={(e) => handleScrub(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#28ba90]"
              />
            </div>

            {/* Audio Controls Toolbar with BPM increment/decrement stepper by 5 BPM */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlayPause}
                  className="flex items-center gap-2 rounded-xl bg-[#28ba90] px-4 py-2 text-xs font-bold text-slate-950 hover:bg-[#22a07c] active:scale-95 transition-all shadow-md shadow-[#28ba90]/20"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" /> Play
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleScrub(0)}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:text-white transition-colors"
                  title="Restart from beginning"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              {/* BPM Stepper Controls - reset slot is always present (just hidden) so width never shifts */}
              <div className="flex items-center gap-1.5 bg-slate-900 rounded-xl p-1 border border-slate-700">
                <button
                  onClick={() => handleAdjustBpm(-5)}
                  className="h-7 w-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
                  title="Decrease 5 BPM"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>

                <div className="px-2 text-xs font-bold text-white min-w-[70px] text-center">
                  <span>{currentBpm} BPM</span>
                </div>

                <button
                  onClick={() => handleAdjustBpm(5)}
                  className="h-7 w-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
                  title="Increase 5 BPM"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={handleResetBpm}
                  disabled={!isBpmModified}
                  aria-hidden={!isBpmModified}
                  tabIndex={isBpmModified ? 0 : -1}
                  className={`text-[10px] px-1.5 py-1 text-slate-400 hover:text-white transition-opacity ${
                    isBpmModified ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                  title="Reset to default BPM"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

{/* Practice Session */}
          <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Practice Session
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {}}
                className="flex-1 rounded-xl bg-[#28ba90] px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-[#28ba90]/20 hover:bg-[#22a07c] transition-colors"
              >
                Button to lead user to practice page
              </button>

              {song.midiUrl && (
                <a
                  href={song.midiUrl}
                  download={`${song.title.replace(/\s+/g, '_')}.mid`}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>MIDI</span>
                </a>
              )}
            </div>
          </div>
          {/* Practice History & Accuracy */}
          <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Practice History &amp; Accuracy
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {song.practiceHistory?.length || 0} Sessions
              </span>
            </div>

            {song.practiceHistory && song.practiceHistory.length > 0 ? (
              <div className="space-y-2">
                {song.practiceHistory.slice(-4).reverse().map((session, i) => (
                  <div
                    key={session.id || i}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-700/80 text-xs"
                  >
                    <div className="flex items-center gap-2 text-slate-300 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{new Date(session.date).toLocaleDateString()}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400">
                        {Math.round(session.durationSeconds / 60)} mins
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400">{session.tempoMultiplier}x</span>
                    </div>

                    <div className="font-bold text-[#28ba90]">
                      <span>{session.accuracyPercent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400 font-medium">
                No practice sessions recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};