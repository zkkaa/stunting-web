import { supabase } from "@/lib/supabase";
import {
  KeluargaDetail,
  NewOrangTuaPayload,
  OrangTua,
  Alamat,
  Anak,
  AnakWithOrangTua,
  NewAnakPayload,
  UpdateAnakPayload,
  RiwayatScan,
  RiwayatScanWithAnak,
  NewRiwayatScanPayload,
} from "@/types";
import { deleteProfileImage, uploadProfileImage } from "./storage";

// ============================================================================
// KELUARGA & ORANG TUA
// ============================================================================

/** Daftar keluarga untuk halaman list "Orang Tua" - 1 row per KK. */
export async function fetchKeluargaList(): Promise<KeluargaDetail[]> {
  const { data: orangTuaData, error: otError } = await supabase
    .from("orang_tua")
    .select("*");
  if (otError) throw otError;
  if (!orangTuaData || orangTuaData.length === 0) return [];

  const uniqueNoKk = [...new Set(orangTuaData.map((p) => p.no_kk))];

  const { data: anakData, error: anakError } = await supabase
    .from("anak")
    .select("no_kk")
    .eq("aktif", true)
    .in("no_kk", uniqueNoKk);
  if (anakError) throw anakError;

  const { data: alamatData, error: alamatError } = await supabase
    .from("alamat")
    .select("*")
    .in("no_kk", uniqueNoKk);
  if (alamatError) throw alamatError;

  const jumlahAnakMap = new Map<string, number>();
  anakData?.forEach((a) => {
    jumlahAnakMap.set(a.no_kk, (jumlahAnakMap.get(a.no_kk) || 0) + 1);
  });

  const alamatMap = new Map<string, Alamat>();
  alamatData?.forEach((a) => alamatMap.set(a.no_kk, a));

  const result: KeluargaDetail[] = uniqueNoKk.map((no_kk) => {
    const parents = orangTuaData.filter((p) => p.no_kk === no_kk);
    return {
      no_kk,
      ayah: parents.find((p) => p.role === "ayah") || null,
      ibu: parents.find((p) => p.role === "ibu") || null,
      alamat: alamatMap.get(no_kk) || null,
      jumlah_anak: jumlahAnakMap.get(no_kk) || 0,
    };
  });

  return result;
}

/** Detail 1 keluarga (untuk halaman detail/edit orang tua), termasuk daftar anak. */
export async function fetchKeluargaDetail(no_kk: string): Promise<{
  ayah: OrangTua | null;
  ibu: OrangTua | null;
  alamat: Alamat | null;
  anak: Anak[];
}> {
  const [
    { data: orangTuaData, error: otError },
    { data: alamatData, error: alamatError },
    { data: anakData, error: anakError },
  ] = await Promise.all([
    supabase.from("orang_tua").select("*").eq("no_kk", no_kk),
    supabase.from("alamat").select("*").eq("no_kk", no_kk).single(),
    supabase
      .from("anak")
      .select("*")
      .eq("no_kk", no_kk)
      .eq("aktif", true)
      .order("created_at", { ascending: false }),
  ]);

  if (otError) throw otError;
  if (anakError) throw anakError;
  // alamatError diabaikan kalau memang belum ada alamat (single() bisa error "no rows")

  return {
    ayah: orangTuaData?.find((p) => p.role === "ayah") || null,
    ibu: orangTuaData?.find((p) => p.role === "ibu") || null,
    alamat: alamatError ? null : alamatData,
    anak: anakData || [],
  };
}

/** Insert keluarga baru: keluarga -> orang_tua (ayah+ibu) -> alamat, dalam satu alur. */
export async function insertKeluargaWithOrangTua(
  payload: NewOrangTuaPayload,
  fotoAyah?: File,
  fotoIbu?: File,
): Promise<void> {
  const { error: keluargaError } = await supabase
    .from("keluarga")
    .insert({ no_kk: payload.no_kk });
  if (keluargaError) throw keluargaError;

  let fotoAyahUrl: string | null = null;
  let fotoIbuUrl: string | null = null;

  if (fotoAyah) {
    const result = await uploadProfileImage(
      fotoAyah,
      payload.ayah.nik,
      "orang-tua",
    );
    if (result.success) fotoAyahUrl = result.url || null;
  }
  if (fotoIbu) {
    const result = await uploadProfileImage(
      fotoIbu,
      payload.ibu.nik,
      "orang-tua",
    );
    if (result.success) fotoIbuUrl = result.url || null;
  }

  const { error: orangTuaError } = await supabase.from("orang_tua").insert([
    {
      ...payload.ayah,
      no_kk: payload.no_kk,
      role: "ayah",
      foto_profil: fotoAyahUrl,
    },
    {
      ...payload.ibu,
      no_kk: payload.no_kk,
      role: "ibu",
      foto_profil: fotoIbuUrl,
    },
  ]);
  if (orangTuaError) throw orangTuaError;

  const { error: alamatError } = await supabase
    .from("alamat")
    .insert({ ...payload.alamat, no_kk: payload.no_kk });
  if (alamatError) throw alamatError;
}

/** Update data orang tua (ayah dan/atau ibu) + alamat untuk 1 KK. */
export async function updateOrangTuaData(
  no_kk: string,
  updates: {
    ayah?: Partial<
      Pick<OrangTua, "nama" | "tempat_lahir" | "tanggal_lahir" | "no_hp">
    >;
    ibu?: Partial<
      Pick<OrangTua, "nama" | "tempat_lahir" | "tanggal_lahir" | "no_hp">
    >;
    alamat?: Partial<
      Pick<
        Alamat,
        "provinsi" | "kota" | "kecamatan" | "desa" | "jalan" | "kode_pos"
      >
    >;
  },
): Promise<void> {
  if (updates.ayah) {
    const { error } = await supabase
      .from("orang_tua")
      .update(updates.ayah)
      .eq("no_kk", no_kk)
      .eq("role", "ayah");
    if (error) throw error;
  }
  if (updates.ibu) {
    const { error } = await supabase
      .from("orang_tua")
      .update(updates.ibu)
      .eq("no_kk", no_kk)
      .eq("role", "ibu");
    if (error) throw error;
  }
  if (updates.alamat) {
    const { error } = await supabase
      .from("alamat")
      .update(updates.alamat)
      .eq("no_kk", no_kk);
    if (error) throw error;
  }
}

/** Hapus 1 keluarga beserta seluruh data terkait (CASCADE via FK), termasuk foto di storage. */
export async function deleteKeluarga(no_kk: string): Promise<void> {
  const { data: orangTuaData } = await supabase
    .from("orang_tua")
    .select("foto_profil")
    .eq("no_kk", no_kk);

  const { data: anakData } = await supabase
    .from("anak")
    .select("foto_profil")
    .eq("no_kk", no_kk);

  if (orangTuaData) {
    await Promise.all(
      orangTuaData.map((p) => deleteProfileImage(p.foto_profil, "orang-tua")),
    );
  }
  if (anakData) {
    await Promise.all(
      anakData.map((a) => deleteProfileImage(a.foto_profil, "anak")),
    );
  }

  // Hapus keluarga -> CASCADE otomatis menghapus alamat, orang_tua, anak, riwayat_scan terkait
  const { error } = await supabase.from("keluarga").delete().eq("no_kk", no_kk);
  if (error) throw error;
}

// ============================================================================
// ANAK
// ============================================================================

export async function fetchAnakList(): Promise<Anak[]> {
  const { data, error } = await supabase
    .from("anak")
    .select("*")
    .eq("aktif", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchAnakByNik(nik: string): Promise<Anak | null> {
  const { data, error } = await supabase
    .from("anak")
    .select("*")
    .eq("nik", nik)
    .eq("aktif", true)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null; // no rows
    throw error;
  }
  return data;
}

/** Detail anak + nama orang tua, untuk halaman detail anak. */
export async function fetchAnakWithOrangTuaByNik(
  nik: string,
): Promise<AnakWithOrangTua | null> {
  const anak = await fetchAnakByNik(nik);
  if (!anak) return null;

  const { data: orangTuaData } = await supabase
    .from("orang_tua")
    .select("nama, role")
    .eq("no_kk", anak.no_kk);

  return {
    ...anak,
    orang_tua: {
      ayah: orangTuaData?.find((p) => p.role === "ayah")?.nama,
      ibu: orangTuaData?.find((p) => p.role === "ibu")?.nama,
    },
  };
}

/** Insert anak baru - no_kk harus sudah terdaftar di tabel keluarga. */
export async function insertAnak(
  payload: NewAnakPayload,
  fotoAnak?: File,
): Promise<Anak> {
  const { data: keluargaExists, error: checkError } = await supabase
    .from("keluarga")
    .select("no_kk")
    .eq("no_kk", payload.no_kk)
    .limit(1);
  if (checkError) throw checkError;
  if (!keluargaExists || keluargaExists.length === 0) {
    throw new Error(
      "No KK tidak ditemukan. Daftarkan orang tua terlebih dahulu.",
    );
  }

  let fotoUrl: string | null = null;
  if (fotoAnak) {
    const { uploadProfileImage } = await import("./storage");
    const result = await uploadProfileImage(fotoAnak, payload.nik, "anak");
    if (result.success) fotoUrl = result.url || null;
  }

  const { data, error } = await supabase
    .from("anak")
    .insert({ ...payload, foto_profil: fotoUrl })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAnak(
  nik: string,
  payload: UpdateAnakPayload,
  fotoAnak?: File,
): Promise<void> {
  let fotoUrl: string | undefined;
  if (fotoAnak) {
    const existing = await fetchAnakByNik(nik);
    if (existing?.foto_profil) {
      await deleteProfileImage(existing.foto_profil, "anak");
    }
    const { uploadProfileImage } = await import("./storage");
    const result = await uploadProfileImage(fotoAnak, nik, "anak");
    if (result.success) fotoUrl = result.url;
  }

  const { error } = await supabase
    .from("anak")
    .update({ ...payload, ...(fotoUrl && { foto_profil: fotoUrl }) })
    .eq("nik", nik);
  if (error) throw error;
}

/**
 * Hapus anak secara PERMANEN, termasuk seluruh riwayat_scan terkait (CASCADE)
 * dan foto profil di storage. TIDAK BISA DIBATALKAN.
 * UI wajib menampilkan konfirmasi/peringatan sebelum memanggil fungsi ini,
 * karena ini akan menghapus seluruh histori scan anak tersebut juga.
 */
export async function deleteAnak(nik: string): Promise<void> {
  const anak = await fetchAnakByNik(nik);
  if (anak?.foto_profil) {
    await deleteProfileImage(anak.foto_profil, 'anak');
  }

  // Hapus anak -> CASCADE otomatis menghapus seluruh riwayat_scan terkait
  const { error } = await supabase.from('anak').delete().eq('nik', nik);
  if (error) throw error;
}

// ============================================================================
// RIWAYAT SCAN
// ============================================================================

/** Simpan hasil scan (setelah login) - TIDAK ADA field gambar, sesuai desain. */
export async function insertRiwayatScan(
  payload: NewRiwayatScanPayload,
): Promise<RiwayatScan> {
  const { data, error } = await supabase
    .from("riwayat_scan")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Daftar seluruh riwayat scan (halaman History), join dengan identitas anak. */
export async function fetchRiwayatScanHistory(): Promise<
  RiwayatScanWithAnak[]
> {
  const { data, error } = await supabase
    .from("riwayat_scan")
    .select(
      `
      *,
      anak!inner (
        nama,
        gender,
        tanggal_lahir
      )
    `,
    )
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data || []).map((row) => ({
    ...row,
    anak: Array.isArray(row.anak) ? row.anak[0] : row.anak,
  }));
}

/** Riwayat scan untuk 1 anak spesifik (dipakai di halaman detail anak). */
export async function fetchRiwayatScanByNik(
  nik: string,
): Promise<RiwayatScan[]> {
  const { data, error } = await supabase
    .from("riwayat_scan")
    .select("*")
    .eq("nik", nik)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

/** Detail 1 riwayat scan (halaman detail history) - identitas anak + hasil analisis, tanpa gambar. */
export async function fetchRiwayatScanDetail(
  id: string,
): Promise<RiwayatScanWithAnak | null> {
  const { data, error } = await supabase
    .from("riwayat_scan")
    .select(
      `
      *,
      anak!inner (
        nama,
        gender,
        tanggal_lahir
      )
    `,
    )
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return { ...data, anak: Array.isArray(data.anak) ? data.anak[0] : data.anak };
}

export async function deleteRiwayatScan(id: string): Promise<void> {
  const { error } = await supabase.from("riwayat_scan").delete().eq("id", id);
  if (error) throw error;
}

/** Ringkasan jumlah per status_gizi, untuk kartu summary di halaman History. */
export async function fetchRiwayatScanSummary(): Promise<
  Record<string, number>
> {
  const { data, error } = await supabase
    .from("riwayat_scan")
    .select("status_gizi");
  if (error) throw error;

  const summary: Record<string, number> = {
    stunting_parah: 0,
    stunting: 0,
    normal: 0,
    tinggi: 0,
  };
  data?.forEach((row) => {
    summary[row.status_gizi] = (summary[row.status_gizi] || 0) + 1;
  });
  return summary;
}
