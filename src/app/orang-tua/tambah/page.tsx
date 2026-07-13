'use client';

import React, { useState } from 'react';
import { Layout, ProtectedRoute } from '@/components';
import { FiArrowLeft, FiUser, FiPlus } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { insertKeluargaWithOrangTua } from '@/utils/database';
import { NewOrangTuaPayload } from '@/types';
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

function PhotoPicker({ preview, onFile }: { preview: string; onFile: (file: File) => void }) {
  return (
    <div className="flex justify-center mb-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-[#E5F3F5] flex items-center justify-center text-[#397789]">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="foto" className="w-full h-full object-cover" />
          ) : (
            <FiUser size={40} />
          )}
        </div>
        <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#407A81] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#326269] transition-colors">
          <FiPlus className="text-white" size={16} />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
            }}
          />
        </label>
      </div>
    </div>
  );
}

function TambahOrangTuaPageContent() {
  const router = useRouter();
  const { guardedPush } = useNavigationGuard();

  const [form, setForm] = useState({
    father: { name: '', nik: '', phone: '', birthPlace: '', birthDate: '' },
    mother: { name: '', nik: '', phone: '', birthPlace: '', birthDate: '' },
    noKk: '',
    address: { provinsi: '', kota: '', kecamatan: '', desa: '', detail: '', kodePos: '' },
  });
  const [fatherImage, setFatherImage] = useState('');
  const [motherImage, setMotherImage] = useState('');
  const [fatherImageFile, setFatherImageFile] = useState<File | null>(null);
  const [motherImageFile, setMotherImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isDirty =
    form.noKk !== '' ||
    Object.values(form.father).some((v) => v !== '') ||
    Object.values(form.mother).some((v) => v !== '') ||
    Object.values(form.address).some((v) => v !== '');

  useUnsavedChanges(isDirty && !isSubmitting);

  const update = (section: 'father' | 'mother' | 'address', field: string, value: string) => {
    setForm((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    if (!form.noKk.trim()) return setSubmitError('Nomor Kartu Keluarga harus diisi.');
    if (!form.father.name.trim() || !form.father.nik.trim())
      return setSubmitError('Nama dan NIK Ayah harus diisi.');
    if (!form.mother.name.trim() || !form.mother.nik.trim())
      return setSubmitError('Nama dan NIK Ibu harus diisi.');

    const payload: NewOrangTuaPayload = {
      no_kk: form.noKk.trim(),
      ayah: {
        nik: form.father.nik.trim(),
        nama: form.father.name.trim(),
        tempat_lahir: form.father.birthPlace.trim(),
        tanggal_lahir: form.father.birthDate,
        no_hp: form.father.phone.trim(),
      },
      ibu: {
        nik: form.mother.nik.trim(),
        nama: form.mother.name.trim(),
        tempat_lahir: form.mother.birthPlace.trim(),
        tanggal_lahir: form.mother.birthDate,
        no_hp: form.mother.phone.trim(),
      },
      alamat: {
        provinsi: form.address.provinsi.trim(),
        kota: form.address.kota.trim(),
        kecamatan: form.address.kecamatan.trim(),
        desa: form.address.desa.trim(),
        jalan: form.address.detail.trim(),
        kode_pos: form.address.kodePos.trim(),
      },
    };

    try {
      setIsSubmitting(true);
      await insertKeluargaWithOrangTua(payload, fatherImageFile || undefined, motherImageFile || undefined);
      router.push('/orang-tua');
    } catch (err) {
      console.error('Error saving keluarga:', err);
      setSubmitError(
        err instanceof Error ? err.message : 'Gagal menyimpan data orang tua. Pastikan No KK belum terdaftar.'
      );
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
              onClick={() => guardedPush('/orang-tua')}
              className="mb-4 cursor-pointer inline-flex items-center gap-2 text-sm sm:text-base text-gray-600 hover:text-[#407A81] transition-colors"
            >
              <FiArrowLeft size={18} />
              <span>Kembali ke Orang Tua</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Tambah Orang Tua</h1>

            {submitError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {submitError}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Identitas Keluarga */}
              <div className="px-5 sm:px-7 py-5 border-b border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Identitas Keluarga</div>
                <div className="max-w-xs">
                  <Field
                    label="Nomor Kartu Keluarga"
                    placeholder="Masukkan Nomor KK"
                    value={form.noKk}
                    onChange={(v) => setForm((prev) => ({ ...prev, noKk: v }))}
                  />
                </div>
              </div>

              {/* Identitas Ayah */}
              <div className="px-5 sm:px-7 py-6 border-b border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Identitas Ayah</div>
                <PhotoPicker
                  preview={fatherImage}
                  onFile={(file) => {
                    setFatherImageFile(file);
                    setFatherImage(URL.createObjectURL(file));
                  }}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="NIK" placeholder="Masukkan NIK Ayah" value={form.father.nik} onChange={(v) => update('father', 'nik', v)} />
                  <Field label="Nama Lengkap" placeholder="Masukkan Nama Ayah" value={form.father.name} onChange={(v) => update('father', 'name', v)} />
                  <Field label="Tempat Lahir" placeholder="Masukkan Tempat Lahir" value={form.father.birthPlace} onChange={(v) => update('father', 'birthPlace', v)} />
                  <Field label="Tanggal Lahir" type="date" value={form.father.birthDate} onChange={(v) => update('father', 'birthDate', v)} />
                  <div className="sm:col-span-2">
                    <Field label="Nomor Telepon" placeholder="Masukkan Nomor Telepon" value={form.father.phone} onChange={(v) => update('father', 'phone', v)} />
                  </div>
                </div>
              </div>

              {/* Identitas Ibu */}
              <div className="px-5 sm:px-7 py-6 border-b border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Identitas Ibu</div>
                <PhotoPicker
                  preview={motherImage}
                  onFile={(file) => {
                    setMotherImageFile(file);
                    setMotherImage(URL.createObjectURL(file));
                  }}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="NIK" placeholder="Masukkan NIK Ibu" value={form.mother.nik} onChange={(v) => update('mother', 'nik', v)} />
                  <Field label="Nama Lengkap" placeholder="Masukkan Nama Ibu" value={form.mother.name} onChange={(v) => update('mother', 'name', v)} />
                  <Field label="Tempat Lahir" placeholder="Masukkan Tempat Lahir" value={form.mother.birthPlace} onChange={(v) => update('mother', 'birthPlace', v)} />
                  <Field label="Tanggal Lahir" type="date" value={form.mother.birthDate} onChange={(v) => update('mother', 'birthDate', v)} />
                  <div className="sm:col-span-2">
                    <Field label="Nomor Telepon" placeholder="Masukkan Nomor Telepon" value={form.mother.phone} onChange={(v) => update('mother', 'phone', v)} />
                  </div>
                </div>
              </div>

              {/* Alamat */}
              <div className="px-5 sm:px-7 py-6">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Alamat Rumah</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Provinsi" value={form.address.provinsi} onChange={(v) => update('address', 'provinsi', v)} />
                  <Field label="Kota/Kabupaten" value={form.address.kota} onChange={(v) => update('address', 'kota', v)} />
                  <Field label="Kecamatan" value={form.address.kecamatan} onChange={(v) => update('address', 'kecamatan', v)} />
                  <Field label="Desa" value={form.address.desa} onChange={(v) => update('address', 'desa', v)} />
                  <Field label="Detail Jalan" value={form.address.detail} onChange={(v) => update('address', 'detail', v)} />
                  <Field label="Kode Pos" value={form.address.kodePos} onChange={(v) => update('address', 'kodePos', v)} />
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 sm:px-7 py-5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => guardedPush('/orang-tua')}
                  disabled={isSubmitting}
                  className="px-6 cursor-pointer py-2.5 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 cursor-pointer py-2.5 rounded-lg bg-[#407A81] text-white hover:bg-[#326269] font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Tambah Orang Tua'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function TambahOrangTuaPage() {
  return (
    <ProtectedRoute>
      <TambahOrangTuaPageContent />
    </ProtectedRoute>
  );
}