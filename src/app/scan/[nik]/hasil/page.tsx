'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Layout, ProtectedRoute } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { ScanResult, SESSION_KEY_SCAN_RESULT } from '@/types/scan';
import { insertRiwayatScan } from '@/utils/database';
import {
  calculateHeightStatus,
  calculateWeightStatus,
  getIdealMeasurements,
  getStatusLabel,
  getStatusColor,
  getStatusDescription,
} from '@/lib/stuntingCalculator';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';

function HasilScanContent() {
  const router = useRouter();
  const params = useParams();
  const nikFromUrl = params?.nik as string;
  const { user } = useAuth();

  const [result, setResult] = useState<ScanResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY_SCAN_RESULT);
    if (!raw) {
      router.replace(`/scan/${nikFromUrl}`);
      return;
    }
    const parsed: ScanResult = JSON.parse(raw);
    if (parsed.nik !== nikFromUrl) {
      // Data sesi tidak cocok dengan anak di URL (misal user buka tab lama)
      router.replace(`/scan/${nikFromUrl}`);
      return;
    }
    setResult(parsed);
  }, [router, nikFromUrl]);

  if (!result) return null;

  const heightStatus = calculateHeightStatus(result.heightCm, result.ageDays, result.anakGender);
  const weightStatus = calculateWeightStatus(result.weightKg, result.ageDays, result.anakGender);
  const heightColors = getStatusColor(heightStatus);
  const weightColors = getStatusColor(weightStatus);
  const { idealHeightCm, idealWeightKg } = getIdealMeasurements(result.ageDays, result.anakGender);
  const heightDiff = result.heightCm - idealHeightCm;
  const weightDiff = result.weightKg - idealWeightKg;

  const finalStatus = heightStatus; // status gizi final mengikuti TB/U
  const finalColors = getStatusColor(finalStatus);
  const finalLabel = getStatusLabel(finalStatus);
  const finalDescription = getStatusDescription(finalStatus);

  const ageYears = Math.floor(result.ageDays / 365.25);
  const ageMonthsDisplay = Math.floor((result.ageDays % 365.25) / 30.44);

  const handleSimpan = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await insertRiwayatScan({
        nik: result.nik,
        usia_hari: result.ageDays,
        tinggi_cm: result.heightCm,
        berat_kg: result.weightKg,
        status_tinggi: heightStatus,
        status_berat: weightStatus,
        status_gizi: finalStatus,
        confidence: result.confidence,
        dibuat_oleh: user?.id,
      });
      sessionStorage.removeItem(SESSION_KEY_SCAN_RESULT);
      setSaved(true);
    } catch (err) {
      console.error('Gagal menyimpan riwayat scan:', err);
      setSaveError('Gagal menyimpan hasil. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleBatal = () => {
    sessionStorage.removeItem(SESSION_KEY_SCAN_RESULT);
    router.push(`/scan/${result.nik}`);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
          <button
            onClick={() => router.push('/scan')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 text-sm"
          >
            <FiArrowLeft className="w-4 h-4" />
            Kembali ke daftar anak
          </button>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 sm:px-8 pt-8 pb-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-900">Hasil Analisis</h1>
              <p className="text-center text-sm text-gray-400 mt-2">{result.anakNama}</p>
            </div>

            <div className="px-6 sm:px-8 pb-8">
              <p className="text-center text-sm text-gray-500 mb-6">
                Usia saat pemeriksaan: <span className="font-medium text-gray-700">
                  {ageYears > 0 ? `${ageYears} tahun ` : ''}{ageMonthsDisplay} bulan
                </span>
                {' · '}
                {result.anakGender === 'L' ? 'Laki-laki' : 'Perempuan'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Foto Asli</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result.originalImage} alt="Asli" className="w-full rounded-xl border border-gray-200" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Hasil Deteksi</p>
                  {result.annotatedImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={result.annotatedImage} alt="Deteksi" className="w-full rounded-xl border border-gray-200" />
                  ) : (
                    <div className="w-full h-full min-h-37.5 flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-400">
                      Gambar overlay tidak tersedia
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-linear-to-r from-cyan-50 to-blue-50 rounded-xl p-5 border border-cyan-200 text-center">
                  <p className="text-xs text-gray-500 mb-1">Tinggi Badan</p>
                  <p className="text-2xl sm:text-3xl font-bold text-[#407A81]">{result.heightCm} cm</p>
                </div>
                <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 text-center">
                  <p className="text-xs text-gray-500 mb-1">Berat Badan</p>
                  <p className="text-2xl sm:text-3xl font-bold text-[#407A81]">{result.weightKg} kg</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className={`rounded-xl p-5 text-center border ${heightColors.bg} ${heightColors.border}`}>
                  <p className="text-xs text-gray-600 mb-2">Status Gizi (TB/U)</p>
                  <p className={`text-lg font-bold ${heightColors.text}`}>{getStatusLabel(heightStatus)}</p>
                </div>
                <div className={`rounded-xl p-5 text-center border ${weightColors.bg} ${weightColors.border}`}>
                  <p className="text-xs text-gray-600 mb-2">Status Gizi (BB/U)</p>
                  <p className={`text-lg font-bold ${weightColors.text}`}>{getStatusLabel(weightStatus)}</p>
                </div>
              </div>

              <div className="text-center mb-2">
                <p className="text-sm text-gray-600 font-medium mb-3">Kesimpulan</p>
                <div className={`inline-block rounded-full py-3 px-10 shadow-md font-semibold text-lg border ${finalColors.bg} ${finalColors.text} ${finalColors.border}`}>
                  {finalLabel}
                </div>
                <p className="text-sm text-gray-500 mt-4 max-w-md mx-auto">{finalDescription}</p>
                <p className="text-xs text-gray-400 mt-3">Confidence deteksi tinggi: {(result.confidence * 100).toFixed(1)}%</p>
              </div>

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
              </div>

              {saveError && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700 text-center">
                  {saveError}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            {!saved ? (
              <>
                <button
                  onClick={handleBatal}
                  disabled={saving}
                  className="w-full sm:w-auto min-w-60 border-2 border-gray-300 text-gray-600 py-3 px-10 rounded-xl hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleSimpan}
                  disabled={saving}
                  className="w-full sm:w-auto min-w-60 bg-[#407A81] text-white py-3 px-10 rounded-xl hover:bg-[#326269] transition-colors font-semibold shadow-lg disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Hasil'}
                </button>
              </>
            ) : (
              <div className="w-full flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <FiCheck className="w-5 h-5" />
                  Hasil berhasil disimpan
                </div>
                <button
                  onClick={() => router.push('/history')}
                  className="w-full sm:w-auto min-w-60 bg-[#407A81] text-white py-3 px-10 rounded-xl hover:bg-[#326269] transition-colors font-semibold shadow-lg"
                >
                  Lihat Riwayat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function HasilScanPage() {
  return (
    <ProtectedRoute>
      <HasilScanContent />
    </ProtectedRoute>
  );
}