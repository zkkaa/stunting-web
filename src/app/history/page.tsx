'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Layout, ProtectedRoute } from '@/components';
import { useRouter } from 'next/navigation';
import { FiFilter, FiSearch, FiClock, FiArrowRightCircle, FiUser } from 'react-icons/fi';
import { fetchRiwayatScanHistory, fetchRiwayatScanSummary } from '@/utils/database';
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const load = async () => {
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
    load();
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

  return (
    <Layout>
      <div className="min-h-screen relative overflow-x-hidden bg-gray-50/50">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-60 z-0"
          style={{
            background: `radial-gradient(ellipse at center top, rgba(158, 202, 214, 0.6) 0%, rgba(158, 202, 214, 0.3) 30%, rgba(158, 202, 214, 0.1) 50%, transparent 70%)`,
          }}
        />

        <div className="relative z-10 py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Riwayat Pemindaian</h1>
              <p className="text-sm sm:text-base text-gray-500 mt-2">
                Seluruh hasil pemindaian yang sudah tersimpan.
              </p>
            </div>

            {/* Summary Cards */}
           // SESUDAH
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
                {/* Filter + Search */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 sm:mb-6">
                  <div className="relative" ref={filterRef}>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-sm sm:text-base w-full sm:w-fit"
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
                </div>

                {/* List */}
                <div className="space-y-2 sm:space-y-3">
                  {filtered.map((row) => {
                    const colors = getStatusColor(row.status_gizi);
                    return (
                      <div
                        key={row.id}
                        onClick={() => router.push(`/history/${row.id}`)}
                        className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 border border-gray-100 rounded-lg hover:border-[#407A81] hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
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
                          <button
                            className="w-8 h-8 rounded-full border-2 border-[#397789] flex items-center justify-center text-[#397789] hover:bg-[#397789] hover:text-white transition-colors shrink-0"
                            aria-label="Lihat detail"
                          >
                            <FiArrowRightCircle size={16} />
                          </button>
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