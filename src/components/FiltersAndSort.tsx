'use client';

import React from 'react';
import { Search, LayoutGrid, List, ArrowUpDown, Folder } from 'lucide-react';
import { SortOption, FilterStatus, PublicFilterStatus, ViewMode, LibraryTab, Collection } from '@/types/song';

interface FiltersAndSortProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  libraryTab: LibraryTab;
  onLibraryTabChange: (tab: LibraryTab) => void;
  filterStatus: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
  publicFilterStatus: PublicFilterStatus;
  onPublicFilterChange: (status: PublicFilterStatus) => void;
  selectedCollectionId: string | null;
  onSelectCollection: (colId: string | null) => void;
  collections: Collection[];
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalFiltered: number;
}

export const FiltersAndSort: React.FC<FiltersAndSortProps> = ({
  searchQuery,
  onSearchChange,
  libraryTab,
  onLibraryTabChange,
  filterStatus,
  onFilterChange,
  publicFilterStatus,
  onPublicFilterChange,
  selectedCollectionId,
  onSelectCollection,
  collections,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalFiltered,
}) => {
  return (
    <div className="space-y-3.5" suppressHydrationWarning>
      {/* Merged Single Row: Search Bar, My Library, Public Songs, Sort By, View Mode Toggle */}
      <div
        className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 border-b border-slate-700/80"
        suppressHydrationWarning
      >
        {/* 1. Search Bar (Left) */}
        <div className="relative flex-1 min-w-[200px]" suppressHydrationWarning>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={
              libraryTab === 'my_library'
                ? 'Search your library...'
                : 'Search public songs catalogue...'
            }
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            suppressHydrationWarning
            className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-10 pr-12 py-2.5 text-sm text-white placeholder-slate-400 transition-colors focus:border-[#28ba90] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {/* 2. My Library & 3. Public Songs Tabs */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onLibraryTabChange('my_library')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              libraryTab === 'my_library'
                ? 'bg-[#28ba90] text-slate-950 shadow-md shadow-[#28ba90]/25'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:text-white hover:border-slate-600'
            }`}
          >
            My Library
          </button>

          <button
            onClick={() => onLibraryTabChange('public_songs')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              libraryTab === 'public_songs'
                ? 'bg-[#28ba90] text-slate-950 shadow-md shadow-[#28ba90]/25'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:text-white hover:border-slate-600'
            }`}
          >
            Public Songs
          </button>
        </div>

        {/* 4. Sort Dropdown */}
        <div className="flex items-center gap-2 shrink-0" suppressHydrationWarning>
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">
            <ArrowUpDown className="h-4 w-4 text-[#28ba90]" />
            <span className="text-xs text-slate-400 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              aria-label="Sort catalogue items"
              suppressHydrationWarning
              className="bg-transparent text-xs sm:text-sm text-white focus:outline-none cursor-pointer font-medium"
            >
              <option value="recent" className="bg-slate-900 text-white">Recently Added</option>
              <option value="oldest" className="bg-slate-900 text-white">Oldest Added</option>
              <option value="last_practiced" className="bg-slate-900 text-white">Last Practiced</option>
              <option value="difficulty_asc" className="bg-slate-900 text-white">Difficulty (Easiest)</option>
              <option value="difficulty_desc" className="bg-slate-900 text-white">Difficulty (Hardest)</option>
              <option value="bpm_desc" className="bg-slate-900 text-white">Tempo (BPM)</option>
              <option value="duration_desc" className="bg-slate-900 text-white">Duration</option>
              <option value="title_asc" className="bg-slate-900 text-white">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* 5. Icon Slider / Toggle for Grid or List View (Right) */}
        <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
          <div className="flex items-center rounded-xl border border-slate-700 bg-slate-800 p-1">
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#28ba90] text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#28ba90] text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 min-h-[40px]">
        {libraryTab === 'my_library' ? (
          /* My Library Sub-filters (All Songs, Favorites, In Progress - no icons) */
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onFilterChange('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === 'all'
                  ? 'bg-slate-700 text-white border border-slate-600'
                  : 'text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700'
              }`}
            >
              All Songs
            </button>

            <button
              onClick={() => onFilterChange('favorites')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === 'favorites'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700'
              }`}
            >
              Favorites
            </button>

            <button
              onClick={() => onFilterChange('in_progress')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === 'in_progress'
                  ? 'bg-[#28ba90]/20 text-[#28ba90] border border-[#28ba90]/40'
                  : 'text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700'
              }`}
            >
              In Progress
            </button>

            {/* Collection Filter */}
            {collections.length > 0 && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
                <Folder className="h-3.5 w-3.5 text-[#28ba90]" />
                <select
                  value={selectedCollectionId || ''}
                  onChange={(e) => onSelectCollection(e.target.value || null)}
                  className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#28ba90] cursor-pointer font-medium"
                >
                  <option value="">All Collections</option>
                  {collections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ) : (
          /* Public Songs Sub-filters: All, Trending, New */
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onPublicFilterChange('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                publicFilterStatus === 'all'
                  ? 'bg-slate-700 text-white border border-slate-600'
                  : 'text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700'
              }`}
            >
              All
            </button>

            <button
              onClick={() => onPublicFilterChange('trending')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                publicFilterStatus === 'trending'
                  ? 'bg-[#28ba90]/20 text-[#28ba90] border border-[#28ba90]/40'
                  : 'text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700'
              }`}
            >
              Trending
            </button>

            <button
              onClick={() => onPublicFilterChange('new')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                publicFilterStatus === 'new'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700'
              }`}
            >
              New
            </button>

            {/* Collection Filter for Public Catalogue */}
            {collections.length > 0 && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
                <Folder className="h-3.5 w-3.5 text-[#28ba90]" />
                <select
                  value={selectedCollectionId || ''}
                  onChange={(e) => onSelectCollection(e.target.value || null)}
                  className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#28ba90] cursor-pointer font-medium"
                >
                  <option value="">All Collections</option>
                  {collections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-slate-300 font-medium">
          Showing <span className="text-[#28ba90] font-bold">{totalFiltered}</span> items
        </div>
      </div>
    </div>
  );
};