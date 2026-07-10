'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components';
import { PublicScanResult, SESSION_KEY_SCAN_RESULT } from '@/types/scanPublik';
import {
  calculateAgeInDays,
  calculateHeightStatus,
  calculateWeightStatus,
  getIdealMeasurements,
  getStatusLabel,
  getStatusColor,
  getStatusDescription,
} from '@/lib/stuntingCalculator';

export default function HasilAnalisisPublikPage() {
  const router = useRouter();
  const [result, setResult] = useState<PublicScanResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY_SCAN_RESULT);
    if (!raw) {
      // Tidak ada data hasil scan (misal akses langsung tanpa scan dulu)
      router.replace('/scan-publik');
      return;
    }
    setResult(JSON.parse(raw));
  }, [router]);

  const handleSelesai = () => {
    sessionStorage.removeItem(SESSION_KEY_SCAN_RESULT); // hasil dibuang, tidak disimpan ke DB
    router.push('/scan-publik');
  };

  if (!result) return null; // sedang redirect / belum load

  // ---- Kalkulasi status gizi 100% di browser, tidak ada data yang dikirim kemana-mana ----
  const ageDays = calculateAgeInDays(result.tanggalLahir);
  const heightStatus = calculateHeightStatus(result.heightCm, ageDays, result.gender);
  const weightStatus = calculateWeightStatus(result.weightKg, ageDays, result.gender);
  const heightColors = getStatusColor(heightStatus);
  const weightColors = getStatusColor(weightStatus);
  const { idealHeightCm, idealWeightKg } = getIdealMeasurements(ageDays, result.gender);
  const heightDiff = result.heightCm - idealHeightCm;
  const weightDiff = result.weightKg - idealWeightKg;

  // Status gizi final = status TB/U (fokus utama: deteksi stunting), sesuai stuntingCalculator.ts
  const finalStatus = heightStatus;
  const finalColors = getStatusColor(finalStatus);
  const finalLabel = getStatusLabel(finalStatus);
  const finalDescription = getStatusDescription(finalStatus);

  const ageYears = Math.floor(ageDays / 365.25);
  const ageMonthsDisplay = Math.floor((ageDays % 365.25) / 30.44);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 sm:px-8 pt-8 pb-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-900">
                Hasil Analisis
              </h1>
              <p className="text-center text-sm text-gray-400 mt-2">
                Hasil ini tidak disimpan — hanya untuk pengecekan sesaat
              </p>
            </div>

            <div className="px-6 sm:px-8 pb-8">
              {/* Info usia singkat */}
              <p className="text-center text-sm text-gray-500 mb-6">
                Usia saat pemeriksaan: <span className="font-medium text-gray-700">
                  {ageYears > 0 ? `${ageYears} tahun ` : ''}{ageMonthsDisplay} bulan
                </span>
                {' · '}
                {result.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
              </p>

              {/* Gambar */}
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

              {/* Ukuran */}
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

              {/* Status TB/U & BB/U */}
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

              {/* Kesimpulan umum - mengikuti status TB/U (fokus utama: deteksi stunting) */}
              <div className="text-center mb-2">
                <p className="text-sm text-gray-600 font-medium mb-3">Kesimpulan</p>
                <div className={`inline-block rounded-full py-3 px-10 shadow-md font-semibold text-lg border ${finalColors.bg} ${finalColors.text} ${finalColors.border}`}>
                  {finalLabel}
                </div>
                <p className="text-sm text-gray-500 mt-4 max-w-md mx-auto">{finalDescription}</p>
                <p className="text-xs text-gray-400 mt-3">Confidence deteksi tinggi: {(result.confidence * 100).toFixed(1)}%</p>
              </div>
              {/* Tinggi & Berat Ideal — ditambahkan setelah blok Kesimpulan, sebelum </div> penutup px-6 sm:px-8 pb-8 */}
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
                  Nilai ideal merujuk pada median (nilai tengah) standar pertumbuhan WHO untuk usia {ageYears > 0 ? `${ageYears} tahun ` : ''}{ageMonthsDisplay} bulan, {result.gender === 'L' ? 'laki-laki' : 'perempuan'}.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={handleSelesai}
              className="w-full sm:w-auto min-w-60 bg-[#407A81] text-white py-3 px-10 rounded-xl hover:bg-[#326269] transition-colors font-semibold shadow-lg"
            >
              Selesai
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}