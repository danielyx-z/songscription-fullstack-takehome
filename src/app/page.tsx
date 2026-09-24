'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Song,
  SortOption,
  FilterStatus,
  PublicFilterStatus,
  ViewMode,
  LibraryTab,
  Collection,
  DifficultyLevel,
} from '@/types/song';
import {
  getSongsFromSupabase,
  saveSongToSupabase,
  updateSongInSupabase,
  deleteSongFromSupabase,
  getCollectionsFromSupabase,
  createCollectionInSupabase,
  uploadMidiToStorage,
} from '@/lib/api';
import { parseMidiFile } from '@/lib/midiParser';
import { loadInitialSongs } from '@/lib/sampleSongs';
import { AudioEngine } from '@/lib/audioEngine';
import { Header } from '@/components/Header';
import { FiltersAndSort } from '@/components/FiltersAndSort';
import { SongCard } from '@/components/SongCard';
import { SongTableRow } from '@/components/SongTableRow';
import { Pagination } from '@/components/Pagination';
import { SongDetailPanel } from '@/components/SongDetailPanel';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { Music, Upload, Loader2 } from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]); // Zero presets
  const [isLoading, setIsLoading] = useState(true);

  // Library Tab: 'my_library' vs 'public_songs'
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('my_library');

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [publicFilterStatus, setPublicFilterStatus] = useState<PublicFilterStatus>('all');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Direct 1-stage Upload
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const directFileInputRef = useRef<HTMLInputElement | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Detail & Preview Panel
  const [selectedSongForDetail, setSelectedSongForDetail] = useState<Song | null>(null);

  // Quick Audio Preview
  const [previewPlayingSongId, setPreviewPlayingSongId] = useState<string | null>(null);
  const quickAudioEngineRef = useRef<AudioEngine | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = async () => {
    setIsLoading(true);

    // Load Collections (no presets)
    const { data: dbCollections } = await getCollectionsFromSupabase();
    if (dbCollections) {
      setCollections(dbCollections);
    }

    // Load Songs
    const { data, error } = await getSongsFromSupabase();
    if (error || !data || data.length === 0) {
      const initial = await loadInitialSongs();
      setSongs(initial);
      if (!error) {
        for (const item of initial) {
          await saveSongToSupabase(item);
        }
      }
    } else {
      setSongs(data);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();

    return () => {
      quickAudioEngineRef.current?.destroy();
      quickAudioEngineRef.current = null;
    };
  }, []);

  // Filter songs based on current library tab (My Library vs Public Songs)
  const tabSongs = useMemo(() => {
    if (libraryTab === 'my_library') {
      return songs.filter((s) => !s.isPublic);
    }
    return songs.filter((s) => s.isPublic);
  }, [songs, libraryTab]);

  // Search, Filter, and Sort
  const filteredAndSortedSongs = useMemo(() => {
    let result = [...tabSongs];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
      );
    }

    // Collection filter
    if (selectedCollectionId) {
      result = result.filter((s) => s.collectionId === selectedCollectionId);
    }

    // Sub-filters for My Library
    if (libraryTab === 'my_library') {
      if (filterStatus === 'favorites') {
        result = result.filter((s) => s.isFavorite);
      } else if (filterStatus === 'in_progress') {
        result = result.filter((s) => s.inProgress);
      }
    }

    // Sub-filters for Public Songs (Trending, New, All)
    if (libraryTab === 'public_songs') {
      if (publicFilterStatus === 'trending') {
        result = result.filter((s) => s.isTrending);
      } else if (publicFilterStatus === 'new') {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        result = result.filter((s) => s.createdAt >= thirtyDaysAgo);
      }
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'last_practiced':
          return (
            new Date(b.lastPracticedAt || 0).getTime() -
            new Date(a.lastPracticedAt || 0).getTime()
          );
        case 'difficulty_asc': {
          const order = { Beginner: 1, Intermediate: 2, Advanced: 3 };
          return order[a.difficulty] - order[b.difficulty];
        }
        case 'difficulty_desc': {
          const order = { Beginner: 1, Intermediate: 2, Advanced: 3 };
          return order[b.difficulty] - order[a.difficulty];
        }
        case 'bpm_desc':
          return b.bpm - a.bpm;
        case 'duration_desc':
          return b.duration - a.duration;
        case 'title_asc':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return result;
  }, [tabSongs, searchQuery, filterStatus, publicFilterStatus, selectedCollectionId, sortBy, libraryTab]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedSongs.length / pageSize) || 1;
  const paginatedSongs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedSongs.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedSongs, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, publicFilterStatus, selectedCollectionId, sortBy, pageSize, libraryTab]);

  // Statistics for My Library
  const userLibrarySongs = useMemo(() => songs.filter((s) => !s.isPublic), [songs]);
  const totalSongsCount = userLibrarySongs.length;
  const totalPracticeSeconds = userLibrarySongs.reduce(
    (sum, s) => sum + (s.totalPracticeSeconds || 0),
    0
  );
  const songsWithAccuracy = userLibrarySongs.filter((s) => s.averageAccuracy > 0);
  const averageAccuracy =
    songsWithAccuracy.length > 0
      ? songsWithAccuracy.reduce((sum, s) => sum + s.averageAccuracy, 0) /
        songsWithAccuracy.length
      : 0;

  // Direct 1-Stage File Processing: Single click / drop parses and adds to library immediately
  const handleProcessDirectFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.mid') && !file.name.toLowerCase().endsWith('.midi')) {
      alert('Please upload a standard MIDI (.mid) file.');
      return;
    }

    try {
      setIsUploadingFile(true);
      const buffer = await file.arrayBuffer();
      const parsed = await parseMidiFile(buffer, file.name);

      let midiUrl: string | undefined = undefined;
      const fileId = `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const storagePath = `${fileId}.mid`;
      const { url } = await uploadMidiToStorage(file, storagePath);
      if (url) midiUrl = url;

      const newSong: Song = {
        id: fileId,
        title: parsed.title || file.name.replace(/\.[^/.]+$/, ''),
        artist: parsed.artist || 'Unknown Artist',
        duration: parsed.duration,
        bpm: parsed.bpm,
        trackCount: parsed.trackCount,
        totalNotes: parsed.totalNotes,
        difficulty: parsed.difficulty,
        isFavorite: false,
        inProgress: true,
        isPublic: false,
        isTrending: false,
        midiUrl: midiUrl,
        notesData: parsed.notesData,
        practiceHistory: [],
        totalPracticeSeconds: 0,
        averageAccuracy: 0,
        createdAt: new Date().toISOString(),
        lastPracticedAt: null,
      };

      await saveSongToSupabase(newSong);
      setSongs((prev) => [newSong, ...prev]);
      setLibraryTab('my_library');
      setSelectedSongForDetail(newSong);
    } catch (err: any) {
      console.error('Upload error:', err);
      alert(err?.message || 'Error processing MIDI file.');
    } finally {
      setIsUploadingFile(false);
      if (directFileInputRef.current) directFileInputRef.current.value = '';
    }
  };

  // Song Actions
  const handleToggleFavorite = async (id: string, current: boolean) => {
    const next = !current;
    setSongs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isFavorite: next } : s))
    );
    await updateSongInSupabase(id, { isFavorite: next });
  };

  const handleUpdateTitleArtist = async (id: string, title: string, artist: string) => {
    setSongs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title, artist } : s))
    );
    await updateSongInSupabase(id, { title, artist });
  };

  const handleChangeDifficulty = async (id: string, difficulty: DifficultyLevel) => {
    setSongs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, difficulty } : s))
    );
    await updateSongInSupabase(id, { difficulty });
  };

  const handleAssignCollection = async (songId: string, collectionId: string | null) => {
    setSongs((prev) =>
      prev.map((s) => (s.id === songId ? { ...s, collectionId } : s))
    );
    await updateSongInSupabase(songId, { collectionId });
  };

  const handleCreateCollection = async (name: string) => {
    const { data: newCol } = await createCollectionInSupabase(name);
    if (newCol) {
      setCollections((prev) => [...prev, newCol]);
    } else {
      const localCol: Collection = { id: `col-${Date.now()}`, name };
      setCollections((prev) => [...prev, localCol]);
    }
  };

  const handleDeleteSong = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this song?')) return;
    if (previewPlayingSongId === id) {
      quickAudioEngineRef.current?.stop();
      setPreviewPlayingSongId(null);
    }
    setSongs((prev) => prev.filter((s) => s.id !== id));
    await deleteSongFromSupabase(id);
  };

  // Add a public song to user's personal library
  const handleAddToLibrary = async (publicSong: Song) => {
    const newLibrarySong: Song = {
      ...publicSong,
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      isPublic: false,
      isFavorite: false,
      inProgress: true,
      practiceHistory: [],
      totalPracticeSeconds: 0,
      averageAccuracy: 0,
      createdAt: new Date().toISOString(),
      lastPracticedAt: null,
    };

    setSongs((prev) => [newLibrarySong, ...prev]);
    await saveSongToSupabase(newLibrarySong);
    setLibraryTab('my_library');
  };

  const handleSongUpdated = (updatedSong: Song) => {
    setSongs((prev) =>
      prev.map((s) => (s.id === updatedSong.id ? updatedSong : s))
    );
    setSelectedSongForDetail(updatedSong);
  };

  const handleTogglePreview = async (song: Song) => {
    if (previewPlayingSongId === song.id) {
      quickAudioEngineRef.current?.pause();
      setPreviewPlayingSongId(null);
      return;
    }

    if (!quickAudioEngineRef.current) {
      quickAudioEngineRef.current = new AudioEngine();
    }
    const engine = quickAudioEngineRef.current;
    engine.stop();

    if (song.notesData && song.notesData.length > 0) {
      engine.loadSong(song.notesData, song.duration);
      engine.setProgressCallback((_, isFinished) => {
        if (isFinished) {
          setPreviewPlayingSongId(null);
        }
      });
      await engine.play();
      setPreviewPlayingSongId(song.id);
    }
  };

  const isSongInUserLibrary = (publicSong: Song) => {
    return userLibrarySongs.some(
      (s) =>
        s.title.toLowerCase().trim() === publicSong.title.toLowerCase().trim() &&
        s.artist.toLowerCase().trim() === publicSong.artist.toLowerCase().trim()
    );
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col selection:bg-brand/30 selection:text-brand">
      {/* Header */}
      <Header
        totalSongs={totalSongsCount}
        totalPracticeSeconds={totalPracticeSeconds}
        averageAccuracy={averageAccuracy}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-12 py-8 space-y-6">
        {/* Top Controls: Merged single row + sub-filters */}
        <FiltersAndSort
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          libraryTab={libraryTab}
          onLibraryTabChange={setLibraryTab}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          publicFilterStatus={publicFilterStatus}
          onPublicFilterChange={setPublicFilterStatus}
          selectedCollectionId={selectedCollectionId}
          onSelectCollection={setSelectedCollectionId}
          collections={collections}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalFiltered={filteredAndSortedSongs.length}
        />

        {/* 1-Stage Direct Upload MIDI Button with Footnote */}
        {libraryTab === 'my_library' && (
          <div
            onClick={() => directFileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleProcessDirectFile(e.dataTransfer.files[0]);
              }
            }}
            className="group cursor-pointer rounded-2xl border-2 border-dashed border-slate-700 bg-[#131b2e] hover:border-brand hover:bg-[#18233b] p-5 text-center transition-all shadow-md"
          >
            <input
              ref={directFileInputRef}
              type="file"
              accept=".mid,.midi"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleProcessDirectFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div className="flex items-center justify-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 border border-brand/40 text-brand group-hover:scale-110 transition-transform">
                {isUploadingFile ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Upload className="h-5 w-5" />
                )}
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-white block">
                  {isUploadingFile ? 'Uploading & Processing MIDI...' : 'Upload MIDI Song'}
                </span>
                <span className="text-xs text-slate-300 block mt-0.5">
                  or drag and drop .mid
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Catalogue Display Area */}
        {isLoading ? (
          <SkeletonLoader viewMode={viewMode} count={pageSize} />
        ) : filteredAndSortedSongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-700 bg-[#131b2e] py-16 px-4 text-center shadow-lg">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-300 mb-3">
              <Music className="h-7 w-7 text-brand" />
            </div>
            <h3 className="text-base font-bold text-white">No songs found</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-sm">
              {searchQuery || filterStatus !== 'all' || selectedCollectionId
                ? 'Try adjusting your search query, filters, or collection to find what you need.'
                : libraryTab === 'my_library'
                ? 'Your library is empty. Upload a MIDI song or add from the Public Songs catalogue.'
                : 'No public songs found matching your search.'}
            </p>
            {libraryTab === 'my_library' && (
              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={() => directFileInputRef.current?.click()}
                  className="rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-hover shadow-md shadow-brand/25"
                >
                  Upload MIDI Song
                </button>
                <button
                  onClick={() => setLibraryTab('public_songs')}
                  className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:text-white"
                >
                  Browse Public Songs
                </button>
              </div>
            )}
          </div>
        ) : viewMode === 'table' ? (
          /* List View: Clean row layout with generous whitespace and NO table headers */
          <div className="rounded-2xl border border-slate-700/80 bg-[#131b2e] shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-slate-700/80">
                  {paginatedSongs.map((song) => (
                    <SongTableRow
                      key={song.id}
                      song={song}
                      isPublicView={libraryTab === 'public_songs'}
                      isAlreadyInLibrary={isSongInUserLibrary(song)}
                      collections={collections}
                      onOpenDetail={(s) => setSelectedSongForDetail(s)}
                      onToggleFavorite={handleToggleFavorite}
                      onDelete={handleDeleteSong}
                      onAddToLibrary={handleAddToLibrary}
                      onUpdateTitleArtist={handleUpdateTitleArtist}
                      onChangeDifficulty={handleChangeDifficulty}
                      onAssignCollection={handleAssignCollection}
                      onCreateCollection={handleCreateCollection}
                      isPlayingPreview={previewPlayingSongId === song.id}
                      onTogglePreview={handleTogglePreview}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Card Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedSongs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                isPublicView={libraryTab === 'public_songs'}
                isAlreadyInLibrary={isSongInUserLibrary(song)}
                collections={collections}
                onOpenDetail={(s) => setSelectedSongForDetail(s)}
                onToggleFavorite={handleToggleFavorite}
                onDelete={handleDeleteSong}
                onAddToLibrary={handleAddToLibrary}
                onUpdateTitleArtist={handleUpdateTitleArtist}
                onChangeDifficulty={handleChangeDifficulty}
                onAssignCollection={handleAssignCollection}
                onCreateCollection={handleCreateCollection}
                isPlayingPreview={previewPlayingSongId === song.id}
                onTogglePreview={handleTogglePreview}
              />
            ))}
          </div>
        )}

        {/* Paging Controls */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredAndSortedSongs.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </main>

      {/* Song Detail & Preview / Practice Side Panel */}
      {selectedSongForDetail && (
        <SongDetailPanel
          song={selectedSongForDetail}
          onClose={() => setSelectedSongForDetail(null)}
          onSongUpdated={handleSongUpdated}
        />
      )}
    </div>
  );
}
