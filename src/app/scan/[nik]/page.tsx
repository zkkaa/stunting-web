'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Layout, ProtectedRoute } from '@/components';
import CameraCapture from '@/components/CameraCapture';
import { fetchAnakByNik } from '@/utils/database';
import { calculateAgeInDays, calculateAgeInMonths } from '@/lib/stuntingCalculator';
import { callScanApi, checkVilionHealth, DEFAULT_SCAN_API_URL } from '@/utils/scanPublikApi';
import { ScanResult, SESSION_KEY_SCAN_RESULT } from '@/types/scan';
import { Anak } from '@/types';
import { FiChevronDown, FiArrowRightCircle, FiArrowLeft, FiUser } from 'react-icons/fi';

const MIN_DISTANCE = 1;
const MAX_DISTANCE = 300;

function formatUmur(tanggalLahir: string): string {
  const totalBulan = calculateAgeInMonths(tanggalLahir);
  const tahun = Math.floor(totalBulan / 12);
  const bulan = totalBulan % 12;
  if (tahun === 0 && bulan === 0) return 'Baru lahir';
  if (tahun === 0) return `${bulan} Bulan`;
  if (bulan === 0) return `${tahun} Tahun`;
  return `${tahun} Tahun ${bulan} Bulan`;
}

function ScanCaptureContent() {
  const router = useRouter();
  const params = useParams();
  const nik = params?.nik as string;

  const [anak, setAnak] = useState<Anak | null>(null);
  const [loadingAnak, setLoadingAnak] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [endpointUrl, setEndpointUrl] = useState(DEFAULT_SCAN_API_URL);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [distanceCm, setDistanceCm] = useState(150);
  const [weightKg, setWeightKg] = useState<number>(0);

  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingAnak(true);
        const data = await fetchAnakByNik(nik);
        if (!data) {
          setNotFound(true);
        } else {
          setAnak(data);
        }
      } catch (err) {
        console.error('Error loading anak:', err);
        setNotFound(true);
      } finally {
        setLoadingAnak(false);
      }
    };
    if (nik) load();
  }, [nik]);

  const handleCheckHealth = async () => {
    setIsCheckingHealth(true);
    setHealthStatus(null);
    const result = await checkVilionHealth(endpointUrl);
    setHealthStatus(result);
    setIsCheckingHealth(false);
  };

  const isFormValid = !!capturedImage && weightKg > 0 && !!endpointUrl.trim();

  const handleScan = async () => {
    if (!capturedImage || !anak) return;
    setIsScanning(true);
    setErrorMsg(null);

    try {
      const base64Raw = capturedImage.split(',')[1] || '';

      const response = await callScanApi(endpointUrl, {
        image: base64Raw,
        distance_cm: distanceCm,
      });

      const result: ScanResult = {
        nik: anak.nik,
        anakNama: anak.nama,
        anakGender: anak.gender,
        ageDays: calculateAgeInDays(anak.tanggal_lahir),
        originalImage: capturedImage,
        annotatedImage: response.annotated_image
          ? `data:image/jpeg;base64,${response.annotated_image}`
          : null,
        heightCm: response.height_cm,
        weightKg,
        confidence: response.confidence,
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
    router.push(`/scan/${scanResult.nik}/hasil`);
  };

  const handleResetAll = () => {
    setCapturedImage(null);
    setScanResult(null);
    setErrorMsg(null);
  };

  if (loadingAnak) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#407A81]" />
        </div>
      </Layout>
    );
  }

  if (notFound || !anak) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-gray-500 text-sm">Data anak tidak ditemukan.</p>
          <button
            onClick={() => router.push('/scan')}
            className="text-[#407A81] cursor-pointer hover:underline text-sm"
          >
            Kembali ke daftar anak
          </button>
        </div>
      </Layout>
    );
  }

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
            <button
              onClick={() => router.push('/scan')}
              className="flex cursor-pointer items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 text-sm"
            >
              <FiArrowLeft className="w-4 h-4" />
              Kembali
            </button>

            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-black mb-3">Scan Anak</h1>
              <p className="text-gray-600 max-w-xl mx-auto text-sm sm:text-base">
                Ambil atau unggah foto anak, lengkapi data di bawah, lalu jalankan pemindaian.
              </p>
            </div>

            {/* Kartu identitas anak */}
            <div
              className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 mb-6 flex items-center gap-4"
              style={{ boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D' }}
            >
              <div className="w-14 h-14 rounded-full overflow-hidden bg-[#E5F3F5] flex items-center justify-center text-[#397789] shrink-0">
                {anak.foto_profil ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={anak.foto_profil} alt={anak.nama} className="w-full h-full object-cover" />
                ) : (
                  <FiUser size={24} />
                )}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{anak.nama}</h2>
                <p className="text-xs text-[#407A81] font-medium mt-0.5">
                  {anak.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{formatUmur(anak.tanggal_lahir)}</p>
              </div>
            </div>

            <div
              className="bg-white rounded-2xl p-5 sm:p-8 border border-gray-200"
              style={{ boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D' }}
            >
              {/* Foto */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-800 mb-2">Foto Anak</label>
                <CameraCapture
                  capturedImage={capturedImage}
                  onImageReady={(dataUrl) => setCapturedImage(dataUrl)}
                  onReset={handleResetAll}
                />
              </div>

              {/* Berat badan - manual sampai timbangan IoT terhubung */}
              <div className="mb-6">
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

              {/* Advanced: endpoint URL */}
              <div className="mb-6 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex cursor-pointer items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
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
                        className="px-3 cursor-pointer py-2 rounded-md border border-[#407A81] text-[#407A81] text-xs font-medium hover:bg-[#E7F5F7] disabled:opacity-50 whitespace-nowrap"
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

              {!scanResult ? (
                <button
                  onClick={handleScan}
                  disabled={!isFormValid || isScanning}
                  className="w-full cursor-pointer py-3 rounded-md bg-[#407A81] text-white font-semibold hover:bg-[#326269] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isScanning ? 'Memproses...' : 'Scan Sekarang'}
                </button>
              ) : (
                <button
                  onClick={handleContinue}
                  className="w-full cursor-pointer inline-flex items-center justify-center gap-2 py-3 rounded-md bg-[#407A81] text-white font-semibold hover:bg-[#326269] transition-colors"
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

export default function ScanCapturePage() {
  return (
    <ProtectedRoute>
      <ScanCaptureContent />
    </ProtectedRoute>
  );
}