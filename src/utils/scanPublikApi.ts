import { ScanPublikRequest, ScanPublikResponse } from '@/types/scanPublik';

// Endpoint default - VILION (model Candra, jalan di laptopnya via Cloudflare Tunnel).
// SENGAJA pakai env var terpisah dari ComViT/Railway (NEXT_PUBLIC_API_URL) yang dipakai
// fitur scan versi login, supaya dua backend ini tidak saling menimpa konfigurasi.
export const DEFAULT_SCAN_API_URL = process.env.NEXT_PUBLIC_VILION_API_URL || '';

const SCAN_PATH = '/scan';
const HEALTH_PATH = '/health';

// Tunnel + transfer base64 image bikin latency normal ~4 detik (vs ~0.5 detik lokal).
// Timeout digenerouskan ke 15 detik supaya tidak salah anggap "gagal" padahal masih proses,
// terutama kalau nanti pakai hotspot HP di lapangan yang sinyalnya kurang stabil.
const REQUEST_TIMEOUT_MS = 15000;

export const callScanApi = async (
  endpointUrl: string,
  payload: ScanPublikRequest
): Promise<ScanPublikResponse> => {
  const trimmedUrl = endpointUrl.trim().replace(/\/+$/, '');

  if (!trimmedUrl) {
    throw new Error('Endpoint URL belum diisi.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${trimmedUrl}${SCAN_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Payload sengaja HANYA image + distance_cm - age_months & gender sudah
      // di-disable dari sisi VILION (dikonfirmasi Candra), status gizi dihitung
      // 100% lokal di browser (lihat scan-publik/hasil/page.tsx).
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Waktu tunggu habis. Tunnel mungkin sedang lambat atau mati — coba lagi.');
    }
    throw new Error('Tidak dapat terhubung ke endpoint. Periksa URL atau koneksi tunnel.');
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    // VILION balikin { "detail": "pesan error" } untuk 400, tampilkan pesan itu ke user
    // langsung, bukan status code mentah - biar petugas di lapangan tahu apa yang salah
    // (misal "No child detected in image").
    let detail = '';
    try {
      const errorJson = await response.json();
      detail = errorJson?.detail || '';
    } catch {
      detail = await response.text().catch(() => '');
    }
    throw new Error(detail || `Server merespons error (${response.status}).`);
  }

  const data: ScanPublikResponse = await response.json();
  return data;
};

// Cek kesiapan server VILION sebelum user repot-repot scan (hindari nunggu ~4 detik
// cuma buat dapat error tunnel mati). Dipakai untuk tombol "Test Koneksi" di UI.
export const checkVilionHealth = async (
  endpointUrl: string
): Promise<{ ok: boolean; message: string }> => {
  const trimmedUrl = endpointUrl.trim().replace(/\/+$/, '');
  if (!trimmedUrl) {
    return { ok: false, message: 'Endpoint URL belum diisi.' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${trimmedUrl}${HEALTH_PATH}`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { ok: false, message: `Server merespons error (${response.status}).` };
    }

    const data = await response.json();
    if (data?.status === 'ok' && data?.model_loaded) {
      return { ok: true, message: 'Koneksi berhasil — model siap digunakan.' };
    }
    return { ok: false, message: 'Server aktif tapi model belum siap dimuat.' };
  } catch {
    return { ok: false, message: 'Tidak dapat terhubung. Periksa URL tunnel atau koneksi internet.' };
  }
};

// Convert File/Blob jadi base64 TANPA prefix data:image/...;base64,
export const fileToBase64Raw = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const raw = result.split(',')[1] || '';
      resolve(raw);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};