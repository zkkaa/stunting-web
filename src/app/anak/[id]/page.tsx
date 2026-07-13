'use client';

import React, { useState, useEffect } from 'react';
import { Layout, ProtectedRoute, DeleteConfirmModal } from '@/components';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { FiArrowLeft, FiMoreVertical, FiUser, FiPhone, FiMapPin, FiClock } from 'react-icons/fi';
import { fetchAnakByNik, fetchKeluargaDetail, fetchRiwayatScanByNik, deleteAnak } from '@/utils/database';
import { calculateAgeInMonths, getStatusLabel, getStatusColor } from '@/lib/stuntingCalculator';
import { Anak, OrangTua, Alamat, RiwayatScan } from '@/types';

function formatUmur(tanggalLahir: string): string {
  const totalBulan = calculateAgeInMonths(tanggalLahir);
  const tahun = Math.floor(totalBulan / 12);
  const bulan = totalBulan % 12;
  if (tahun === 0 && bulan === 0) return 'Baru lahir';
  if (tahun === 0) return `${bulan} Bulan`;
  if (bulan === 0) return `${tahun} Tahun`;
  return `${tahun} Tahun ${bulan} Bulan`;
}

function formatTanggal(tanggal: string | null | undefined): string {
  if (!tanggal) return 'Tidak ada';
  return new Date(tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatWaktu(tanggal: string): string {
  return new Date(tanggal).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function AnakDetailPageContent() {
  const router = useRouter();
  const params = useParams();
  const nik = params?.id as string;

  const [anak, setAnak] = useState<Anak | null>(null);
  const [ayah, setAyah] = useState<OrangTua | null>(null);
  const [ibu, setIbu] = useState<OrangTua | null>(null);
  const [alamat, setAlamat] = useState<Alamat | null>(null);
  const [riwayat, setRiwayat] = useState<RiwayatScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      if (!nik) return;
      try {
        setLoading(true);
        setError('');
        const anakData = await fetchAnakByNik(nik);
        if (!anakData) {
          setError('Data anak tidak ditemukan');
          return;
        }
        setAnak(anakData);

        const [keluargaDetail, riwayatData] = await Promise.all([
          fetchKeluargaDetail(anakData.no_kk),
          fetchRiwayatScanByNik(nik),
        ]);
        setAyah(keluargaDetail.ayah);
        setIbu(keluargaDetail.ibu);
        setAlamat(keluargaDetail.alamat);
        setRiwayat(riwayatData);
      } catch (err) {
        console.error('Error loading anak detail:', err);
        setError('Gagal memuat data anak');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [nik]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Layout>
      <div className="min-h-screen relative overflow-x-hidden bg-gray-50/50">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-60 z-10"
          style={{
            background: `radial-gradient(ellipse at center top, rgba(158, 202, 214, 0.6) 0%, rgba(158, 202, 214, 0.3) 30%, rgba(158, 202, 214, 0.1) 50%, transparent 70%)`,
          }}
        />

        <div className="relative z-20 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Link href="/anak" className="mb-4 inline-flex items-center gap-2 text-sm sm:text-base text-gray-600 hover:text-[#407A81] transition-colors">
              <FiArrowLeft size={18} />
              <span>Kembali ke Anak</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Profile Anak</h1>

            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#407A81]"></div>
                <p className="mt-4 text-gray-500 text-sm">Memuat data...</p>
              </div>
            ) : error || !anak ? (
              <div className="text-center py-20">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            ) : (
              <>
                {/* Card utama */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
                  <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Identitas Anak</span>
                    <div className="relative" ref={menuRef}>
                      <button
                        onClick={() => setMenuOpen((v) => !v)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-[#407A81] hover:bg-gray-50 transition-colors"
                      >
                        <FiMoreVertical size={18} />
                      </button>
                      {menuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-20">
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              router.push(`/anak/edit/${nik}`);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              setShowDelete(true);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-5 sm:px-7 py-6">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                      <div className="flex items-center gap-4 sm:block sm:shrink-0">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-[#E5F3F5] flex items-center justify-center text-[#397789] shrink-0">
                          {anak.foto_profil ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={anak.foto_profil} alt={anak.nama} className="w-full h-full object-cover" />
                          ) : (
                            <FiUser size={30} />
                          )}
                        </div>
                        <div className="sm:hidden">
                          <div className="text-lg font-bold text-gray-900">{anak.nama}</div>
                          <div className="text-xs text-[#407A81] font-medium">{formatUmur(anak.tanggal_lahir)}</div>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="hidden sm:block mb-3">
                          <div className="text-xl font-bold text-gray-900">{anak.nama}</div>
                          <div className="text-xs text-[#407A81] font-medium mt-0.5">{formatUmur(anak.tanggal_lahir)}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">NIK</div>
                            <div className="text-sm text-gray-800 font-medium">{anak.nik}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">Jenis Kelamin</div>
                            <div className="text-sm text-gray-800 font-medium">{anak.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">Tempat Lahir</div>
                            <div className="text-sm text-gray-800 font-medium">{anak.tempat_lahir || 'Tidak ada'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">Tanggal Lahir</div>
                            <div className="text-sm text-gray-800 font-medium">{formatTanggal(anak.tanggal_lahir)}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-100">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-0.5">Berat Lahir</div>
                        <div className="text-sm font-semibold text-gray-800">{anak.bb_lahir ? `${anak.bb_lahir} kg` : '—'}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-0.5">Tinggi Lahir</div>
                        <div className="text-sm font-semibold text-gray-800">{anak.tb_lahir ? `${anak.tb_lahir} cm` : '—'}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-0.5">Lingkar Kepala</div>
                        <div className="text-sm font-semibold text-gray-800">{anak.lk_lahir ? `${anak.lk_lahir} cm` : '—'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 sm:px-7 py-5 bg-gray-50/70 border-t border-gray-100">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Orang Tua</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-0.5">Ayah</div>
                        <div className="text-sm font-semibold text-gray-800">{ayah?.nama || 'Belum diisi'}</div>
                        {ayah?.no_hp && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <FiPhone size={11} /> {ayah.no_hp}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-0.5">Ibu</div>
                        <div className="text-sm font-semibold text-gray-800">{ibu?.nama || 'Belum diisi'}</div>
                        {ibu?.no_hp && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <FiPhone size={11} /> {ibu.no_hp}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/orang-tua/${anak.no_kk}`)}
                      className="text-xs text-[#407A81] hover:underline mt-3"
                    >
                      Lihat detail orang tua &rarr;
                    </button>
                  </div>

                  {alamat && (
                    <div className="px-5 sm:px-7 py-5 border-t border-gray-100">
                      <div className="flex items-center gap-2 mb-2 text-gray-500">
                        <FiMapPin size={15} />
                        <span className="text-xs font-semibold uppercase tracking-wide">Alamat</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {alamat.jalan}, {alamat.desa}, {alamat.kecamatan}, {alamat.kota}, {alamat.provinsi} {alamat.kode_pos}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card riwayat scan */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 sm:px-7 py-4 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Riwayat Pemindaian</span>
                  </div>

                  <div className="p-5 sm:p-7">
                    {riwayat.length > 0 ? (
                      <div className="space-y-3">
                        {riwayat.map((r) => {
                          const colors = getStatusColor(r.status_gizi);
                          return (
                            <div
                              key={r.id}
                              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:border-[#407A81] transition-colors"
                            >
                              <div className="flex items-center gap-2 text-xs text-gray-500 min-w-0">
                                <FiClock size={13} className="shrink-0" />
                                <span className="truncate">{formatWaktu(r.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-4 shrink-0">
                                <div className="text-sm text-gray-700">
                                  <span className="font-semibold">{r.tinggi_cm}</span> cm
                                </div>
                                <div className="text-sm text-gray-700">
                                  <span className="font-semibold">{r.berat_kg}</span> kg
                                </div>
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                                  {getStatusLabel(r.status_gizi)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 text-sm">Belum ada riwayat pemindaian</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showDelete && anak && (
        <DeleteConfirmModal
          title="Hapus anak ini?"
          description={
            <>
              Data <span className="font-semibold">{anak.nama}</span> dan seluruh riwayat scan-nya akan dihapus secara{' '}
              <span className="font-semibold text-red-600">permanen</span>.
            </>
          }
          onCancel={() => setShowDelete(false)}
          onConfirm={async () => {
            await deleteAnak(nik);
            router.push('/anak');
          }}
        />
      )}
    </Layout>
  );
}

export default function AnakDetailPage() {
  return (
    <ProtectedRoute>
      <AnakDetailPageContent />
    </ProtectedRoute>
  );
}