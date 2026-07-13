'use client';

import React, { useState, useEffect } from 'react';
import { Layout, ProtectedRoute } from '@/components';
import { FiArrowLeft, FiUser, FiPlus } from 'react-icons/fi';
import { useRouter, useParams } from 'next/navigation';
import { fetchKeluargaDetail, updateOrangTuaData } from '@/utils/database';
import { OrangTua, Alamat } from '@/types';
import { useUnsavedChanges, useNavigationGuard } from '@/contexts/NavigationGuardContext';

interface EditForm {
  ayah: { nama: string; tempat_lahir: string; tanggal_lahir: string; no_hp: string; foto_profil: string | null };
  ibu: { nama: string; tempat_lahir: string; tanggal_lahir: string; no_hp: string; foto_profil: string | null };
  alamat: { provinsi: string; kota: string; kecamatan: string; desa: string; jalan: string; kode_pos: string };
  jumlahAnak: number;
}

function toEditForm(ayah: OrangTua | null, ibu: OrangTua | null, alamat: Alamat | null, jumlahAnak: number): EditForm {
  return {
    ayah: {
      nama: ayah?.nama || '',
      tempat_lahir: ayah?.tempat_lahir || '',
      tanggal_lahir: ayah?.tanggal_lahir || '',
      no_hp: ayah?.no_hp || '',
      foto_profil: ayah?.foto_profil || null,
    },
    ibu: {
      nama: ibu?.nama || '',
      tempat_lahir: ibu?.tempat_lahir || '',
      tanggal_lahir: ibu?.tanggal_lahir || '',
      no_hp: ibu?.no_hp || '',
      foto_profil: ibu?.foto_profil || null,
    },
    alamat: {
      provinsi: alamat?.provinsi || '',
      kota: alamat?.kota || '',
      kecamatan: alamat?.kecamatan || '',
      desa: alamat?.desa || '',
      jalan: alamat?.jalan || '',
      kode_pos: alamat?.kode_pos || '',
    },
    jumlahAnak,
  };
}

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

function OrangTuaEditPageContent() {
  const router = useRouter();
  const params = useParams();
  const noKk = params?.id as string;
  const { guardedPush } = useNavigationGuard();

  const [form, setForm] = useState<EditForm | null>(null);
  const [initialForm, setInitialForm] = useState<EditForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [fatherPreview, setFatherPreview] = useState<string | null>(null);
  const [motherPreview, setMotherPreview] = useState<string | null>(null);
  const [fatherImageFile, setFatherImageFile] = useState<File | null>(null);
  const [motherImageFile, setMotherImageFile] = useState<File | null>(null);

  const isDirty =
    form !== null &&
    initialForm !== null &&
    (JSON.stringify(form) !== JSON.stringify(initialForm) || fatherImageFile !== null || motherImageFile !== null);

  useUnsavedChanges(isDirty && !saving);

  useEffect(() => {
    const load = async () => {
      if (!noKk) return;
      try {
        setLoading(true);
        setError('');
        const detail = await fetchKeluargaDetail(noKk);
        const editForm = toEditForm(detail.ayah, detail.ibu, detail.alamat, detail.anak.length);
        setForm(editForm);
        setInitialForm(editForm);
      } catch (err) {
        console.error('Error loading keluarga detail:', err);
        setError('Gagal memuat data orang tua');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [noKk]);

  const updateField = (section: 'ayah' | 'ibu' | 'alamat', field: string, value: string) => {
    setForm((prev) => (prev ? { ...prev, [section]: { ...prev[section], [field]: value } } : prev));
  };

  const handleSave = async () => {
    if (!form) return;
    try {
      setSaving(true);
      setError('');
      await updateOrangTuaData(noKk, {
        ayah: {
          nama: form.ayah.nama,
          tempat_lahir: form.ayah.tempat_lahir,
          tanggal_lahir: form.ayah.tanggal_lahir,
          no_hp: form.ayah.no_hp,
        },
        ibu: {
          nama: form.ibu.nama,
          tempat_lahir: form.ibu.tempat_lahir,
          tanggal_lahir: form.ibu.tanggal_lahir,
          no_hp: form.ibu.no_hp,
        },
        alamat: form.alamat,
      });
      router.push(`/orang-tua/${noKk}`);
    } catch (err) {
      console.error('Error saving parent data:', err);
      setError('Gagal menyimpan data orang tua');
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
              onClick={() => guardedPush(`/orang-tua/${noKk}`)}
              className="mb-4 cursor-pointer inline-flex items-center gap-2 text-sm sm:text-base text-gray-600 hover:text-[#407A81] transition-colors"
            >
              <FiArrowLeft size={18} />
              <span>Kembali ke Detail</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Edit Profile Orang Tua</h1>

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
                  <div className="mx-5 sm:mx-7 mt-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}

                {/* Identitas Ayah */}
                <div className="px-5 sm:px-7 py-6 border-b border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Identitas Ayah</div>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#E5F3F5] flex items-center justify-center text-[#397789] shrink-0">
                      {fatherPreview || form.ayah.foto_profil ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={fatherPreview || form.ayah.foto_profil || ''} alt="Ayah" className="w-full h-full object-cover" />
                      ) : (
                        <FiUser size={28} />
                      )}
                    </div>
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer text-sm font-medium">
                      <FiPlus size={14} />
                      Ganti Foto
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFatherImageFile(file);
                            setFatherPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Nama Lengkap" value={form.ayah.nama} onChange={(v) => updateField('ayah', 'nama', v)} />
                    <Field label="Tempat Lahir" value={form.ayah.tempat_lahir} onChange={(v) => updateField('ayah', 'tempat_lahir', v)} />
                    <Field label="Tanggal Lahir" type="date" value={form.ayah.tanggal_lahir} onChange={(v) => updateField('ayah', 'tanggal_lahir', v)} />
                    <Field label="Nomor Telepon" value={form.ayah.no_hp} onChange={(v) => updateField('ayah', 'no_hp', v)} />
                  </div>
                </div>

                {/* Identitas Ibu */}
                <div className="px-5 sm:px-7 py-6 border-b border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Identitas Ibu</div>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#E5F3F5] flex items-center justify-center text-[#397789] shrink-0">
                      {motherPreview || form.ibu.foto_profil ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={motherPreview || form.ibu.foto_profil || ''} alt="Ibu" className="w-full h-full object-cover" />
                      ) : (
                        <FiUser size={28} />
                      )}
                    </div>
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer text-sm font-medium">
                      <FiPlus size={14} />
                      Ganti Foto
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setMotherImageFile(file);
                            setMotherPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Nama Lengkap" value={form.ibu.nama} onChange={(v) => updateField('ibu', 'nama', v)} />
                    <Field label="Tempat Lahir" value={form.ibu.tempat_lahir} onChange={(v) => updateField('ibu', 'tempat_lahir', v)} />
                    <Field label="Tanggal Lahir" type="date" value={form.ibu.tanggal_lahir} onChange={(v) => updateField('ibu', 'tanggal_lahir', v)} />
                    <Field label="Nomor Telepon" value={form.ibu.no_hp} onChange={(v) => updateField('ibu', 'no_hp', v)} />
                  </div>
                </div>

                {/* Identitas Keluarga (read-only) */}
                <div className="px-5 sm:px-7 py-6 border-b border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Identitas Keluarga</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">No KK</label>
                      <div className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 text-sm">
                        {noKk}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">No KK tidak dapat diubah setelah dibuat.</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">Jumlah Anak</label>
                      <div className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 text-sm">
                        {form.jumlahAnak} Anak (Otomatis)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alamat */}
                <div className="px-5 sm:px-7 py-6">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Alamat Rumah</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Provinsi" value={form.alamat.provinsi} onChange={(v) => updateField('alamat', 'provinsi', v)} />
                    <Field label="Kota/Kabupaten" value={form.alamat.kota} onChange={(v) => updateField('alamat', 'kota', v)} />
                    <Field label="Kecamatan" value={form.alamat.kecamatan} onChange={(v) => updateField('alamat', 'kecamatan', v)} />
                    <Field label="Desa" value={form.alamat.desa} onChange={(v) => updateField('alamat', 'desa', v)} />
                    <Field label="Detail Jalan" value={form.alamat.jalan} onChange={(v) => updateField('alamat', 'jalan', v)} />
                    <Field label="Kode Pos" value={form.alamat.kode_pos} onChange={(v) => updateField('alamat', 'kode_pos', v)} />
                  </div>
                </div>

                {/* Actions */}
                <div className="px-5 sm:px-7 py-5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    onClick={() => guardedPush(`/orang-tua/${noKk}`)}
                    disabled={saving}
                    className="px-6 cursor-pointer py-2.5 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 cursor-pointer py-2.5 rounded-lg bg-[#407A81] text-white hover:bg-[#326269] font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

export default function OrangTuaEditPage() {
  return (
    <ProtectedRoute>
      <OrangTuaEditPageContent />
    </ProtectedRoute>
  );
}