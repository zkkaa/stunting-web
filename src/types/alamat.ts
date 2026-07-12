export interface Alamat {
  id: string;
  no_kk: string;
  provinsi: string | null;
  kota: string | null;
  kecamatan: string | null;
  desa: string | null;
  jalan: string | null;
  kode_pos: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewAlamat {
  no_kk: string;
  provinsi: string;
  kota: string;
  kecamatan: string;
  desa: string;
  jalan: string;
  kode_pos: string;
}