'use client';

import React, { useEffect, useRef } from 'react';
import { NoteEvent } from '@/types/song';

interface MidiCanvasThumbnailProps {
  notes?: NoteEvent[];
  duration: number;
  width?: number;
  height?: number;
  className?: string;
  playheadPosition?: number;
}

export const MidiCanvasThumbnail: React.FC<MidiCanvasThumbnailProps> = ({
  notes = [],
  duration,
  width = 280,
  height = 50,
  className = '',
  playheadPosition,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // High contrast canvas background
    ctx.fillStyle = '#0d1527';
    ctx.fillRect(0, 0, width, height);

    // Subtle horizontal staff / piano roll grid guidelines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const gridStep = Math.max(8, height / 5);
    for (let y = gridStep; y < height; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const songDuration = Math.max(1, duration);

    // Subtle, elegant soft slate-blue / sky notes (subtler than #28ba90 accent color)
    if (notes && notes.length > 0) {
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
        const noteW = Math.max(2.5, (n.duration / songDuration) * width);
        const normPitch = (n.midi - minPitch) / pitchRange;
        const y = height - normPitch * (height - 8) - 5;
        const noteH = Math.max(2.5, Math.min(4.5, (height / pitchRange) * 1.5));

        // Neutral soft tones (non-vibrant)
        ctx.fillStyle = n.hand === 'left' ? '#94a3b8' : '#cbd5e1';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, noteW, noteH, 1.5);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, noteW, noteH);
        }
      });
    } else {
      // Fallback: render realistic piano roll notes pattern in neutral tones
      const pseudoNotesCount = Math.min(40, Math.floor(width / 7));
      for (let i = 0; i < pseudoNotesCount; i++) {
        const x = (i / pseudoNotesCount) * width;
        const noteW = Math.max(3, (width / pseudoNotesCount) * 0.7);
        const pitchNorm = (Math.sin(i * 1.2) * 0.5 + 0.5) * 0.7 + 0.15;
        const y = height - pitchNorm * (height - 8) - 4;
        const noteH = 3;

        ctx.fillStyle = i % 2 === 0 ? '#94a3b8' : '#cbd5e1';
        ctx.fillRect(x, y, noteW, noteH);
      }
    }

    // Playhead indicator if present
    if (playheadPosition !== undefined && playheadPosition >= 0) {
      const playheadX = (playheadPosition / songDuration) * width;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
    }
  }, [notes, duration, width, height, playheadPosition]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${width}px`, height: `${height}px` }}
      className={`rounded-lg overflow-hidden border border-slate-700/80 shadow-inner ${className}`}
    />
  );
};
