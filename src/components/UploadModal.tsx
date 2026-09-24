'use client';

import React, { useState, useRef } from 'react';
import { parseMidiFile } from '@/lib/midiParser';
import { Song } from '@/types/song';
import { uploadMidiToStorage, saveSongToSupabase } from '@/lib/api';
import { Upload, X, Loader2 } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSongCreated: (newSong: Song) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSongCreated,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('Processing MIDI...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const processAndCreateSong = async (
    buffer: ArrayBuffer,
    fileName: string,
    fileObj?: File
  ) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setStatusText('Parsing MIDI & transcribing notes...');

      const parsed = await parseMidiFile(buffer, fileName);

      setStatusText('Saving song to library...');

      let midiUrl: string | undefined = undefined;
      const fileId = `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      if (fileObj) {
        const storagePath = `${fileId}.mid`;
        const { url } = await uploadMidiToStorage(fileObj, storagePath);
        if (url) {
          midiUrl = url;
        }
      }

      const songData: Song = {
        id: fileId,
        title: parsed.title || fileName.replace(/\.[^/.]+$/, ''),
        artist: 'Unknown Artist',
        duration: parsed.duration,
        bpm: parsed.bpm,
        trackCount: parsed.trackCount,
        totalNotes: parsed.totalNotes,
        difficulty: parsed.difficulty,
        isFavorite: false,
        inProgress: true,
        isPublic: false,
        midiUrl: midiUrl,
        notesData: parsed.notesData,
        practiceHistory: [],
        totalPracticeSeconds: 0,
        averageAccuracy: 0,
        createdAt: new Date().toISOString(),
        lastPracticedAt: null,
      };

      // Save to Supabase and immediately notify parent - 1 single stage!
      await saveSongToSupabase(songData);
      onSongCreated(songData);
      handleClose();
    } catch (err: any) {
      console.error('Error processing MIDI file:', err);
      setErrorMessage(err?.message || 'Failed to parse MIDI file. Please ensure it is a valid .mid file.');
      setIsProcessing(false);
    }
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (!file.name.toLowerCase().endsWith('.mid') && !file.name.toLowerCase().endsWith('.midi')) {
        setErrorMessage('Please upload a standard MIDI (.mid) file.');
        return;
      }
      const buffer = await file.arrayBuffer();
      await processAndCreateSong(buffer, file.name, file);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const buffer = await file.arrayBuffer();
      await processAndCreateSong(buffer, file.name, file);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    setIsProcessing(false);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-3xl border border-slate-700 bg-[#131b2e] shadow-2xl p-6 sm:p-8 cursor-default"
      >
        {/* Close Button */}
        {!isProcessing && (
          <button
            onClick={handleClose}
            className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Upload MIDI Song</h2>
          <p className="text-xs text-slate-300 mt-1">
            Drag &amp; drop a .mid file or click below to upload directly to your library.
          </p>
        </div>

        {/* Processing State */}
        {isProcessing ? (
          <div className="py-10 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/15 border border-brand/40 text-brand">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <h3 className="text-sm font-semibold text-white">{statusText}</h3>
            <p className="text-xs text-slate-400">Transcribing notes and adding to your library...</p>
          </div>
        ) : (
          /* Single Stage Upload Area */
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-brand bg-brand/10 scale-[1.01]'
                  : 'border-slate-600 bg-slate-950/70 hover:border-brand hover:bg-slate-950/90'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".mid,.midi"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/15 border border-brand/30 text-brand group-hover:scale-110 transition-transform">
                <Upload className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">
                Upload MIDI Song
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                or drag and drop .mid file
              </p>
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300 font-medium">
                {errorMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
