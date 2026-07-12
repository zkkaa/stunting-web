'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components';
import PublicCameraCapture from '@/components/CameraCapture';
import { PublicScanResult, SESSION_KEY_SCAN_RESULT } from '@/types/scanPublik';
import { Gender } from '@/lib/stuntingCalculator';
import { FiChevronDown, FiArrowRightCircle } from 'react-icons/fi';
import { callScanApi, checkVilionHealth, DEFAULT_SCAN_API_URL } from '@/utils/scanPublikApi';

const MIN_DISTANCE = 1;
const MAX_DISTANCE = 300;

export default function ScanPublikPage() {
  const router = useRouter();

  // Input form
  const [endpointUrl, setEndpointUrl] = useState(DEFAULT_SCAN_API_URL);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [distanceCm, setDistanceCm] = useState(150);
  const [tanggalLahir, setTanggalLahir] = useState<string>(''); // yyyy-mm-dd
  const [gender, setGender] = useState<Gender>('L');
  const [weightKg, setWeightKg] = useState<number>(0);

  // Hasil scan (tampil inline di halaman yang sama sebelum lanjut ke hasil analisis)
  const [scanResult, setScanResult] = useState<PublicScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Tambahkan state baru di atas, dekat state lain:
  const [healthStatus, setHealthStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const handleCheckHealth = async () => {
    setIsCheckingHealth(true);
    setHealthStatus(null);
    const result = await checkVilionHealth(endpointUrl);
    setHealthStatus(result);
    setIsCheckingHealth(false);
  };

  const isFormValid =
    !!capturedImage && !!tanggalLahir && weightKg > 0 && !!endpointUrl.trim();

  const handleScan = async () => {
    if (!capturedImage) return;
    setIsScanning(true);
    setErrorMsg(null);

    try {
      // Convert dataURL captured/uploaded jadi base64 murni (tanpa prefix)
      const base64Raw = capturedImage.split(',')[1] || '';

      // Request ke API HANYA kirim image + distance_cm. Tanggal lahir, gender,
      // berat badan sengaja TIDAK ikut dikirim - semua klasifikasi dihitung
      // lokal di bawah, setelah height_cm didapat dari API.
      const response = await callScanApi(endpointUrl, {
        image: base64Raw,
        distance_cm: distanceCm,
      });

      const result: PublicScanResult = {
        originalImage: capturedImage,
        annotatedImage: response.annotated_image
          ? `data:image/jpeg;base64,${response.annotated_image}`
          : null,
        heightCm: response.height_cm,
        weightKg,
        confidence: response.confidence,
        tanggalLahir,
        gender,
      };

      setScanResult(result);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses scan.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleContinue = () => {
    if (!scanResult) return;
    sessionStorage.setItem(SESSION_KEY_SCAN_RESULT, JSON.stringify(scanResult));
    router.push('/scan-publik/hasil');
  };

  const handleResetAll = () => {
    setCapturedImage(null);
    setScanResult(null);
    setErrorMsg(null);
  };

  return (
    <Layout>
      <div className="min-h-screen relative overflow-x-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-60 z-0"
          style={{
            background: `radial-gradient(ellipse at center top, rgba(158, 202, 214, 0.6) 0%, rgba(158, 202, 214, 0.3) 30%, rgba(158, 202, 214, 0.1) 50%, transparent 70%)`,
          }}
        />

        <div className="relative z-10 py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-black mb-3">Scan Anak</h1>
              <p className="text-gray-600 max-w-xl mx-auto text-sm sm:text-base">
                Ambil atau unggah foto anak, lengkapi data di bawah, lalu jalankan pemindaian.
              </p>
            </div>

            <div
              className="bg-white rounded-2xl p-5 sm:p-8 border border-gray-200"
              style={{ boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D' }}
            >
              {/* Foto */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-800 mb-2">Foto Anak</label>
                <PublicCameraCapture
                  capturedImage={capturedImage}
                  onImageReady={(dataUrl) => setCapturedImage(dataUrl)}
                  onReset={handleResetAll}
                />
              </div>

              {/* Input data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={tanggalLahir}
                    onChange={(e) => setTanggalLahir(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Berat Badan (kg)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={weightKg || ''}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    placeholder="Contoh: 11.5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                  />
                  {/* Catatan: input manual karena sensor timbangan IoT belum siap */}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Kelamin</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender('L')}
                    className={`py-2 rounded-md font-medium border-2 transition-colors ${gender === 'L'
                      ? 'bg-[#407A81] text-white border-[#407A81]'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-[#407A81]'
                      }`}
                  >
                    Laki-laki
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('P')}
                    className={`py-2 rounded-md font-medium border-2 transition-colors ${gender === 'P'
                      ? 'bg-[#407A81] text-white border-[#407A81]'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-[#407A81]'
                      }`}
                  >
                    Perempuan
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jarak Anak dari Kamera: <span className="text-[#407A81] font-semibold">{distanceCm} cm</span>
                </label>
                <input
                  type="range"
                  min={MIN_DISTANCE}
                  max={MAX_DISTANCE}
                  value={distanceCm}
                  onChange={(e) => setDistanceCm(Number(e.target.value))}
                  className="w-full accent-[#407A81]"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{MIN_DISTANCE} cm</span>
                  <span>{MAX_DISTANCE} cm</span>
                </div>
              </div>

              {/* Advanced: endpoint URL - disembunyikan by default */}
              <div className="mb-6 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                >
                  <FiChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  Pengaturan Teknis
                </button>
                {showAdvanced && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Endpoint URL (Cloudflare Tunnel)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={endpointUrl}
                        onChange={(e) => setEndpointUrl(e.target.value)}
                        placeholder="https://random-words.trycloudflare.com"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCheckHealth}
                        disabled={isCheckingHealth || !endpointUrl.trim()}
                        className="px-3 py-2 rounded-md border border-[#407A81] text-[#407A81] text-xs font-medium hover:bg-[#E7F5F7] disabled:opacity-50 whitespace-nowrap"
                      >
                        {isCheckingHealth ? 'Mengecek...' : 'Test Koneksi'}
                      </button>
                    </div>
                    {healthStatus && (
                      <p className={`mt-2 text-xs ${healthStatus.ok ? 'text-green-600' : 'text-red-600'}`}>
                        {healthStatus.ok ? '✓ ' : '✗ '}{healthStatus.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                  {errorMsg}
                </div>
              )}

              {/* Hasil inline sebelum lanjut */}
              {scanResult && (
                <div className="mb-6 border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Hasil Pemindaian</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Foto Asli</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={scanResult.originalImage} alt="Asli" className="w-full rounded-lg border border-gray-200" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Hasil Deteksi</p>
                      {scanResult.annotatedImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={scanResult.annotatedImage} alt="Deteksi" className="w-full rounded-lg border border-gray-200" />
                      ) : (
                        <div className="w-full h-full min-h-37.5 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-400">
                          Gambar overlay tidak tersedia
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#F1F8F9] rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">Tinggi Badan</p>
                      <p className="text-xl font-bold text-[#407A81]">{scanResult.heightCm} cm</p>
                    </div>
                    <div className="bg-[#F1F8F9] rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">Berat Badan</p>
                      <p className="text-xl font-bold text-[#407A81]">{scanResult.weightKg} kg</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tombol aksi */}
              {!scanResult ? (
                <button
                  onClick={handleScan}
                  disabled={!isFormValid || isScanning}
                  className="w-full py-3 rounded-md bg-[#407A81] text-white font-semibold hover:bg-[#326269] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isScanning ? 'Memproses...' : 'Scan Sekarang'}
                </button>
              ) : (
                <button
                  onClick={handleContinue}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-md bg-[#407A81] text-white font-semibold hover:bg-[#326269] transition-colors"
                >
                  Selanjutnya
                  <FiArrowRightCircle className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}