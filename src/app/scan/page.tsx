'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Layout, ProtectedRoute } from '@/components';
import { FiFilter, FiSearch, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { fetchAnakList } from '@/utils/database';
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

function ScanPageContent() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<'latest' | 'az' | 'za' | 'age'>('latest');
  const [showFilters, setShowFilters] = useState(false);
  const [anakList, setAnakList] = useState<Anak[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
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
    load();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Pemindaian</h1>
              <p className="text-sm sm:text-base text-gray-500 mt-2 max-w-xl mx-auto">
                Pilih anak yang ingin dilakukan pemindaian. Jika belum ada, lakukan Tambah Anak terlebih dahulu.
              </p>
            </div>

            <div
              className="mb-4 sm:mb-6 bg-white rounded-xl border border-gray-200 shadow-sm"
              style={{ boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D' }}
            >
              <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative" ref={filterRef}>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-sm sm:text-base w-full sm:w-fit"
                  >
                    <FiFilter className="text-gray-600" size={16} />
                    <span className="text-gray-700">Filter by</span>
                  </button>
                  {showFilters && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] overflow-hidden">
                      <div className="p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Urutkan:</label>
                        <div className="space-y-2">
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
                                value={opt.value}
                                checked={sortOption === opt.value}
                                onChange={(e) => setSortOption(e.target.value as typeof sortOption)}
                                className="w-4 h-4"
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

                <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
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
                <div className="col-span-full text-center text-red-500 py-10 text-sm">{error}</div>
              ) : (
                <>
                  {filtered.map((anak) => (
                    <div
                      key={anak.nik}
                      onClick={() => router.push(`/scan/${anak.nik}`)}
                      className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-lg hover:border-[#407A81] transition-all duration-200 cursor-pointer"
                      style={{ boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D' }}
                    >
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
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 py-10 text-sm">
                      Tidak ada data anak. <br />
                      <button onClick={() => router.push('/anak/tambah')} className="text-[#407A81] hover:underline mt-2 inline-block">
                        Tambah Anak terlebih dahulu
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function ScanPage() {
  return (
    <ProtectedRoute>
      <ScanPageContent />
    </ProtectedRoute>
  );
}