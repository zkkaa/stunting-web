'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Layout, ProtectedRoute } from '@/components';
import { useRouter } from 'next/navigation';
import { FiFilter, FiSearch, FiClock, FiArrowRightCircle, FiUser, FiTrash2, FiX } from 'react-icons/fi';
import { fetchRiwayatScanHistory, fetchRiwayatScanSummary, deleteRiwayatScanBulk } from '@/utils/database';
import { getStatusColor, getStatusLabel, NutritionStatus } from '@/lib/stuntingCalculator';
import { RiwayatScanWithAnak } from '@/types';
import { SummaryCards, SummaryCardData } from '@/components/sections/SummaryCards';

type SortOption = 'latest' | 'az' | 'za' | 'age';

const STATUS_OPTIONS: { value: NutritionStatus; label: string }[] = [
  { value: 'stunting_parah', label: 'Stunting Parah' },
  { value: 'stunting', label: 'Stunting' },
  { value: 'normal', label: 'Normal' },
  { value: 'tinggi', label: 'Tinggi' },
];

function formatUsiaDariHari(usiaHari: number): string {
  const tahun = Math.floor(usiaHari / 365.25);
  const bulan = Math.floor((usiaHari % 365.25) / 30.44);
  if (tahun === 0 && bulan === 0) return 'Baru lahir';
  if (tahun === 0) return `${bulan} Bulan`;
  if (bulan === 0) return `${tahun} Tahun`;
  return `${tahun} Tahun ${bulan} Bulan`;
}

function formatTanggalWaktu(dateString: string): string {
  const date = new Date(dateString);
  const tgl = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  const jam = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
  return `${tgl} · ${jam} WIB`;
}

function HistoryPageContent() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [statusFilter, setStatusFilter] = useState<NutritionStatus[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [rows, setRows] = useState<RiwayatScanWithAnak[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // --- Mode pilih & hapus massal ---
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [historyData, summaryData] = await Promise.all([
        fetchRiwayatScanHistory(),
        fetchRiwayatScanSummary(),
      ]);
      setRows(historyData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Error loading riwayat scan:', err);
      setError('Gagal memuat data riwayat. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleStatusFilter = (status: NutritionStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const filtered = useMemo(() => {
    const list = rows.filter((row) => {
      const matchesSearch = row.anak.nama.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(row.status_gizi);
      return matchesSearch && matchesStatus;
    });

    list.sort((a, b) => {
      switch (sortOption) {
        case 'az':
          return a.anak.nama.localeCompare(b.anak.nama);
        case 'za':
          return b.anak.nama.localeCompare(a.anak.nama);
        case 'age':
          return a.usia_hari - b.usia_hari;
        case 'latest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return list;
  }, [rows, query, statusFilter, sortOption]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((row) => selectedIds.has(row.id));
  const someVisibleSelected = filtered.some((row) => selectedIds.has(row.id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filtered.forEach((row) => next.delete(row.id));
      } else {
        filtered.forEach((row) => next.add(row.id));
      }
      return next;
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleEnterSelectMode = () => {
    setSelectMode(true);
    setSelectedIds(new Set());
  };

  const handleCancelSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0 || deleting) return;
    setDeleting(true);
    try {
      await deleteRiwayatScanBulk(Array.from(selectedIds));
      setShowDeleteModal(false);
      setSelectMode(false);
      setSelectedIds(new Set());
      await loadData();
    } catch (err) {
      console.error('Gagal menghapus riwayat:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen relative overflow-x-hidden bg-gray-50/50">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-60 z-0"
          style={{
            background: `radial-gradient(ellipse at center top, rgba(158, 202, 214, 0.6) 0%, rgba(158, 202, 214, 0.3) 30%, rgba(158, 202, 214, 0.1) 50%, transparent 70%)`,
          }}
        />

        <div className="relative z-10 py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 pb-28">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
              <div className="text-center flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Riwayat Pemindaian</h1>
                <p className="text-sm sm:text-base text-gray-500 mt-2">
                  Seluruh hasil pemindaian yang sudah tersimpan.
                </p>
              </div>
            </div>

            {/* Summary Cards */}
            <SummaryCards
              data={[
                {
                  title: 'Stunting Parah',
                  value: summary.stunting_parah || 0,
                  bgGradient: 'linear-gradient(135deg, #FEE2E2 0%, #FFFFFF 100%)',
                },
                {
                  title: 'Stunting',
                  value: summary.stunting || 0,
                  bgGradient: 'linear-gradient(135deg, #FEF3C7 0%, #FFFFFF 100%)',
                },
                {
                  title: 'Normal',
                  value: summary.normal || 0,
                  bgGradient: 'linear-gradient(135deg, #D1FAE5 0%, #FFFFFF 100%)',
                },
                {
                  title: 'Tinggi',
                  value: summary.tinggi || 0,
                  bgGradient: 'linear-gradient(135deg, #DBEAFE 0%, #FFFFFF 100%)',
                },
              ] satisfies SummaryCardData[]}
            />

            {loading ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#407A81]" />
                <p className="mt-2 text-sm text-gray-500">Memuat data...</p>
              </div>
            ) : error ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-red-500 text-sm">
                {error}
              </div>
            ) : (
              <div
                className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6"
                style={{ boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D' }}
              >
                {/* Filter + Search + Toggle Hapus */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 sm:mb-6">
                  <div className="relative" ref={filterRef}>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="inline-flex cursor-pointer items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-sm sm:text-base w-full sm:w-fit"
                    >
                      <FiFilter className="text-gray-600" size={16} />
                      <span className="text-gray-700">Filter by</span>
                    </button>
                    {showFilters && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-9999 overflow-hidden">
                        <div className="p-4">
                          <label className="block text-sm font-medium text-gray-700 mb-3">Urutkan:</label>
                          <div className="space-y-2 mb-4">
                            {[
                              { value: 'latest', label: 'Terbaru' },
                              { value: 'az', label: 'Nama A-Z' },
                              { value: 'za', label: 'Nama Z-A' },
                              { value: 'age', label: 'Usia Anak' },
                            ].map((opt) => (
                              <label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                                <input
                                  type="radio"
                                  name="sortFilter"
                                  checked={sortOption === opt.value}
                                  onChange={() => setSortOption(opt.value as SortOption)}
                                  className="w-4 h-4"
                                  style={{ accentColor: '#407A81' }}
                                />
                                <span className="text-sm text-gray-700 whitespace-nowrap">{opt.label}</span>
                              </label>
                            ))}
                          </div>

                          <label className="block text-sm font-medium text-gray-700 mb-3">Status Gizi:</label>
                          <div className="space-y-2">
                            {STATUS_OPTIONS.map((opt) => (
                              <label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={statusFilter.includes(opt.value)}
                                  onChange={() => toggleStatusFilter(opt.value)}
                                  className="w-4 h-4 rounded"
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

                  <div className="relative flex-1 min-w-50">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Cari Anak"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full pl-9 sm:pl-10 pr-4 py-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-[#9ECAD6] focus:border-transparent text-sm sm:text-base"
                    />
                  </div>

                  {!selectMode ? (
                    <button
                      onClick={handleEnterSelectMode}
                      disabled={rows.length === 0}
                      className="inline-flex cursor-pointer items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-md border border-red-200 text-red-600 bg-white hover:bg-red-50 text-sm sm:text-base w-full sm:w-fit disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <FiTrash2 size={16} />
                      <span>Hapus</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleCancelSelectMode}
                      className="inline-flex cursor-pointer items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-md border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 text-sm sm:text-base w-full sm:w-fit"
                    >
                      <FiX size={16} />
                      <span>Batal</span>
                    </button>
                  )}
                </div>

                {/* Select all (hanya muncul di mode pilih & ada data) */}
                {selectMode && filtered.length > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer mb-3 px-1">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = !allVisibleSelected && someVisibleSelected;
                      }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: '#407A81' }}
                    />
                    <span className="text-sm text-gray-700 font-medium">
                      {allVisibleSelected ? 'Batalkan semua' : 'Pilih semua'}
                      {selectedIds.size > 0 && (
                        <span className="text-gray-400 font-normal"> · {selectedIds.size} dipilih</span>
                      )}
                    </span>
                  </label>
                )}

                {/* List */}
                <div className="space-y-2 sm:space-y-3">
                  {filtered.map((row) => {
                    const colors = getStatusColor(row.status_gizi);
                    const isChecked = selectedIds.has(row.id);
                    return (
                      <div
                        key={row.id}
                        className={`p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 border rounded-lg transition-all ${selectMode && isChecked
                            ? 'border-[#407A81] bg-[#F1F8F9]'
                            : 'border-gray-100 hover:border-[#407A81] hover:shadow-md'
                          }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {selectMode && (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectOne(row.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded shrink-0"
                              style={{ accentColor: '#407A81' }}
                            />
                          )}
                          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#E5F3F5] flex items-center justify-center text-[#397789] shrink-0">
                            <FiUser size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{row.anak.nama}</p>
                            <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                              <span>{formatUsiaDariHari(row.usia_hari)}</span>
                              <span>·</span>
                              <span>{row.anak.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                              <span className="inline-flex items-center gap-1">
                                <FiClock size={11} />
                                {formatTanggalWaktu(row.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                          <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#397789] bg-[#EFFFFE] min-w-19">
                            <span className="text-xs font-semibold text-[#397789]">{row.tinggi_cm} cm</span>
                          </div>
                          <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#397789] bg-[#EFFFFE] min-w-19">
                            <span className="text-xs font-semibold text-[#397789]">{row.berat_kg} kg</span>
                          </div>
                          <span
                            className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
                          >
                            {getStatusLabel(row.status_gizi)}
                          </span>
                          {!selectMode && (
                            <button
                              onClick={() => (selectMode ? toggleSelectOne(row.id) : router.push(`/history/${row.id}`))}
                              className="w-8 h-8 cursor-pointer rounded-full border-2 border-[#397789] flex items-center justify-center text-[#397789] hover:bg-[#397789] hover:text-white transition-colors shrink-0"
                              aria-label="Lihat detail"
                            >
                              <FiArrowRightCircle size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filtered.length === 0 && (
                    <div className="py-10 text-center text-gray-500 text-sm">Tidak ada data riwayat.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating action bar - muncul saat mode pilih aktif & ada yang dipilih */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-4">
          <div
            className="bg-white rounded-2xl border border-gray-200 p-3 sm:p-4 flex items-center justify-between gap-3"
            style={{ boxShadow: '0px 4px 12px 0px #00000033' }}
          >
            <span className="text-sm font-medium text-gray-700">
              {selectedIds.size} riwayat dipilih
            </span>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex cursor-pointer items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition-colors font-semibold text-sm"
            >
              <FiTrash2 size={16} />
              Hapus
            </button>
          </div>
        </div>
      )}

      {/* Modal konfirmasi hapus massal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !deleting && setShowDeleteModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTrash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Hapus {selectedIds.size} Riwayat?
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                Data riwayat pemindaian yang dipilih akan dihapus permanen dan tidak dapat dikembalikan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 cursor-pointer bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors font-semibold disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={deleting}
                  className="flex-1 cursor-pointer bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    'Hapus'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <HistoryPageContent />
    </ProtectedRoute>
  );
}