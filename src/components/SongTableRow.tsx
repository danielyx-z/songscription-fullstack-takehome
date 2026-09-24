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
  FolderMinus,
  BarChart2,
  Check,
  Plus,
  Calendar,
} from 'lucide-react';

interface SongTableRowProps {
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

export const SongTableRow: React.FC<SongTableRowProps> = ({
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
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(song.title);
  const [editedArtist, setEditedArtist] = useState(song.artist);

  const [showDifficultySubmenu, setShowDifficultySubmenu] = useState(false);
  const [showCollectionSubmenu, setShowCollectionSubmenu] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isEditingTitle) {
      setEditedTitle(song.title);
      setEditedArtist(song.artist);
    }
  }, [song.title, song.artist, isEditingTitle]);

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (menuOpen) {
      setMenuOpen(false);
      setShowDifficultySubmenu(false);
      setShowCollectionSubmenu(false);
    } else if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 6,
        right: Math.max(16, window.innerWidth - rect.right),
      });
      setMenuOpen(true);
    }
  };

  const handleSaveEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isPublicView) {
      setIsEditingTitle(false);
      return;
    }
    const trimmedTitle = editedTitle.trim();
    if (trimmedTitle && onUpdateTitleArtist) {
      onUpdateTitleArtist(song.id, trimmedTitle, editedArtist.trim() || 'Unknown Artist');
    } else {
      setEditedTitle(song.title);
      setEditedArtist(song.artist);
    }
    setIsEditingTitle(false);
  };

  // Dropdown menu: click outside closes it
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setMenuOpen(false);
        setShowDifficultySubmenu(false);
        setShowCollectionSubmenu(false);
      }
    };

    const handleScroll = () => {
      setMenuOpen(false);
      setShowDifficultySubmenu(false);
      setShowCollectionSubmenu(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [menuOpen]);

  // Title/artist edit: click outside saves instead of requiring a button
  useEffect(() => {
    if (!isEditingTitle) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (editFormRef.current && !editFormRef.current.contains(target)) {
        handleSaveEdit();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditedTitle(song.title);
        setEditedArtist(song.artist);
        setIsEditingTitle(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditingTitle, editedTitle, editedArtist]);

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

  const handleSelectDifficulty = (diff: DifficultyLevel) => {
    if (isPublicView) return;
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
    setIsCreatingCollection(true);
    await onCreateCollection(newCollectionName.trim());
    setNewCollectionName('');
    setIsCreatingCollection(false);
  };

  const assignedCollection = collections.find((c) => c.id === song.collectionId);

  return (
    <tr className="group relative border-b border-slate-800/70 bg-[#131b2e]/60 hover:bg-[#1a233a] transition-colors">
      {/* subtle accent bar on hover */}
      <td className="p-0 w-0">
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-brand/0 via-brand/70 to-brand/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </td>

      {/* Practice thumbnail */}
      <td className="py-3 pl-6 pr-3 w-28">
        <div
          onClick={() => onOpenDetail(song)}
          className="relative group/preview cursor-pointer rounded-lg overflow-hidden border border-slate-700/80 hover:border-brand/70 transition-all shadow-sm hover:shadow-brand/10 h-11 w-20 bg-[#0c1322] flex items-center justify-center"
          title="Practice Song"
        >
          <MidiCanvasThumbnail
            notes={song.notesData}
            duration={song.duration}
            width={80}
            height={44}
            className="w-full h-full border-none rounded-none"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 backdrop-blur-[0.5px] group-hover/preview:backdrop-blur-sm group-hover/preview:bg-slate-950/40 transition-all duration-200">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/30 transform scale-90 group-hover/preview:scale-105 transition-all">
              <Play className="h-3.5 w-3.5 fill-white text-white ml-0.5" />
            </div>
          </div>
        </div>
      </td>

      {/* Title & Artist */}
      <td className="py-3 px-3 min-w-[220px] max-w-xs">
        {!isPublicView && isEditingTitle ? (
          <form ref={editFormRef} onSubmit={handleSaveEdit} className="space-y-1">
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              placeholder="Song Title"
              className="w-full rounded-lg bg-slate-950 border border-brand px-2.5 py-1 text-xs text-white focus:outline-none"
              autoFocus
              onFocus={(e) => e.target.select()}
            />
            <input
              type="text"
              value={editedArtist}
              onChange={(e) => setEditedArtist(e.target.value)}
              placeholder="Artist"
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1 text-[11px] text-slate-300 focus:outline-none"
            />
          </form>
        ) : (
          <div onClick={() => onOpenDetail(song)} className="cursor-pointer group/title">
            <div className="flex items-center gap-1.5">
              {!isPublicView && onToggleFavorite && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(song.id, song.isFavorite);
                  }}
                  className={`shrink-0 rounded-md p-0.5 transition-all ${
                    song.isFavorite
                      ? 'text-rose-500 scale-105'
                      : 'text-slate-500 hover:text-rose-400 hover:scale-105'
                  }`}
                  title={song.isFavorite ? 'Remove favorite' : 'Add favorite'}
                >
                  <Heart className={`h-3.5 w-3.5 transition-all ${song.isFavorite ? 'fill-rose-500' : ''}`} />
                </button>
              )}
              <span className="font-bold text-sm text-white group-hover/title:text-brand transition-colors truncate">
                {song.title}
              </span>
              {assignedCollection && (
                <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-brand/20 to-brand/10 border border-brand/30 text-brand font-medium">
                  {assignedCollection.name}
                </span>
              )}
              {!isPublicView && onUpdateTitleArtist && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingTitle(true);
                  }}
                  className="shrink-0 rounded-md p-0.5 text-slate-500 opacity-0 group-hover/title:opacity-100 hover:text-white transition-all"
                  title="Edit song name"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="text-xs text-slate-400 font-medium truncate mt-0.5">{song.artist}</div>
          </div>
        )}
      </td>

      {/* Difficulty */}
      <td className="py-3 px-3 text-xs whitespace-nowrap">
        <span
          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
            song.difficulty === 'Beginner'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : song.difficulty === 'Intermediate'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
          }`}
        >
          {song.difficulty}
        </span>
      </td>

      {/* BPM & Duration */}
      <td className="py-3 px-3 text-xs text-slate-200 whitespace-nowrap font-medium">
        <div>{song.bpm} BPM</div>
        <div className="text-slate-400 font-normal">{formatDuration(song.duration)}</div>
      </td>

      {/* Accuracy / date added, or Public badge */}
      <td className="py-3 px-3 text-xs whitespace-nowrap">
        {!isPublicView ? (
          <div>
            <div className="font-semibold text-slate-200">
              {song.averageAccuracy > 0 ? `${Math.round(song.averageAccuracy)}% acc` : '--'}
            </div>
            {song.createdAt && (
              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <Calendar className="h-3 w-3 text-slate-600 shrink-0" />
                <span>{formatDate(song.createdAt)}</span>
              </div>
            )}
          </div>
        ) : (
          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-medium">
            Public
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="py-3 pl-3 pr-6 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-2">
          {isPublicView && onAddToLibrary && (
            <button
              onClick={() => onAddToLibrary(song)}
              disabled={isAlreadyInLibrary}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                isAlreadyInLibrary
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-default'
                  : 'bg-brand text-white hover:bg-brand-hover shadow-md shadow-brand/20'
              }`}
              title={isAlreadyInLibrary ? 'Already in your library' : 'Add to your library'}
            >
              {isAlreadyInLibrary ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Added
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" /> Add
                </>
              )}
            </button>
          )}

          <button
            ref={buttonRef}
            onClick={handleToggleMenu}
            className={`p-1.5 rounded-lg border transition-colors ${
              menuOpen
                ? 'bg-slate-800 border-brand text-white'
                : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-800'
            }`}
            title="More options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>

        {menuOpen && menuPosition && (
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: `${menuPosition.top}px`,
              right: `${menuPosition.right}px`,
              zIndex: 9999,
            }}
            className="w-56 rounded-2xl border border-slate-700/80 bg-[#162033] shadow-2xl ring-1 ring-black/20 p-1.5 text-left text-xs backdrop-blur-xl animate-fadeIn divide-y divide-slate-800/70"
          >
            <div className="pb-1.5">
              {onTogglePreview && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePreview(song);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-200 hover:bg-slate-800/80 hover:text-white transition-colors"
                >
                  {isPlayingPreview ? (
                    <>
                      <Pause className="h-4 w-4 text-brand" />
                      <span className="font-medium">Pause audio preview</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 text-brand fill-current" />
                      <span className="font-medium">Play audio preview</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {!isPublicView && (
              <div className="py-1.5 space-y-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingTitle(true);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-200 hover:bg-slate-800/80 hover:text-white transition-colors"
                >
                  <Edit2 className="h-4 w-4 text-slate-400" />
                  <span>Edit song name</span>
                </button>

                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDifficultySubmenu((prev) => !prev);
                      setShowCollectionSubmenu(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-slate-200 hover:bg-slate-800/80 hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <BarChart2 className="h-4 w-4 text-slate-400" />
                      <span>Change difficulty</span>
                    </div>
                    <span className="text-[11px] font-semibold text-brand">{song.difficulty}</span>
                  </button>

                  {showDifficultySubmenu && (
                    <div className="my-1 rounded-xl bg-slate-950/80 border border-slate-800 p-1.5 space-y-1">
                      {(['Beginner', 'Intermediate', 'Advanced'] as DifficultyLevel[]).map((d) => (
                        <button
                          key={d}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectDifficulty(d);
                          }}
                          className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                            song.difficulty === d
                              ? 'bg-brand/20 text-brand font-bold'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <span>{d}</span>
                          {song.difficulty === d && <Check className="h-3.5 w-3.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Collection actions */}
            <div className="py-1.5 space-y-0.5">
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCollectionSubmenu((prev) => !prev);
                    setShowDifficultySubmenu(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-200 hover:bg-slate-800/80 hover:text-white transition-colors"
                >
                  <FolderPlus className="h-4 w-4 text-slate-400" />
                  <span>Add to collection</span>
                </button>

                {showCollectionSubmenu && (
                  <div className="my-1 rounded-xl bg-slate-950/80 border border-slate-800 p-2 space-y-1">
                    {assignedCollection && (
                      <div className="text-[10px] text-slate-500 px-1 pb-1">
                        Currently in{' '}
                        <span className="text-brand font-medium">{assignedCollection.name}</span>
                      </div>
                    )}
                    <div className="text-[10px] font-semibold text-slate-500 px-1 py-0.5 uppercase tracking-wide">
                      Select collection
                    </div>

                    {collections.map((col) => (
                      <button
                        key={col.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCollection(col.id);
                        }}
                        className={`flex w-full items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors ${
                          song.collectionId === col.id
                            ? 'bg-brand/20 text-brand font-semibold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="truncate">{col.name}</span>
                        {song.collectionId === col.id && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}

                    {onCreateCollection && (
                      <form
                        onSubmit={(e) => {
                          e.stopPropagation();
                          handleCreateCollection(e);
                        }}
                        className="pt-2 border-t border-slate-800 mt-1"
                      >
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="New collection..."
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-brand"
                          />
                          <button
                            type="submit"
                            disabled={isCreatingCollection || !newCollectionName.trim()}
                            className="p-1 rounded-lg bg-brand hover:bg-brand-hover text-white font-bold disabled:opacity-50"
                            title="Create"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {assignedCollection && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectCollection(null);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 transition-colors"
                >
                  <FolderMinus className="h-4 w-4 text-slate-500" />
                  <span>Remove from collection</span>
                </button>
              )}
            </div>

            {!isPublicView && onDelete && (
              <div className="pt-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete(song.id);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition-colors font-medium"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete song</span>
                </button>
              </div>
            )}
          </div>
        )}
      </td>
    </tr>
  );
};