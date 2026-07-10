// ============================================================================
// KALKULATOR STATUS GIZI ANAK — berbasis WHO Child Growth Standards (2006)
// diadaptasi ke kategori resmi Permenkes RI No. 2 Tahun 2020 tentang
// Standar Antropometri Anak.
//
// Sumber data mentah (L, M, S per hari usia, 0-1856 hari / 0-5 tahun):
// https://www.who.int/tools/child-growth-standards/standards/length-height-for-age
// https://www.who.int/tools/child-growth-standards/standards/weight-for-age
// (diunduh sebagai "expanded tables", lalu dikompres jadi who-data/*.json)
// ============================================================================

import lhfaBoys from "./who-data/lhfa-boys.json";
import lhfaGirls from "./who-data/lhfa-girls.json";
import wfaBoys from "./who-data/wfa-boys.json";
import wfaGirls from "./who-data/wfa-girls.json";

export type Gender = "L" | "P";

// TB/U (Tinggi Badan menurut Umur) — indikator utama STUNTING.
// Ambang batas sesuai PMK No. 2 Tahun 2020, identik dengan kategori yang
// sudah dipakai di seluruh UI aplikasi ini sejak awal (tidak berubah).
export type HeightStatus = "stunting_parah" | "stunting" | "normal" | "tinggi";

// BB/U (Berat Badan menurut Umur) — indikator PENDUKUNG, BUKAN penentu status
// stunting. Kategori & ambang batas BB/U berbeda dari TB/U, karena itu
// labelnya sengaja dibuat berbeda (lihat penjelasan lengkap di akhir chat).
export type WeightStatus = "sangat_kurang" | "kurang" | "normal" | "risiko_lebih";

// Status gizi final anak = mengikuti status TB/U (fokus utama aplikasi: deteksi stunting)
export type NutritionStatus = HeightStatus;

// Tingkat keparahan generik — dipakai UI untuk memilih ikon/warna secara konsisten
// tanpa perlu tahu detail label apa pun (HeightStatus atau WeightStatus).
export type StatusSeverity = "critical" | "warning" | "good" | "attention";

// Tipe baris tabel LMS: [L, M, S]
type LMSRow = [number, number, number];

const MAX_DAY = 1856; // WHO expanded table mencakup 0-1856 hari (~0-5 tahun)

// ----------------------------------------------------------------------------
// 1. UTILITAS USIA
// ----------------------------------------------------------------------------

/** Usia dalam bulan penuh (dibulatkan ke bawah) — dipakai untuk TAMPILAN & penyimpanan DB. */
export function calculateAgeInMonths(tanggalLahir: string): number {
  if (!tanggalLahir) return 0;
  const birth = new Date(tanggalLahir);
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12;
  months += now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months--;
  return Math.max(months, 0);
}

/**
 * Usia dalam HARI penuh — dipakai untuk PERHITUNGAN z-score (presisi tinggi).
 * WHO merancang tabel LMS per hari justru supaya tidak perlu pembulatan ke bulan.
 */
export function calculateAgeInDays(tanggalLahir: string, referenceDate: Date = new Date()): number {
  if (!tanggalLahir) return 0;
  const birth = new Date(tanggalLahir);
  const diffMs = referenceDate.getTime() - birth.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(days, 0);
}

// ----------------------------------------------------------------------------
// 2. LOOKUP TABEL LMS & RUMUS Z-SCORE
// ----------------------------------------------------------------------------

function getLMS(table: LMSRow[], ageDays: number): LMSRow {
  const clampedDay = Math.min(Math.max(ageDays, 0), MAX_DAY);
  return table[clampedDay];
}

/**
 * Rumus resmi WHO (LMS method):
 *   Z = [ (nilai/M)^L - 1 ] / (L * S)     jika L ≠ 0
 *   Z = ln(nilai/M) / S                    jika L = 0
 */
function calculateZScore(value: number, L: number, M: number, S: number): number {
  if (L !== 0) {
    return (Math.pow(value / M, L) - 1) / (L * S);
  }
  return Math.log(value / M) / S;
}

// ----------------------------------------------------------------------------
// 3. KLASIFIKASI TB/U (STATUS TINGGI / STUNTING) — sesuai PMK No. 2/2020
// ----------------------------------------------------------------------------

function classifyHeightZScore(z: number): HeightStatus {
  if (z < -3) return "stunting_parah";   // Sangat pendek (severely stunted)
  if (z < -2) return "stunting";         // Pendek (stunted)
  if (z <= 3) return "normal";           // Normal
  return "tinggi";                       // Tinggi
}

export function calculateHeightStatus(heightCm: number, ageDays: number, gender: Gender): HeightStatus {
  const table = (gender === "L" ? lhfaBoys : lhfaGirls) as LMSRow[];
  const [L, M, S] = getLMS(table, ageDays);
  const z = calculateZScore(heightCm, L, M, S);
  return classifyHeightZScore(z);
}

// ----------------------------------------------------------------------------
// 4. KLASIFIKASI BB/U (STATUS BERAT) — sesuai PMK No. 2/2020
// ----------------------------------------------------------------------------

function classifyWeightZScore(z: number): WeightStatus {
  if (z < -3) return "sangat_kurang";  // Berat badan sangat kurang (severely underweight)
  if (z < -2) return "kurang";         // Berat badan kurang (underweight)
  if (z <= 1) return "normal";         // Berat badan normal
  return "risiko_lebih";               // Risiko berat badan lebih
}

export function calculateWeightStatus(weightKg: number, ageDays: number, gender: Gender): WeightStatus {
  const table = (gender === "L" ? wfaBoys : wfaGirls) as LMSRow[];
  const [L, M, S] = getLMS(table, ageDays);
  const z = calculateZScore(weightKg, L, M, S);
  return classifyWeightZScore(z);
}

// ----------------------------------------------------------------------------
// 5. STATUS GIZI FINAL
// ----------------------------------------------------------------------------

/**
 * Status gizi yang ditampilkan sebagai badge utama = status TB/U.
 * BB/U hanya indikator pendukung/tambahan informasi, BUKAN penentu utama,
 * karena fokus aplikasi ini adalah deteksi STUNTING (indikator TB/U).
 */
export function calculateNutritionStatus(heightStatus: HeightStatus): NutritionStatus {
  return heightStatus;
}

// ----------------------------------------------------------------------------
// 6. LABEL, WARNA, SEVERITY & DESKRIPSI — UNTUK UI
// ----------------------------------------------------------------------------

export function getStatusLabel(status: HeightStatus | NutritionStatus | WeightStatus): string {
  const labels: Record<string, string> = {
    // TB/U & status gizi final
    stunting_parah: "Stunting Parah",
    stunting: "Stunting",
    normal: "Normal",
    tinggi: "Tinggi",
    // BB/U
    sangat_kurang: "Berat Sangat Kurang",
    kurang: "Berat Kurang",
    risiko_lebih: "Risiko Berat Lebih",
  };
  return labels[status] || status;
}

/** Warna badge/kartu. Sekarang mencakup HeightStatus, NutritionStatus, MAUPUN WeightStatus. */
export function getStatusColor(
  status: HeightStatus | NutritionStatus | WeightStatus
): { bg: string; text: string; border: string } {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    // TB/U & status gizi final
    stunting_parah: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
    stunting: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
    normal: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
    tinggi: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
    // BB/U — pakai skema warna yang sama sesuai tingkat keparahannya
    sangat_kurang: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
    kurang: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
    risiko_lebih: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  };
  return colors[status] || { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" };
}

/**
 * Tingkat keparahan generik (independen dari label TB/U atau BB/U).
 * Dipakai UI untuk memilih ikon yang konsisten:
 *   critical  -> ikon oktagon/silang merah (paling darurat)
 *   warning   -> ikon segitiga kuning (perlu perhatian)
 *   good      -> ikon centang hijau (aman)
 *   attention -> ikon panah/info biru (di atas normal, belum tentu masalah tapi perlu dipantau)
 */
export function getStatusSeverity(status: HeightStatus | NutritionStatus | WeightStatus): StatusSeverity {
  const map: Record<string, StatusSeverity> = {
    stunting_parah: "critical",
    sangat_kurang: "critical",
    stunting: "warning",
    kurang: "warning",
    normal: "good",
    tinggi: "attention",
    risiko_lebih: "attention",
  };
  return map[status] || "attention";
}

/** Kalimat penjelasan singkat, supaya kader/orang tua yang awam istilah medis tetap paham. */
export function getStatusDescription(status: HeightStatus | NutritionStatus | WeightStatus): string {
  const descriptions: Record<string, string> = {
    stunting_parah: "Tinggi badan anak jauh di bawah standar WHO untuk usianya. Disarankan konsultasi ke tenaga kesehatan segera.",
    stunting: "Tinggi badan anak di bawah standar WHO untuk usianya. Perlu pemantauan & intervensi gizi.",
    normal: "Pertumbuhan anak sesuai dengan standar WHO untuk usia dan jenis kelaminnya.",
    tinggi: "Tinggi badan anak di atas standar WHO untuk usianya.",
    sangat_kurang: "Berat badan anak jauh di bawah standar WHO untuk usianya.",
    kurang: "Berat badan anak di bawah standar WHO untuk usianya.",
    risiko_lebih: "Berat badan anak berada di atas standar WHO untuk usianya.",
  };
  return descriptions[status] || "";
}

// ----------------------------------------------------------------------------
// 7. SIMULASI PENGUKURAN (sementara, sampai sensor IoT & kamera AI terintegrasi)
//    Sekarang dijangkarkan ke median WHO asli (bukan tabel kasar buatan sendiri),
//    supaya angka simulasi jauh lebih realistis & konsisten dengan status yang
//    akan dihasilkan kalkulator di atas.
// ----------------------------------------------------------------------------

export function generateDummyMeasurement(
  ageDays: number,
  gender: Gender
): { tinggi: number; berat: number } {
  const heightTable = (gender === "L" ? lhfaBoys : lhfaGirls) as LMSRow[];
  const weightTable = (gender === "L" ? wfaBoys : wfaGirls) as LMSRow[];

  const [, medianHeight] = getLMS(heightTable, ageDays);
  const [, medianWeight] = getLMS(weightTable, ageDays);

  // Variasi acak ±15% dari median WHO, supaya hasil simulasi tetap masuk akal
  // (mayoritas akan jatuh di kategori "normal", sesekali menyentuh kategori lain)
  const heightVariance = (Math.random() - 0.5) * 0.3;
  const weightVariance = (Math.random() - 0.5) * 0.3;

  const tinggi = Math.round(medianHeight * (1 + heightVariance) * 10) / 10;
  const berat = Math.round(medianWeight * (1 + weightVariance) * 10) / 10;

  return { tinggi, berat: Math.max(berat, 0.5) };
}

// ----------------------------------------------------------------------------
// 8. TINGGI & BERAT IDEAL (median WHO) — untuk ditampilkan ke user/orang tua
//    Menggunakan sumber LMS yang SAMA PERSIS dengan status TB/U & BB/U di atas,
//    supaya tidak ada dua sumber data berbeda yang bisa saling kontradiksi.
// ----------------------------------------------------------------------------

export interface IdealMeasurement {
  idealHeightCm: number;
  idealWeightKg: number;
}

export function getIdealMeasurements(ageDays: number, gender: Gender): IdealMeasurement {
  const heightTable = (gender === "L" ? lhfaBoys : lhfaGirls) as LMSRow[];
  const weightTable = (gender === "L" ? wfaBoys : wfaGirls) as LMSRow[];

  const [, medianHeight] = getLMS(heightTable, ageDays);
  const [, medianWeight] = getLMS(weightTable, ageDays);

  return {
    idealHeightCm: Math.round(medianHeight * 10) / 10,
    idealWeightKg: Math.round(medianWeight * 10) / 10,
  };
}