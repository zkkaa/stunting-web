'use client';

import React, { useState, useEffect } from 'react';
import { Layout, ProtectedRoute } from '@/components';
import { FiArrowLeft, FiUser, FiPlus } from 'react-icons/fi';
import { useRouter, useParams } from 'next/navigation';
import { fetchAnakByNik, updateAnak } from '@/utils/database';
import { UpdateAnakPayload } from '@/types';
import { useUnsavedChanges, useNavigationGuard } from '@/contexts/NavigationGuardContext';

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
      />
    </div>
  );
}

interface EditForm {
  nama: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  gender: 'L' | 'P';
  bb_lahir: string;
  tb_lahir: string;
  lk_lahir: string;
}

function AnakEditPageContent() {
  const router = useRouter();
  const params = useParams();
  const nik = params?.id as string;
  const { guardedPush } = useNavigationGuard();

  const [form, setForm] = useState<EditForm | null>(null);
  const [initialForm, setInitialForm] = useState<EditForm | null>(null);
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isDirty =
    form !== null && initialForm !== null && (JSON.stringify(form) !== JSON.stringify(initialForm) || photoFile !== null);
  useUnsavedChanges(isDirty && !saving);

  useEffect(() => {
    const load = async () => {
      if (!nik) return;
      try {
        setLoading(true);
        setError('');
        const anak = await fetchAnakByNik(nik);
        if (!anak) {
          setError('Data anak tidak ditemukan');
          return;
        }
        const editForm: EditForm = {
          nama: anak.nama,
          tempat_lahir: anak.tempat_lahir || '',
          tanggal_lahir: anak.tanggal_lahir,
          gender: anak.gender,
          bb_lahir: anak.bb_lahir?.toString() || '',
          tb_lahir: anak.tb_lahir?.toString() || '',
          lk_lahir: anak.lk_lahir?.toString() || '',
        };
        setForm(editForm);
        setInitialForm(editForm);
        setExistingPhoto(anak.foto_profil);
      } catch (err) {
        console.error('Error loading anak:', err);
        setError('Gagal memuat data anak');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [nik]);

  const handleSave = async () => {
    if (!form) return;
    try {
      setSaving(true);
      setError('');
      const payload: UpdateAnakPayload = {
        nama: form.nama,
        tempat_lahir: form.tempat_lahir,
        tanggal_lahir: form.tanggal_lahir,
        gender: form.gender,
        bb_lahir: form.bb_lahir ? parseFloat(form.bb_lahir) : undefined,
        tb_lahir: form.tb_lahir ? parseFloat(form.tb_lahir) : undefined,
        lk_lahir: form.lk_lahir ? parseFloat(form.lk_lahir) : undefined,
      };
      await updateAnak(nik, payload, photoFile || undefined);
      router.push(`/anak/${nik}`);
    } catch (err) {
      console.error('Error saving anak:', err);
      setError('Gagal menyimpan data anak');
    } finally {
      setSaving(false);
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
              onClick={() => guardedPush(`/anak/${nik}`)}
              className="mb-4 inline-flex items-center cursor-pointer gap-2 text-sm sm:text-base text-gray-600 hover:text-[#407A81] transition-colors"
            >
              <FiArrowLeft size={18} />
              <span>Kembali ke Detail</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Edit Profile Anak</h1>

            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#407A81]"></div>
                <p className="mt-4 text-gray-500 text-sm">Memuat data...</p>
              </div>
            ) : !form ? (
              <div className="text-center py-20">
                <p className="text-red-500 text-sm">{error || 'Data tidak ditemukan'}</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {error && (
                  <div className="mx-5 sm:mx-7 mt-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
                )}

                <div className="px-5 sm:px-7 py-6 border-b border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Identitas Anak</div>

                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#E5F3F5] flex items-center justify-center text-[#397789] shrink-0">
                      {photoPreview || existingPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photoPreview || existingPhoto || ''} alt="Anak" className="w-full h-full object-cover" />
                      ) : (
                        <FiUser size={28} />
                      )}
                    </div>
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer text-sm font-medium">
                      <FiPlus size={14} />
                      Ganti Foto
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
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Nama Anak" value={form.nama} onChange={(v) => setForm((p) => (p ? { ...p, nama: v } : p))} />
                    <Field label="Tempat Lahir" value={form.tempat_lahir} onChange={(v) => setForm((p) => (p ? { ...p, tempat_lahir: v } : p))} />
                    <Field label="Tanggal Lahir" type="date" value={form.tanggal_lahir} onChange={(v) => setForm((p) => (p ? { ...p, tanggal_lahir: v } : p))} />
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">Jenis Kelamin</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setForm((p) => (p ? { ...p, gender: 'L' } : p))}
                          className={`py-2.5 rounded-lg font-medium cursor-pointer text-sm transition-colors ${
                            form.gender === 'L' ? 'bg-[#407A81] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Laki-laki
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm((p) => (p ? { ...p, gender: 'P' } : p))}
                          className={`py-2.5 rounded-lg font-medium cursor-pointer text-sm transition-colors ${
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
                    <Field label="Berat (kg)" type="number" value={form.bb_lahir} onChange={(v) => setForm((p) => (p ? { ...p, bb_lahir: v } : p))} />
                    <Field label="Tinggi (cm)" type="number" value={form.tb_lahir} onChange={(v) => setForm((p) => (p ? { ...p, tb_lahir: v } : p))} />
                    <Field label="Lingkar Kepala (cm)" type="number" value={form.lk_lahir} onChange={(v) => setForm((p) => (p ? { ...p, lk_lahir: v } : p))} />
                  </div>
                </div>

                <div className="px-5 sm:px-7 py-5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    onClick={() => guardedPush(`/anak/${nik}`)}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-lg border-2 cursor-pointer border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-lg bg-[#407A81] cursor-pointer text-white hover:bg-[#326269] font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function AnakEditPage() {
  return (
    <ProtectedRoute>
      <AnakEditPageContent />
    </ProtectedRoute>
  );
}