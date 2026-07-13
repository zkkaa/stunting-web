'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Layout, ProtectedRoute } from '@/components';
import { FiArrowLeft, FiUser, FiPlus } from 'react-icons/fi';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchKeluargaDetail, insertAnak } from '@/utils/database';
import { NewAnakPayload, OrangTua } from '@/types';
import { useUnsavedChanges, useNavigationGuard } from '@/contexts/NavigationGuardContext';

function Field({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
      />
    </div>
  );
}

function TambahAnakFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noKk = searchParams?.get('no_kk') || '';
  const { guardedPush } = useNavigationGuard();

  const [ayah, setAyah] = useState<OrangTua | null>(null);
  const [ibu, setIbu] = useState<OrangTua | null>(null);
  const [loadingParent, setLoadingParent] = useState(true);

  const [form, setForm] = useState({
    nik: '',
    nama: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    gender: 'L' as 'L' | 'P',
    bb_lahir: '',
    tb_lahir: '',
    lk_lahir: '',
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isDirty = form.nik !== '' || form.nama !== '' || form.tanggal_lahir !== '';
  useUnsavedChanges(isDirty && !isSubmitting);

  useEffect(() => {
    const load = async () => {
      if (!noKk) {
        setLoadingParent(false);
        return;
      }
      try {
        const detail = await fetchKeluargaDetail(noKk);
        setAyah(detail.ayah);
        setIbu(detail.ibu);
      } catch (err) {
        console.error('Error loading keluarga:', err);
      } finally {
        setLoadingParent(false);
      }
    };
    load();
  }, [noKk]);

  const handleSubmit = async () => {
    setSubmitError(null);

    if (!noKk) {
      setSubmitError('Data orang tua tidak ditemukan.');
      return;
    }
    if (!form.nik.trim() || !form.nama.trim() || !form.tanggal_lahir) {
      setSubmitError('NIK, Nama, dan Tanggal Lahir wajib diisi.');
      return;
    }

    const payload: NewAnakPayload = {
      nik: form.nik.trim(),
      no_kk: noKk,
      nama: form.nama.trim(),
      tempat_lahir: form.tempat_lahir.trim(),
      tanggal_lahir: form.tanggal_lahir,
      gender: form.gender,
      bb_lahir: form.bb_lahir ? parseFloat(form.bb_lahir) : undefined,
      tb_lahir: form.tb_lahir ? parseFloat(form.tb_lahir) : undefined,
      lk_lahir: form.lk_lahir ? parseFloat(form.lk_lahir) : undefined,
    };

    try {
      setIsSubmitting(true);
      await insertAnak(payload, photoFile || undefined);
      router.push('/anak');
    } catch (err) {
      console.error('Error saving anak:', err);
      setSubmitError(err instanceof Error ? err.message : 'Gagal menyimpan data anak.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen relative overflow-x-hidden bg-gray-50/50">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-60 z-10"
          style={{
            background: `radial-gradient(ellipse at center top, rgba(158, 202, 214, 0.6) 0%, rgba(158, 202, 214, 0.3) 30%, rgba(158, 202, 214, 0.1) 50%, transparent 70%)`,
          }}
        />

        <div className="relative z-20 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => guardedPush('/anak/tambah')}
              className="mb-4 inline-flex items-center gap-2 text-sm sm:text-base text-gray-600 hover:text-[#407A81] transition-colors"
            >
              <FiArrowLeft size={18} />
              <span>Kembali ke Pilih Orang Tua</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Tambah Anak</h1>

            {!loadingParent && (ayah || ibu) && (
              <div className="mb-6 bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <div className="text-xs text-gray-500">Orang Tua Terpilih:</div>
                <div className="text-sm font-semibold text-gray-800">
                  {ayah?.nama || '—'} &amp; {ibu?.nama || '—'}
                </div>
                <div className="text-xs text-gray-400 ml-auto">No KK: {noKk}</div>
              </div>
            )}

            {submitError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{submitError}</div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 sm:px-7 py-6 border-b border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Identitas Anak</div>

                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-[#E5F3F5] flex items-center justify-center text-[#397789]">
                      {photoPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photoPreview} alt="foto anak" className="w-full h-full object-cover" />
                      ) : (
                        <FiUser size={40} />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-[#407A81] rounded-full flex items-center justify-center hover:bg-[#326269] transition-colors"
                    >
                      <FiPlus className="text-white" size={16} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPhotoFile(file);
                          setPhotoPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="NIK Anak" placeholder="3273xxxxxxxxxxxx" value={form.nik} onChange={(v) => setForm((p) => ({ ...p, nik: v }))} />
                  <Field label="Nama Anak" placeholder="Nama lengkap" value={form.nama} onChange={(v) => setForm((p) => ({ ...p, nama: v }))} />
                  <Field label="Tempat Lahir" placeholder="Tasikmalaya" value={form.tempat_lahir} onChange={(v) => setForm((p) => ({ ...p, tempat_lahir: v }))} />
                  <Field label="Tanggal Lahir" type="date" value={form.tanggal_lahir} onChange={(v) => setForm((p) => ({ ...p, tanggal_lahir: v }))} />
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1.5">Jenis Kelamin</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, gender: 'L' }))}
                        className={`py-2.5 rounded-lg font-medium text-sm transition-colors ${
                          form.gender === 'L' ? 'bg-[#407A81] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Laki-laki
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, gender: 'P' }))}
                        className={`py-2.5 rounded-lg font-medium text-sm transition-colors ${
                          form.gender === 'P' ? 'bg-[#407A81] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Perempuan
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 sm:px-7 py-6">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Data Saat Lahir (Opsional)</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Berat (kg)" type="number" placeholder="3.2" value={form.bb_lahir} onChange={(v) => setForm((p) => ({ ...p, bb_lahir: v }))} />
                  <Field label="Tinggi (cm)" type="number" placeholder="49" value={form.tb_lahir} onChange={(v) => setForm((p) => ({ ...p, tb_lahir: v }))} />
                  <Field label="Lingkar Kepala (cm)" type="number" placeholder="34" value={form.lk_lahir} onChange={(v) => setForm((p) => ({ ...p, lk_lahir: v }))} />
                </div>
              </div>

              <div className="px-5 sm:px-7 py-5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => guardedPush('/anak/tambah')}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-lg bg-[#407A81] text-white hover:bg-[#326269] font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Anak'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function TambahAnakFormPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <Layout>
            <div className="min-h-screen flex items-center justify-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#407A81]" />
            </div>
          </Layout>
        }
      >
        <TambahAnakFormContent />
      </Suspense>
    </ProtectedRoute>
  );
}