import { Gender } from '@/lib/stuntingCalculator';

export type { Gender };

export interface Anak {
  nik: string;
  no_kk: string;
  nama: string;
  tempat_lahir: string | null;
  tanggal_lahir: string; // ISO date (yyyy-mm-dd), wajib
  gender: Gender;
  bb_lahir: number | null;
  tb_lahir: number | null;
  lk_lahir: number | null;
  foto_profil: string | null; // public URL dari bucket 'anak'
  aktif: boolean;
  created_at: string;
  updated_at: string;
}

// Payload untuk form "Tambah Anak" - no_kk dipilih dari orang tua yang sudah ada
export interface NewAnakPayload {
  nik: string;
  no_kk: string;
  nama: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  gender: Gender;
  bb_lahir?: number;
  tb_lahir?: number;
  lk_lahir?: number;
}

export interface UpdateAnakPayload {
  nama: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  gender: Gender;
  bb_lahir?: number;
  tb_lahir?: number;
  lk_lahir?: number;
}

// Bentuk gabungan untuk kartu/list anak di halaman scan & anak
export interface AnakWithOrangTua extends Anak {
  orang_tua?: {
    ayah?: string; // nama ayah
    ibu?: string; // nama ibu
  };
}