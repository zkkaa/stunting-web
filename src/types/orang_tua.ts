import { Alamat } from './alamat';

export type RoleOrangTua = 'ayah' | 'ibu';

export interface OrangTua {
  nik: string;
  no_kk: string;
  nama: string;
  role: RoleOrangTua;
  tempat_lahir: string | null;
  tanggal_lahir: string | null; // ISO date (yyyy-mm-dd)
  no_hp: string | null;
  foto_profil: string | null; // public URL dari bucket 'orang-tua'
  created_at: string;
  updated_at: string;
}

// Payload untuk form "Tambah Orang Tua" - ayah & ibu diisi sekaligus per KK
export interface NewOrangTuaPayload {
  no_kk: string;
  ayah: {
    nik: string;
    nama: string;
    tempat_lahir: string;
    tanggal_lahir: string;
    no_hp: string;
  };
  ibu: {
    nik: string;
    nama: string;
    tempat_lahir: string;
    tanggal_lahir: string;
    no_hp: string;
  };
  alamat: {
    provinsi: string;
    kota: string;
    kecamatan: string;
    desa: string;
    jalan: string;
    kode_pos: string;
  };
}

// Bentuk gabungan yang sering dipakai di halaman detail/list (keluarga + ayah + ibu + alamat + jumlah anak)
export interface KeluargaDetail {
  no_kk: string;
  created_at: string;
  ayah: OrangTua | null;
  ibu: OrangTua | null;
  alamat: Alamat | null;
  jumlah_anak: number;
}