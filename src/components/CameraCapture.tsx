'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiCamera, FiUpload, FiRefreshCw } from 'react-icons/fi';

interface CameraCaptureProps {
  onImageReady: (dataUrl: string) => void;
  onReset: () => void;
  capturedImage: string | null;
}

type Mode = 'choose' | 'camera';

export default function CameraCapture({ onImageReady, onReset, capturedImage }: CameraCaptureProps) {
  const [mode, setMode] = useState<Mode>('choose');
  const [isInitializing, setIsInitializing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const isStartingCameraRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopStream = useCallback(() => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  const startCamera = async () => {
    if (isStartingCameraRef.current) return;
    isStartingCameraRef.current = true;

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
      isStartingCameraRef.current = false;
    }
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (video.videoWidth === 0) {
      setCameraError('Kamera belum siap. Tunggu sebentar lalu coba lagi.');
      return;
    }

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
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onImageReady(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    stopStream();
    setMode('choose');
    setCameraError(null);
    isStartingCameraRef.current = false;
    if (fileInputRef.current) fileInputRef.current.value = '';
    onReset();
  };

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
      </div>
    );
  }

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
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-px h-2/3 bg-cyan-400/60" />
          </div>
        </div>

        {cameraError && <p className="mt-2 text-sm text-red-600">{cameraError}</p>}

        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleCapture}
            disabled={isInitializing}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-[#407A81] text-white hover:bg-[#326269] disabled:opacity-50 font-medium"
          >
            <FiCamera className="w-5 h-5" />
            Ambil Foto
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-3 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium"
          >
            Batal
          </button>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button
        onClick={startCamera}
        className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-[#407A81] text-[#407A81] hover:bg-[#E7F5F7] transition-colors"
      >
        <FiCamera className="w-8 h-8" />
        <span className="font-medium">Gunakan Kamera</span>
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
      >
        <FiUpload className="w-8 h-8" />
        <span className="font-medium">Upload Foto</span>
      </button>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
    </div>
  );
}