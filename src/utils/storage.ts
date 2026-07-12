import { supabase } from '@/lib/supabase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

type ProfileBucket = 'orang-tua' | 'anak';

function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Tipe file tidak didukung. Gunakan JPEG, PNG, atau WebP.';
  }
  if (file.size > MAX_SIZE_BYTES) {
    return 'Ukuran file terlalu besar. Maksimal 5MB.';
  }
  return null;
}

/**
 * Upload foto profil (orang tua atau anak) ke bucket yang sesuai.
 * Path disusun per-NIK supaya rapi & mudah di-cleanup saat data dihapus.
 */
export async function uploadProfileImage(
  file: File,
  nik: string,
  bucket: ProfileBucket
): Promise<UploadResult> {
  const validationError = validateImageFile(file);
  if (validationError) {
    return { success: false, error: validationError };
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${nik}-${Date.now()}.${fileExt}`;
    const filePath = `${nik}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error(`Error uploading to ${bucket}:`, uploadError);
      return { success: false, error: 'Gagal mengunggah gambar. Silakan coba lagi.' };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return { success: true, url: data.publicUrl };
  } catch (error) {
    console.error(`Unexpected error uploading to ${bucket}:`, error);
    return { success: false, error: 'Terjadi kesalahan tak terduga.' };
  }
}

/**
 * Hapus foto profil dari storage berdasarkan public URL yang tersimpan di DB.
 * Aman dipanggil dengan imageUrl null/undefined - langsung no-op.
 */
export async function deleteProfileImage(
  imageUrl: string | null | undefined,
  bucket: ProfileBucket
): Promise<void> {
  if (!imageUrl) return;

  try {
    const pathMatch = imageUrl.match(new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`));
    if (!pathMatch) {
      console.warn(`Could not extract path from ${bucket} image URL:`, imageUrl);
      return;
    }

    const { error } = await supabase.storage.from(bucket).remove([pathMatch[1]]);
    if (error) {
      console.error(`Error deleting from ${bucket}:`, error);
    }
  } catch (error) {
    console.error(`Unexpected error deleting from ${bucket}:`, error);
  }
}