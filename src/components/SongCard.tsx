'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Song, DifficultyLevel, Collection } from '@/types/song';
import { MidiCanvasThumbnail } from './MidiCanvasThumbnail';
import {
  Play,
  Pause,
  Heart,
  MoreVertical,
  Edit2,
  Trash2,
  FolderPlus,
  BarChart2,
  Check,
  Plus,
  Calendar,
} from 'lucide-react';

interface SongCardProps {
  song: Song;
  isPublicView?: boolean;
  isAlreadyInLibrary?: boolean;
  collections?: Collection[];
  onOpenDetail: (song: Song) => void;
  onToggleFavorite?: (id: string, current: boolean) => void;
  onDelete?: (id: string) => void;
  onAddToLibrary?: (song: Song) => void;
  onUpdateTitleArtist?: (id: string, title: string, artist: string) => void;
  onChangeDifficulty?: (id: string, difficulty: DifficultyLevel) => void;
  onAssignCollection?: (songId: string, collectionId: string | null) => void;
  onCreateCollection?: (name: string) => Promise<void>;
  isPlayingPreview?: boolean;
  onTogglePreview?: (song: Song) => void;
}

export const SongCard: React.FC<SongCardProps> = ({
  song,
  isPublicView = false,
  isAlreadyInLibrary = false,
  collections = [],
  onOpenDetail,
  onToggleFavorite,
  onDelete,
  onAddToLibrary,
  onUpdateTitleArtist,
  onChangeDifficulty,
  onAssignCollection,
  onCreateCollection,
  isPlayingPreview = false,
  onTogglePreview,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist);
  const [showDifficultySubmenu, setShowDifficultySubmenu] = useState(false);
  const [showCollectionSubmenu, setShowCollectionSubmenu] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setShowDifficultySubmenu(false);
        setShowCollectionSubmenu(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const handleSaveEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isPublicView) return; // Do not edit public songs
    if (!title.trim() || !onUpdateTitleArtist) return;
    onUpdateTitleArtist(song.id, title.trim(), artist.trim() || 'Unknown Artist');
    setIsEditing(false);
  };

  const handleSelectDifficulty = (diff: DifficultyLevel) => {
    if (isPublicView) return; // Do not edit public songs
    if (onChangeDifficulty) {
      onChangeDifficulty(song.id, diff);
    }
    setShowDifficultySubmenu(false);
    setMenuOpen(false);
  };

  const handleSelectCollection = (colId: string | null) => {
    if (onAssignCollection) {
      onAssignCollection(song.id, colId);
    }
    setShowCollectionSubmenu(false);
    setMenuOpen(false);
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim() || !onCreateCollection) return;
    await onCreateCollection(newCollectionName.trim());
    setNewCollectionName('');
  };

  const assignedCollection = collections.find((c) => c.id === song.collectionId);

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-700/80 bg-[#131b2e] p-5 shadow-xl transition-all duration-200 hover:border-slate-600 hover:bg-[#18233b]">
      <div>
        {/* Practice Preview with MIDI Canvas Underneath and Translucent Blur + Play Icon on Hover */}
        <div
          onClick={() => onOpenDetail(song)}
          className="relative group/canvas cursor-pointer rounded-xl overflow-hidden border border-slate-700 hover:border-[#28ba90] transition-all shadow-md h-36 bg-[#0c1322] flex items-center justify-center"
          title="Practice Song"
        >
          {/* Subtle MIDI Notes Canvas Thumbnail */}
          <MidiCanvasThumbnail
            notes={song.notesData}
            duration={song.duration}
            width={340}
            height={144}
            className="w-full h-full border-none rounded-none"
          />

          {/* Badges on preview */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10 pointer-events-none">
            {assignedCollection && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-900/90 border border-[#28ba90]/40 text-[#28ba90]">
                {assignedCollection.name}
              </span>
            )}
            {isPublicView && song.isTrending && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#28ba90] text-slate-950 shadow">
                Trending
              </span>
            )}
          </div>

          <div className="absolute bottom-2.5 right-2.5 z-10 pointer-events-none">
            <span
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold shadow ${
                song.difficulty === 'Beginner'
                  ? 'bg-emerald-500 text-slate-950'
                  : song.difficulty === 'Intermediate'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-rose-500 text-white'
              }`}
            >
              {song.difficulty}
            </span>
          </div>

          {/* Translucent overlay that turns blurrier with Play Icon on hover, NO practice word */}
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 backdrop-blur-[0.5px] group-hover/canvas:backdrop-blur-sm group-hover/canvas:bg-slate-950/40 transition-all duration-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#28ba90] text-slate-950 shadow-xl transform scale-90 group-hover/canvas:scale-110 transition-all">
              <Play className="h-5 w-5 fill-slate-950 ml-0.5" />
            </div>
          </div>
        </div>

        {/* Title, Artist, & Options */}
        <div className="mt-4 flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {!isPublicView && isEditing ? (
              <form onSubmit={handleSaveEdit} className="space-y-2 mb-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Song Title"
                  className="w-full rounded-lg border border-[#28ba90] bg-slate-950 px-2.5 py-1 text-sm font-semibold text-white focus:outline-none"
                  autoFocus
                />
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Artist"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                />
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="submit"
                    className="flex items-center gap-1 rounded bg-[#28ba90] text-slate-950 px-2.5 py-0.5 text-xs font-semibold hover:bg-[#22a07c]"
                  >
                    <Check className="h-3 w-3" /> Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div onClick={() => onOpenDetail(song)} className="cursor-pointer">
                <h3 className="truncate text-base font-bold text-white transition-colors group-hover:text-[#28ba90] leading-snug">
                  {song.title}
                </h3>
                <div className="text-xs font-medium text-slate-300 mt-1 truncate">
                  {song.artist}
                </div>
              </div>
            )}
          </div>

          {/* Three dots dropdown menu button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:border-[#28ba90] transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 rounded-2xl border border-slate-700 bg-[#162033] shadow-2xl p-1.5 z-50 text-left text-xs backdrop-blur-xl">
                {onTogglePreview && (
                  <button
                    onClick={() => {
                      onTogglePreview(song);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    {isPlayingPreview ? (
                      <>
                        <Pause className="h-3.5 w-3.5 text-[#28ba90]" />
                        <span>Pause audio</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 text-[#28ba90] fill-current" />
                        <span>Preview audio</span>
                      </>
                    )}
                  </button>
                )}

                {/* Edit options ONLY for personal library songs */}
                {!isPublicView && onUpdateTitleArtist && (
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>Edit song name</span>
                  </button>
                )}

                {/* Change Difficulty ONLY for personal library songs */}
                {!isPublicView && (
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowDifficultySubmenu((prev) => !prev);
                        setShowCollectionSubmenu(false);
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <BarChart2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>Change difficulty</span>
                      </div>
                      <span className="text-[10px] font-semibold text-[#28ba90]">{song.difficulty}</span>
                    </button>

                    {showDifficultySubmenu && (
                      <div className="my-1 rounded-xl bg-slate-950 border border-slate-700 p-1 space-y-0.5">
                        {(['Beginner', 'Intermediate', 'Advanced'] as DifficultyLevel[]).map((d) => (
                          <button
                            key={d}
                            onClick={() => handleSelectDifficulty(d)}
                            className={`flex w-full items-center justify-between px-2 py-1 rounded text-xs ${
                              song.difficulty === d
                                ? 'bg-[#28ba90]/20 text-[#28ba90] font-bold'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <span>{d}</span>
                            {song.difficulty === d && <Check className="h-3 w-3" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Add to Collection */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowCollectionSubmenu((prev) => !prev);
                      setShowDifficultySubmenu(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FolderPlus className="h-3.5 w-3.5 text-slate-400" />
                      <span>Add to collection</span>
                    </div>
                    {assignedCollection && (
                      <span className="text-[10px] text-[#28ba90] truncate max-w-[60px]">
                        {assignedCollection.name}
                      </span>
                    )}
                  </button>

                  {showCollectionSubmenu && (
                    <div className="my-1 rounded-xl bg-slate-950 border border-slate-700 p-1.5 space-y-1">
                      <button
                        onClick={() => handleSelectCollection(null)}
                        className={`flex w-full items-center justify-between px-2 py-1 rounded text-xs ${
                          !song.collectionId ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>None</span>
                        {!song.collectionId && <Check className="h-3 w-3" />}
                      </button>
                      {collections.map((col) => (
                        <button
                          key={col.id}
                          onClick={() => handleSelectCollection(col.id)}
                          className={`flex w-full items-center justify-between px-2 py-1 rounded text-xs ${
                            song.collectionId === col.id
                              ? 'bg-[#28ba90]/20 text-[#28ba90] font-semibold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span className="truncate">{col.name}</span>
                          {song.collectionId === col.id && <Check className="h-3 w-3" />}
                        </button>
                      ))}
                      {onCreateCollection && (
                        <form onSubmit={handleCreateCollection} className="pt-1.5 border-t border-slate-800">
                          <input
                            type="text"
                            placeholder="New collection..."
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-white"
                          />
                        </form>
                      )}
                    </div>
                  )}
                </div>

                {/* Delete option ONLY for personal library songs */}
                {!isPublicView && onDelete && (
                  <div className="border-t border-slate-700/80 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(song.id);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-rose-400 hover:bg-rose-500/15 transition-colors font-medium"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Real specs row */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">BPM</span>
            <span className="font-semibold text-white">{song.bpm}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Duration</span>
            <span className="font-semibold text-white">{formatDuration(song.duration)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Notes</span>
            <span className="font-semibold text-white">{song.totalNotes}</span>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="mt-4 pt-3 border-t border-slate-700/80 flex items-center justify-between gap-2">
        {!isPublicView && onToggleFavorite ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleFavorite(song.id, song.isFavorite)}
              className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                song.isFavorite ? 'text-rose-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Heart className={`h-4 w-4 ${song.isFavorite ? 'fill-rose-500' : ''}`} />
              <span>{song.isFavorite ? 'Favorited' : 'Favorite'}</span>
            </button>

            {song.createdAt && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-500" />
                <span>{formatDate(song.createdAt)}</span>
              </span>
            )}
          </div>
        ) : isPublicView && onAddToLibrary ? (
          <button
            onClick={() => onAddToLibrary(song)}
            disabled={isAlreadyInLibrary}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              isAlreadyInLibrary
                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                : 'bg-[#28ba90] text-slate-950 hover:bg-[#22a07c] shadow-md shadow-[#28ba90]/20'
            }`}
          >
            {isAlreadyInLibrary ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            <span>{isAlreadyInLibrary ? 'In Library' : 'Add to Library'}</span>
          </button>
        ) : null}

        <span className="text-xs text-slate-400 font-medium">
          {song.difficulty}
        </span>
      </div>
    </div>
  );
};
