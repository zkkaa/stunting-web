'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Layout, ProtectedRoute, DeleteConfirmModal } from '@/components';
import { FiFilter, FiSearch, FiMoreVertical, FiChevronLeft, FiChevronRight, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { fetchAnakList, deleteAnak } from '@/utils/database';
import { calculateAgeInMonths } from '@/lib/stuntingCalculator';
import { Anak } from '@/types';

function formatUmur(tanggalLahir: string): string {
  const totalBulan = calculateAgeInMonths(tanggalLahir);
  const tahun = Math.floor(totalBulan / 12);
  const bulan = totalBulan % 12;
  if (tahun === 0 && bulan === 0) return 'Baru lahir';
  if (tahun === 0) return `${bulan} Bulan`;
  if (bulan === 0) return `${tahun} Tahun`;
  return `${tahun} Tahun ${bulan} Bulan`;
}

function AnakPageContent() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<'latest' | 'az' | 'za' | 'age'>('latest');
  const [showFilters, setShowFilters] = useState(false);
  const [anakList, setAnakList] = useState<Anak[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const filterRef = useRef<HTMLDivElement>(null);

  const [openMenuNik, setOpenMenuNik] = useState<string | null>(null);
  const [confirmDeleteNik, setConfirmDeleteNik] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAnakList();
      setAnakList(data);
    } catch (err) {
      console.error('Error loading anak list:', err);
      setError('Gagal memuat data anak. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
      const target = event.target as HTMLElement;
      if (!target.closest('[data-card-menu]')) {
        setOpenMenuNik(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [anakList]);

  const filtered = useMemo(() => {
    const list = anakList.filter((a) => a.nama.toLowerCase().includes(searchTerm.toLowerCase()));

    list.sort((a, b) => {
      switch (sortOption) {
        case 'az':
          return a.nama.localeCompare(b.nama);
        case 'za':
          return b.nama.localeCompare(a.nama);
        case 'age':
          return calculateAgeInMonths(a.tanggal_lahir) - calculateAgeInMonths(b.tanggal_lahir);
        case 'latest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return list;
  }, [anakList, searchTerm, sortOption]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const anakToDelete = anakList.find((a) => a.nik === confirmDeleteNik) || null;

  return (
    <Layout>
      <div className="min-h-screen relative overflow-x-hidden bg-gray-50/50">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-60 z-10"
          style={{
            background: `radial-gradient(ellipse at center top, rgba(158, 202, 214, 0.6) 0%, rgba(158, 202, 214, 0.3) 30%, rgba(158, 202, 214, 0.1) 50%, transparent 70%)`,
          }}
        />

        <div className="relative z-20 py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Profil Anak</h1>
              <p className="text-sm sm:text-base text-gray-500 mt-2">Daftar anak yang sudah terdaftar</p>
            </div>

            <div
              className="mb-4 sm:mb-6 bg-white rounded-xl border border-gray-200 shadow-sm"
              style={{ boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D' }}
            >
              <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => router.push('/anak/tambah')}
                    className="px-3 sm:px-4 cursor-pointer py-2 rounded-md bg-[#407A81] text-white hover:bg-[#326269] font-medium text-sm sm:text-base w-full sm:w-fit"
                  >
                    Tambah Anak
                  </button>
                  <div className="relative" ref={filterRef}>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 cursor-pointer py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-sm sm:text-base w-full sm:w-fit"
                    >
                      <FiFilter className="text-gray-600" size={16} />
                      <span className="text-gray-700">Filter by</span>
                    </button>
                    {showFilters && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-9999 max-w-[calc(100vw-2rem)] overflow-hidden">
                        <div className="p-4">
                          <label className="block text-sm font-medium text-gray-700 mb-3">Urutkan:</label>
                          <div className="space-y-2">
                            {[
                              { value: 'latest', label: 'Terbaru' },
                              { value: 'az', label: 'Nama A-Z' },
                              { value: 'za', label: 'Nama Z-A' },
                              { value: 'age', label: 'Usia Anak' },
                            ].map((opt) => (
                              <label
                                key={opt.value}
                                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                              >
                                <input
                                  type="radio"
                                  name="sortFilter"
                                  value={opt.value}
                                  checked={sortOption === opt.value}
                                  onChange={(e) => setSortOption(e.target.value as typeof sortOption)}
                                  className="w-4 h-4 border-gray-300 focus:ring-0 focus:ring-offset-0"
                                  style={{ accentColor: '#407A81' }}
                                />
                                <span className="text-sm text-gray-700 whitespace-nowrap">{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative flex-1 min-w-50 sm:min-w-60">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Cari Anak"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-[#9ECAD6] focus:border-transparent text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {loading ? (
                <div className="col-span-full text-center text-gray-500 py-10">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#407A81]"></div>
                  <p className="mt-2 text-sm">Memuat data...</p>
                </div>
              ) : error ? (
                <div className="col-span-full text-center text-red-500 py-10">
                  <p className="text-sm">{error}</p>
                  <button onClick={loadData} className="mt-2 px-4 py-2 bg-[#407A81] text-white rounded-md hover:bg-[#326269] text-sm">
                    Coba Lagi
                  </button>
                </div>
              ) : (
                <>
                  {paginatedData.map((anak) => (
                    <ChildCard
                      key={anak.nik}
                      anak={anak}
                      isMenuOpen={openMenuNik === anak.nik}
                      onToggleMenu={() => setOpenMenuNik(openMenuNik === anak.nik ? null : anak.nik)}
                      onCloseMenu={() => setOpenMenuNik(null)}
                      onRequestDelete={() => {
                        setOpenMenuNik(null);
                        setConfirmDeleteNik(anak.nik);
                      }}
                    />
                  ))}
                  {paginatedData.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 py-10 text-sm">
                      Tidak ada data anak yang ditemukan
                    </div>
                  )}
                </>
              )}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{' '}
                  {Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} data
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => p - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft size={16} />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 rounded-md text-sm font-medium ${
                            currentPage === pageNum
                              ? 'bg-[#407A81] text-white'
                              : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {anakToDelete && (
        <DeleteConfirmModal
          title="Hapus anak ini?"
          description={
            <>
              Data <span className="font-semibold">{anakToDelete.nama}</span> dan seluruh riwayat scan-nya akan dihapus secara{' '}
              <span className="font-semibold text-red-600">permanen</span> dan tidak dapat dikembalikan.
            </>
          }
          onCancel={() => setConfirmDeleteNik(null)}
          onConfirm={async () => {
            await deleteAnak(anakToDelete.nik);
            setConfirmDeleteNik(null);
            await loadData();
          }}
        />
      )}
    </Layout>
  );
}

function ChildCard({
  anak,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onRequestDelete,
}: {
  anak: Anak;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onRequestDelete: () => void;
}) {
  const router = useRouter();

  return (
    <div
      className="relative bg-white rounded-lg p-4 border border-gray-200 hover:shadow-lg transition-all duration-200"
      style={{ boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-[#E5F3F5] flex items-center justify-center text-[#397789] shrink-0">
            {anak.foto_profil ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={anak.foto_profil} alt={anak.nama} className="w-full h-full object-cover" />
            ) : (
              <FiUser size={20} />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{anak.nama}</h3>
            <p className="text-xs text-[#407A81] font-medium mt-0.5">{anak.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{formatUmur(anak.tanggal_lahir)}</p>
          </div>
        </div>

        <div className="relative" data-card-menu>
          <button
            onClick={onToggleMenu}
            className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <FiMoreVertical size={16} />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-md shadow-lg border border-gray-200 z-10 overflow-hidden">
              <button
                onClick={() => {
                  onCloseMenu();
                  router.push(`/anak/${anak.nik}`);
                }}
                className="w-full cursor-pointer text-left px-3 py-2 text-sm hover:bg-gray-50"
              >
                Lihat Detail
              </button>
              <button
                onClick={() => {
                  onCloseMenu();
                  router.push(`/anak/edit/${anak.nik}`);
                }}
                className="w-full cursor-pointer text-left px-3 py-2 text-sm hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={onRequestDelete}
                className="w-full cursor-pointer text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Hapus
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AnakPage() {
  return (
    <ProtectedRoute>
      <AnakPageContent />
    </ProtectedRoute>
  );
}