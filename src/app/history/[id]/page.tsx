'use client';

import React, { useEffect, useState } from 'react';
import { Layout, ProtectedRoute } from '@/components';
import { useRouter, useParams } from 'next/navigation';
import { FiArrowLeft, FiTrash2, FiUser } from 'react-icons/fi';
import { fetchRiwayatScanDetail, deleteRiwayatScan } from '@/utils/database';
import { getIdealMeasurements, getStatusColor, getStatusLabel, getStatusDescription } from '@/lib/stuntingCalculator';
import { RiwayatScanWithAnak } from '@/types';

function formatUsiaDariHari(usiaHari: number): { label: string; tahun: number; bulan: number } {
  const tahun = Math.floor(usiaHari / 365.25);
  const bulan = Math.floor((usiaHari % 365.25) / 30.44);
  let label: string;
  if (tahun === 0 && bulan === 0) label = 'Baru lahir';
  else if (tahun === 0) label = `${bulan} Bulan`;
  else if (bulan === 0) label = `${tahun} Tahun`;
  else label = `${tahun} Tahun ${bulan} Bulan`;
  return { label, tahun, bulan };
}

function formatTanggalWaktu(dateString: string): { tanggal: string; jam: string } {
  const date = new Date(dateString);
  return {
    tanggal: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
    jam: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB',
  };
}

function HistoryDetailContent() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [record, setRecord] = useState<RiwayatScanWithAnak | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchRiwayatScanDetail(id);
        if (!data) {
          setNotFound(true);
        } else {
          setRecord(data);
        }
      } catch (err) {
        console.error('Error loading detail riwayat:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleDelete = async () => {
    if (!record || deleting) return;
    try {
      setDeleting(true);
      await deleteRiwayatScan(record.id);
      router.push('/history');
    } catch (err) {
      console.error('Gagal menghapus riwayat:', err);
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#407A81]" />
        </div>
      </Layout>
    );
  }

  if (notFound || !record) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-gray-500 text-sm">Data riwayat tidak ditemukan.</p>
          <button onClick={() => router.push('/history')} className="text-[#407A81] hover:underline text-sm">
            Kembali ke Riwayat
          </button>
        </div>
      </Layout>
    );
  }

  const { label: usiaLabel } = formatUsiaDariHari(record.usia_hari);
  const { tanggal, jam } = formatTanggalWaktu(record.created_at);

  const heightColors = getStatusColor(record.status_tinggi);
  const weightColors = getStatusColor(record.status_berat);
  const finalColors = getStatusColor(record.status_gizi);
  const finalLabel = getStatusLabel(record.status_gizi);
  const finalDescription = getStatusDescription(record.status_gizi);

  const { idealHeightCm, idealWeightKg } = getIdealMeasurements(record.usia_hari, record.anak.gender);
  const heightDiff = record.tinggi_cm - idealHeightCm;
  const weightDiff = record.berat_kg - idealWeightKg;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
          <button
            onClick={() => router.push('/history')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 text-sm"
          >
            <FiArrowLeft className="w-4 h-4" />
            Kembali ke Riwayat
          </button>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 sm:px-8 pt-8 pb-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[#E5F3F5] flex items-center justify-center text-[#397789] mx-auto mb-3">
                <FiUser size={28} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{record.anak.nama}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {usiaLabel} · {record.anak.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
              </p>
            </div>

            <div className="px-6 sm:px-8 pb-8">
              {/* Waktu pemeriksaan */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className="bg-[#F1F8F9] rounded-lg px-4 py-2 text-sm font-medium text-gray-700">{tanggal}</div>
                <div className="bg-[#9ECAD6] text-white rounded-lg px-4 py-2 text-sm font-medium">{jam}</div>
              </div>

              {/* Ukuran */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-linear-to-r from-cyan-50 to-blue-50 rounded-xl p-5 border border-cyan-200 text-center">
                  <p className="text-xs text-gray-500 mb-1">Tinggi Badan</p>
                  <p className="text-2xl sm:text-3xl font-bold text-[#407A81]">{record.tinggi_cm} cm</p>
                </div>
                <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 text-center">
                  <p className="text-xs text-gray-500 mb-1">Berat Badan</p>
                  <p className="text-2xl sm:text-3xl font-bold text-[#407A81]">{record.berat_kg} kg</p>
                </div>
              </div>

              {/* Status TB/U & BB/U */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className={`rounded-xl p-5 text-center border ${heightColors.bg} ${heightColors.border}`}>
                  <p className="text-xs text-gray-600 mb-2">Status Gizi (TB/U)</p>
                  <p className={`text-lg font-bold ${heightColors.text}`}>{getStatusLabel(record.status_tinggi)}</p>
                </div>
                <div className={`rounded-xl p-5 text-center border ${weightColors.bg} ${weightColors.border}`}>
                  <p className="text-xs text-gray-600 mb-2">Status Gizi (BB/U)</p>
                  <p className={`text-lg font-bold ${weightColors.text}`}>{getStatusLabel(record.status_berat)}</p>
                </div>
              </div>

              {/* Kesimpulan */}
              <div className="text-center mb-2">
                <p className="text-sm text-gray-600 font-medium mb-3">Kesimpulan</p>
                <div className={`inline-block rounded-full py-3 px-10 shadow-md font-semibold text-lg border ${finalColors.bg} ${finalColors.text} ${finalColors.border}`}>
                  {finalLabel}
                </div>
                <p className="text-sm text-gray-500 mt-4 max-w-md mx-auto">{finalDescription}</p>
                {record.confidence != null && (
                  <p className="text-xs text-gray-400 mt-3">
                    Confidence deteksi tinggi: {(record.confidence * 100).toFixed(1)}%
                  </p>
                )}
              </div>

              {/* Referensi Ideal WHO */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-center text-sm text-gray-600 font-medium mb-4">
                  Referensi Ideal Sesuai Usia &amp; Jenis Kelamin (WHO)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl p-5 border border-gray-200 bg-gray-50 text-center">
                    <p className="text-xs text-gray-500 mb-1">Tinggi Badan Ideal</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-800">{idealHeightCm} cm</p>
                    <p className={`text-xs mt-2 font-medium ${heightDiff >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                      {heightDiff >= 0 ? '+' : ''}{heightDiff.toFixed(1)} cm dari ideal
                    </p>
                  </div>
                  <div className="rounded-xl p-5 border border-gray-200 bg-gray-50 text-center">
                    <p className="text-xs text-gray-500 mb-1">Berat Badan Ideal</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-800">{idealWeightKg} kg</p>
                    <p className={`text-xs mt-2 font-medium ${weightDiff >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                      {weightDiff >= 0 ? '+' : ''}{weightDiff.toFixed(1)} kg dari ideal
                    </p>
                  </div>
                </div>
                <p className="text-center text-xs text-gray-400 mt-4">
                  Nilai ideal merujuk pada median (nilai tengah) standar pertumbuhan WHO untuk usia {usiaLabel}, {record.anak.gender === 'L' ? 'laki-laki' : 'perempuan'}.
                </p>
              </div>
            </div>
          </div>

          {/* Aksi */}
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full sm:w-auto min-w-60 inline-flex items-center justify-center gap-2 bg-white border-2 border-red-500 text-red-500 py-3 px-10 rounded-xl hover:bg-red-50 transition-colors font-semibold"
            >
              <FiTrash2 className="w-5 h-5" />
              Hapus Riwayat
            </button>
          </div>
        </div>
      </div>

      {/* Modal konfirmasi hapus */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTrash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Hapus Riwayat?</h3>
              <p className="text-gray-600 mb-6 text-sm">
                Data riwayat pemindaian ini akan dihapus permanen dan tidak dapat dikembalikan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors font-semibold disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
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

export default function HistoryDetailPage() {
  return (
    <ProtectedRoute>
      <HistoryDetailContent />
    </ProtectedRoute>
  );
}