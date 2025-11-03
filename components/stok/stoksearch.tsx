// components/stok/stoksearch.tsx
'use client';

import { StokItem } from '@/types';

interface StokSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterKategori: string;
  onFilterChange: (kategori: string) => void;
  categories: string[];
  onClearSearch: () => void;
  onAddStok: () => void;
  filteredCount: number;
  totalCount: number;
  isManager: boolean;
}

export default function StokSearch({
  searchQuery,
  onSearchChange,
  filterKategori,
  onFilterChange,
  categories,
  onClearSearch,
  onAddStok,
  filteredCount,
  totalCount,
  isManager
}: StokSearchProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Search Input */}
        <div className="flex-1 w-full lg:max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Cari barang, kategori, atau satuan..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="w-full lg:w-auto">
          <select
            value={filterKategori}
            onChange={(e) => onFilterChange(e.target.value)}
            className="w-full lg:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full lg:w-auto">
          <button
            onClick={onClearSearch}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Reset</span>
          </button>
          {isManager && (
            <button
              onClick={onAddStok}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Tambah Stok</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Results Info */}
      {(searchQuery || filterKategori !== 'Semua') && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Menampilkan <span className="font-semibold">{filteredCount}</span> dari <span className="font-semibold">{totalCount}</span> item
            {searchQuery && (
              <span> untuk "<span className="font-medium text-blue-600">{searchQuery}</span>"</span>
            )}
            {filterKategori !== 'Semua' && (
              <span> dalam kategori <span className="font-medium text-blue-600">{filterKategori}</span></span>
            )}
          </div>
          <button
            onClick={onClearSearch}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Tampilkan semua</span>
          </button>
        </div>
      )}
    </div>
  );
}