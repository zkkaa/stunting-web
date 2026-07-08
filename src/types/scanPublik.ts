// Tipe khusus untuk fitur Scan Publik (sebelum login)
// Model: YOLO pose (Candra) - hanya bertugas ukur tinggi badan dari foto.
// Klasifikasi status gizi (TB/U & BB/U) dihitung 100% di frontend memakai
// stuntingCalculator.ts (WHO LMS method) - TIDAK ada data anak (tanggal lahir,
// gender, berat) yang dikirim ke API Candra, demi keamanan data karena
// endpoint masih lewat Cloudflare Tunnel prototype.

import { Gender } from '@/lib/stuntingCalculator';

export type { Gender };

// Request ke API Candra - sengaja minimal, cuma yang dibutuhkan model pose estimation
export interface ScanPublikRequest {
  image: string; // base64 JPEG, tanpa prefix data:image/...;base64,
  distance_cm: number;
}

// Response dari API Candra - hanya data pengukuran mentah, TANPA klasifikasi apapun
export interface ScanPublikResponse {
  height_cm: number;
  confidence: number;
  annotated_image: string | null; // base64 JPEG tanpa prefix, bisa null
}

// Data yang dioper dari halaman /scan-publik ke halaman hasil, lewat sessionStorage.
// Semua field di sini murni hasil pengukuran + kalkulasi lokal - tidak pernah
// dikirim ke server manapun.
export interface PublicScanResult {
  originalImage: string; // data URL (dengan prefix), untuk ditampilkan <img>
  annotatedImage: string | null; // data URL (dengan prefix), untuk ditampilkan <img>
  heightCm: number;
  weightKg: number; // input manual dari user
  confidence: number;
  tanggalLahir: string; // ISO date string (yyyy-mm-dd), untuk ditampilkan ulang di halaman hasil
  gender: Gender;
}

export const SESSION_KEY_SCAN_RESULT = 'publicScanResult';