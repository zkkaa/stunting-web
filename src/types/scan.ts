// Tipe untuk fitur Scan (versi login, per-anak). Beda dari scanPublik.ts:
// di sini nik & snapshot anak ikut dibawa, dan hasilnya BISA disimpan ke DB
// (riwayat_scan) via tombol "Simpan" di halaman hasil.

import { Gender } from '@/lib/stuntingCalculator';

export type { Gender };

export interface ScanResult {
  nik: string;
  anakNama: string;
  anakGender: Gender;
  ageDays: number; // usia anak (hari) dihitung SEKALI saat capture, dipakai konsisten sampai simpan
  originalImage: string; // data URL
  annotatedImage: string | null; // data URL
  heightCm: number;
  weightKg: number; // input manual
  confidence: number;
}

export const SESSION_KEY_SCAN_RESULT = 'privateScanResult';