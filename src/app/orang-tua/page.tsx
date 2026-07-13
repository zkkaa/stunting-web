'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { DeleteConfirmModal, Layout, ProtectedRoute } from '@/components';
import { FiFilter, FiSearch, FiMoreVertical, FiChevronLeft, FiChevronRight, FiAlertTriangle } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { fetchKeluargaList, deleteKeluarga } from '@/utils/database';
import { KeluargaDetail } from '@/types';

function OrangTuaPageContent() {
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [sortOption, setSortOption] = useState<'latest' | 'az' | 'za' | 'children'>('latest');
  const [showFilters, setShowFilters] = useState(false);
  const [keluargaList, setKeluargaList] = useState<KeluargaDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);

  // Satu sumber kebenaran untuk dropdown menu yang sedang terbuka - hanya 1 card
  // bisa punya menu terbuka dalam satu waktu.
  const [openMenuNoKk, setOpenMenuNoKk] = useState<string | null>(null);
  const [confirmDeleteNoKk, setConfirmDeleteNoKk] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchKeluargaList();
      setKeluargaList(data);
    } catch (err) {
      console.error('Error loading keluarga list:', err);
      setError('Gagal memuat data orang tua. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Klik di luar dropdown filter ATAU dropdown menu card -> tutup keduanya
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
      const target = event.target as HTMLElement;
      if (!target.closest('[data-card-menu]')) {
        setOpenMenuNoKk(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [keluargaList]);

  const filtered = useMemo(() => {
    const list = keluargaList.filter((k) => {
      const namaGabungan = `${k.ayah?.nama || ''} ${k.ibu?.nama || ''}`.toLowerCase();
      return namaGabungan.includes(query.toLowerCase()) || k.no_kk.includes(query);
    });

    list.sort((a, b) => {
      switch (sortOption) {
        case 'az':
          return (a.ayah?.nama || '').localeCompare(b.ayah?.nama || '');
        case 'za':
          return (b.ayah?.nama || '').localeCompare(a.ayah?.nama || '');
        case 'children':
          return b.jumlah_anak - a.jumlah_anak;
        case 'latest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return list;
  }, [keluargaList, query, sortOption]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const keluargaToDelete = keluargaList.find((k) => k.no_kk === confirmDeleteNoKk) || null;

  return (
    <Layout>
      <div className="min-h-screen relative overflow-x-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-60 z-10"
          style={{
            background: `radial-gradient(ellipse at center top, rgba(158, 202, 214, 0.6) 0%, rgba(158, 202, 214, 0.3) 30%, rgba(158, 202, 214, 0.1) 50%, transparent 70%)`,
          }}
        />

        <div className="relative z-20 py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black">Profile Orang Tua</h1>
            </div>

            <div
              className="mb-4 sm:mb-6 bg-white rounded-xl border border-gray-200 shadow-sm"
              style={{ boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D' }}
            >
              <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => (window.location.href = '/orang-tua/tambah')}
                    className="px-3 cursor-pointer sm:px-4 py-2 rounded-md bg-[#407A81] text-white hover:bg-[#326269] font-medium text-sm sm:text-base w-full sm:w-fit"
                  >
                    Tambah Orang Tua
                  </button>
                  <div className="relative" ref={filterRef}>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="inline-flex cursor-pointer items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-sm sm:text-base w-full sm:w-fit"
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
                              { value: 'az', label: 'Nama Ayah A-Z' },
                              { value: 'za', label: 'Nama Ayah Z-A' },
                              { value: 'children', label: 'Jumlah Anak' },
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
                    placeholder="Cari Orang Tua atau No KK"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-[#9ECAD6] focus:border-transparent text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {loading ? (
                <div className="col-span-full text-center text-gray-500 py-10">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#407A81]"></div>
                  <p className="mt-2">Memuat data...</p>
                </div>
              ) : error ? (
                <div className="col-span-full text-center text-red-500 py-10">
                  <p>{error}</p>
                  <button onClick={loadData} className="mt-2 px-4 py-2 bg-[#407A81] text-white rounded-md hover:bg-[#326269]">
                    Coba Lagi
                  </button>
                </div>
              ) : (
                <>
                  {paginatedData.map((k) => (
                    <ParentCard
                      key={k.no_kk}
                      keluarga={k}
                      isMenuOpen={openMenuNoKk === k.no_kk}
                      onToggleMenu={() => setOpenMenuNoKk(openMenuNoKk === k.no_kk ? null : k.no_kk)}
                      onCloseMenu={() => setOpenMenuNoKk(null)}
                      onRequestDelete={() => {
                        setOpenMenuNoKk(null);
                        setConfirmDeleteNoKk(k.no_kk);
                      }}
                    />
                  ))}
                  {paginatedData.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 py-10">Tidak ada data</div>
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

      {/* Modal konfirmasi hapus - di luar konten halaman, fixed full-screen di atas navbar */}
      {keluargaToDelete && (
        <DeleteConfirmModal
          title="Apakah anda yakin ingin menghapusnya?"
          description={
            <>
              Data orang tua <span className="font-semibold">{keluargaToDelete.ayah?.nama || keluargaToDelete.ibu?.nama}</span>,
              alamat, seluruh anak, dan riwayat scan terkait akan dihapus secara{' '}
              <span className="font-semibold text-red-600">permanen</span> dan tidak dapat dikembalikan.
            </>
          }
          onCancel={() => setConfirmDeleteNoKk(null)}
          onConfirm={async () => {
            await deleteKeluarga(keluargaToDelete.no_kk);
            setConfirmDeleteNoKk(null);
            await loadData();
          }}
        />
      )}
    </Layout>
  );
}

function Avatar({ url, alt }: { url: string | null; alt: string }) {
  return (
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#E5F3F5] flex items-center justify-center text-[#397789] shrink-0">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-4.418 0-8 3.582-8 8h16c0-4.418-3.582-8-8-8Z"
            fill="#397789"
          />
        </svg>
      )}
    </div>
  );
}

function ParentCard({
  keluarga,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onRequestDelete,
}: {
  keluarga: KeluargaDetail;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onRequestDelete: () => void;
}) {
  const router = useRouter();

  return (
    <div
      className="relative bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-lg transition-all duration-200"
      style={{ boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D' }}
    >
      <div className="absolute top-2 sm:top-3 right-2 sm:right-3" data-card-menu>
        <button onClick={onToggleMenu} className="p-1 cursor-pointer text-[#407A81]/80 hover:text-[#407A81]">
          <FiMoreVertical size={16} />
        </button>
        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-36 sm:w-40 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden z-20">
            <button
              onClick={() => {
                onCloseMenu();
                router.push(`/orang-tua/${keluarga.no_kk}`);
              }}
              className="w-full cursor-pointer text-left px-3 py-2 text-xs sm:text-sm hover:bg-gray-50"
            >
              Lihat Detail
            </button>
            <button
              onClick={() => {
                onCloseMenu();
                router.push(`/orang-tua/edit/${keluarga.no_kk}`);
              }}
              className="w-full cursor-pointer text-left px-3 py-2 text-xs sm:text-sm hover:bg-gray-50"
            >
              Edit
            </button>
            <button onClick={onRequestDelete} className="w-full cursor-pointer text-left px-3 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50">
              Hapus
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <Avatar url={keluarga.ayah?.foto_profil || null} alt={keluarga.ayah?.nama || 'Ayah'} />
        <div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
            {keluarga.ayah?.nama || 'Belum diisi'}
          </div>
          <div className="text-sm text-[#407A81] font-medium">Ayah</div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 mt-3 sm:mt-4">
        <Avatar url={keluarga.ibu?.foto_profil || null} alt={keluarga.ibu?.nama || 'Ibu'} />
        <div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
            {keluarga.ibu?.nama || 'Belum diisi'}
          </div>
          <div className="text-sm text-[#407A81] font-medium">Ibu</div>
        </div>
      </div>

      <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3 text-center">
        <div className="text-sm sm:text-base">
          <span className="font-semibold text-[#407A81]">No KK:</span>
          <span className="ml-2 text-gray-500">{keluarga.no_kk}</span>
        </div>
        <div className="text-sm sm:text-base">
          <span className="font-semibold text-[#407A81]">Jumlah Anak:</span>
          <span className="ml-2 text-gray-500">{keluarga.jumlah_anak} Anak</span>
        </div>
      </div>
    </div>
  );
}

export default function OrangTuaPage() {
  return (
    <ProtectedRoute>
      <OrangTuaPageContent />
    </ProtectedRoute>
  );
}