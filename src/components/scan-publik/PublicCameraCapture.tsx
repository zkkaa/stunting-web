'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiCamera, FiUpload, FiRefreshCw } from 'react-icons/fi';

interface PublicCameraCaptureProps {
  onImageReady: (dataUrl: string) => void; // dipanggil tiap ada foto baru (capture/upload)
  onReset: () => void; // dipanggil saat user klik "Ambil Ulang"
  capturedImage: string | null; // dikontrol dari parent, supaya bisa direset dari luar
}

type Mode = 'modal' | 'camera' | 'uploaded';

export default function PublicCameraCapture({
  onImageReady,
  onReset,
  capturedImage,
}: PublicCameraCaptureProps) {
  // Modal pilihan tampil otomatis begitu komponen ini dimount (masuk halaman scan-publik),
  // selama belum ada foto sama sekali. Ini meniru pola modal "Pilih Camera Pemindaian"
  // di fitur scan yang butuh login.
  const [mode, setMode] = useState<Mode>('modal');
  const [isInitializing, setIsInitializing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopStream = useCallback(() => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    return () => stopStream(); // cleanup saat unmount
  }, [stopStream]);

  // Kalau parent me-reset capturedImage jadi null (misal lewat tombol "Ambil Ulang" di
  // halaman lain / handleResetAll), munculkan lagi modal pilihan.
  useEffect(() => {
    if (!capturedImage && mode === 'uploaded') {
      setMode('modal');
    }
  }, [capturedImage, mode]);

  const startCamera = async () => {
    setCameraError(null);
    setMode('camera');
    setIsInitializing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError('Tidak dapat mengakses kamera. Periksa izin kamera pada browser/device.');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleChooseCamera = () => {
    startCamera();
  };

  const handleChooseUpload = () => {
    setMode('uploaded'); // set dulu supaya modal hilang, file input dipicu langsung setelahnya
    fileInputRef.current?.click();
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    stopStream();
    onImageReady(dataUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      // User membatalkan dialog upload -> kembali ke modal pilihan
      setMode('modal');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onImageReady(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    stopStream();
    setMode('modal');
    setCameraError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onReset();
  };

  const handleCancelCamera = () => {
    stopStream();
    setCameraError(null);
    setMode('modal');
  };

  // ----- Sudah ada hasil foto (dari kamera atau upload) -----
  if (capturedImage) {
    return (
      <div className="w-full">
        <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 bg-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={capturedImage} alt="Hasil foto" className="w-full max-h-105 object-contain mx-auto" />
        </div>
        <button
          onClick={handleReset}
          className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-[#407A81] text-[#407A81] hover:bg-[#E7F5F7] font-medium"
        >
          <FiRefreshCw className="w-4 h-4" />
          Ambil Ulang
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  // ----- Mode kamera aktif -----
  if (mode === 'camera') {
    return (
      <div className="w-full">
        <div className="relative w-full rounded-xl overflow-hidden bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-105 object-contain mx-auto" />
          {isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white text-sm">Menginisialisasi kamera...</div>
            </div>
          )}
          {/* Garis panduan tengah */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-px h-2/3 bg-cyan-400/60" />
          </div>
        </div>

        {cameraError && (
          <p className="mt-2 text-sm text-red-600">{cameraError}</p>
        )}

        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleCapture}
            disabled={isInitializing || !!cameraError}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-[#407A81] text-white hover:bg-[#326269] disabled:opacity-50 font-medium"
          >
            <FiCamera className="w-5 h-5" />
            Ambil Foto
          </button>
          <button
            onClick={handleCancelCamera}
            className="px-4 py-3 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium"
          >
            Batal
          </button>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // ----- Modal pilihan (default saat masuk halaman / setelah reset) -----
  return (
    <>
      {/* Placeholder di balik modal, supaya layout halaman tidak "kosong" saat modal terbuka */}
      <div className="w-full py-10 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-sm text-gray-400">
        Belum ada foto — pilih metode pemindaian
      </div>

      <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto shadow-xl">
          <h2 className="text-xl font-semibold text-center text-gray-900 mb-6">
            Pilih Metode Pemindaian
          </h2>

          <div className="space-y-4">
            <button
              onClick={handleChooseCamera}
              className="w-full inline-flex items-center justify-center gap-2 border-2 border-[#407A81] text-[#407A81] py-3 px-6 rounded-lg hover:bg-[#407A81] hover:text-white transition-colors font-medium"
            >
              <FiCamera className="w-5 h-5" />
              Gunakan Kamera
            </button>

            <button
              onClick={handleChooseUpload}
              className="w-full inline-flex items-center justify-center gap-2 border-2 border-[#407A81] text-[#407A81] py-3 px-6 rounded-lg hover:bg-[#407A81] hover:text-white transition-colors font-medium"
            >
              <FiUpload className="w-5 h-5" />
              Upload Foto
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    </>
  );
}