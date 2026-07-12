import { HeightStatus, WeightStatus, NutritionStatus } from '@/lib/stuntingCalculator';

export interface RiwayatScan {
  id: string;
  nik: string;
  usia_hari: number;
  tinggi_cm: number;
  berat_kg: number;
  status_tinggi: HeightStatus;
  status_berat: WeightStatus;
  status_gizi: NutritionStatus;
  confidence: number | null;
  dibuat_oleh: string | null;
  created_at: string;
}

// Payload insert - TIDAK ADA field gambar, sesuai keputusan gambar tidak disimpan ke DB
export interface NewRiwayatScanPayload {
  nik: string;
  usia_hari: number;
  tinggi_cm: number;
  berat_kg: number;
  status_tinggi: HeightStatus;
  status_berat: WeightStatus;
  status_gizi: NutritionStatus;
  confidence?: number;
  dibuat_oleh?: string;
}

// Bentuk gabungan untuk tabel History (riwayat_scan + identitas anak)
export interface RiwayatScanWithAnak extends RiwayatScan {
  anak: {
    nama: string;
    gender: 'L' | 'P';
    tanggal_lahir: string;
  };
}