'use client';

import React, { useState } from 'react';
import { Layout, ProtectedRoute } from '@/components';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { insertParentData, NewParentData } from '@/utils/database-clean';

function Input({ label, placeholder = '', value, onChange }: { label: string; placeholder?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-3">
      <div className="text-[11px] text-gray-500 mb-1">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#9ECAD6] focus:border-transparent text-sm"
      />
    </div>
  );
}

function TambahOrangTuaPageContent() {
  const router = useRouter();
  const [form, setForm] = useState({
    father: { name: '', nik: '', phone: '', birthPlace: '', birthDate: '' },
    mother: { name: '', nik: '', phone: '', birthPlace: '', birthDate: '' },
    family: { kk: '' },
    address: { provinsi: '', kota: '', kecamatan: '', desa: '', detail: '', kodePos: '' },
  });
  const [fatherImage, setFatherImage] = useState<string>('');
  const [motherImage, setMotherImage] = useState<string>('');
  const [fatherImageFile, setFatherImageFile] = useState<File | null>(null);
  const [motherImageFile, setMotherImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = (section: keyof typeof form, field: string, value: string) => {
    setForm((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Validation
      if (!form.family.kk.trim()) {
        setSubmitError('Nomor Kartu Keluarga harus diisi');
        return;
      }
      if (!form.father.name.trim() || !form.father.nik.trim()) {
        setSubmitError('Nama dan NIK Ayah harus diisi');
        return;
      }
      if (!form.mother.name.trim() || !form.mother.nik.trim()) {
        setSubmitError('Nama dan NIK Ibu harus diisi');
        return;
      }

      // Convert form data to database format
      const parentData: NewParentData = {
        father: {
          nik: form.father.nik,
          nama: form.father.name,
          no_hp: form.father.phone,
          tempat_lahir: form.father.birthPlace,
          tanggal_lahir: form.father.birthDate,
          role: 'ayah'
        },
        mother: {
          nik: form.mother.nik,
          nama: form.mother.name,
          no_hp: form.mother.phone,
          tempat_lahir: form.mother.birthPlace,
          tanggal_lahir: form.mother.birthDate,
          role: 'ibu'
        },
        family: {
          no_kk: form.family.kk
        },
        address: {
          provinsi: form.address.provinsi,
          kota: form.address.kota,
          kecamatan: form.address.kecamatan,
          desa: form.address.desa,
          jalan: form.address.detail,
          kode_pos: form.address.kodePos
        }
      };

      console.log('Submitting parent data:', parentData);
      
      await insertParentData(parentData, fatherImageFile || undefined, motherImageFile || undefined);
      
      console.log('Parent data saved successfully');
      router.push('/orang-tua');
      
    } catch (error: unknown) {
      console.error('Error saving parent data:', error);
      setSubmitError(error instanceof Error ? error.message : 'Gagal menyimpan data orang tua');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen relative overflow-x-hidden">
        <div className="relative z-20 py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <Link href="/orang-tua" className="mb-4 inline-flex items-center gap-2 text-[#397789] hover:underline">
              <span>&lt;</span>
              <span>Orang Tua</span>
            </Link>
            <div className="text-center text-2xl sm:text-3xl font-semibold text-gray-700 mb-4">Tambah Orang Tua</div>

            {/* Error Message */}
            {submitError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{submitError}</p>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6" style={{ boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D' }}>
              <div className="p-5 sm:p-6">
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="text-xs font-semibold text-gray-600 mb-2">Identitas Keluarga</div>
                    <Input label="Nomor Kartu Keluarga" placeholder="Masukkan Nomor KK" value={form.family.kk} onChange={(v) => update('family', 'kk', v)} />
                  </div>
                </div>
                <div className="text-xs font-semibold text-gray-600 mb-2">Identitas Ayah</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-[#E5F3F5] flex items-center justify-center text-[#397789]">
                        {fatherImage ? (
                          <img src={fatherImage} alt="foto ayah" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-4.418 0-8 3.582-8 8h16c0-4.418-3.582-8-8-8Z" fill="#397789"/>
                          </svg>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 leading-4">
                        <div className="font-semibold">Upload Foto Ayah</div>
                        <div>Profile Picture should be in the standard</div>
                        <div>format png, jpg & no more than 2MB</div>
                        <label className="inline-flex mt-2 px-2 py-1 rounded-md border border-gray-300 cursor-pointer hover:bg-gray-50 text-xs text-gray-700">
                          Pilih Foto
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFatherImageFile(file);
                              setFatherImage(URL.createObjectURL(file));
                            }
                          }} />
                        </label>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Input label="Nomor Telepon Ayah" placeholder="Masukkan Nomor Telepon" value={form.father.phone} onChange={(v) => update('father', 'phone', v)} />
                    </div>
                    <Input label="Tempat Lahir" placeholder="Masukkan Tempat Lahir" value={form.father.birthPlace} onChange={(v) => update('father', 'birthPlace', v)} />
                  </div>
                  <div>
                    <Input label="Nama Lengkap" placeholder="Masukkan Nama Ayah" value={form.father.name} onChange={(v) => update('father', 'name', v)} />
                    <Input label="NIK" placeholder="Masukkan NIK Ayah" value={form.father.nik} onChange={(v) => update('father', 'nik', v)} />
                    <div className="mb-3">
                      <div className="text-[11px] text-gray-500 mb-1">Tanggal Lahir</div>
                      <input
                        type="date"
                        value={form.father.birthDate}
                        onChange={(e) => update('father', 'birthDate', e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#9ECAD6] focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-xs font-semibold text-gray-600 mb-2">Identitas Ibu</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-[#E5F3F5] flex items-center justify-center text-[#397789]">
                        {motherImage ? (
                          <img src={motherImage} alt="foto ibu" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-4.418 0-8 3.582-8 8h16c0-4.418-3.582-8-8-8Z" fill="#397789"/>
                          </svg>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 leading-4">
                        <div className="font-semibold">Upload Foto Ibu</div>
                        <div>Profile Picture should be in the standard</div>
                        <div>format png, jpg & no more than 2MB</div>
                        <label className="inline-flex mt-2 px-2 py-1 rounded-md border border-gray-300 cursor-pointer hover:bg-gray-50 text-xs text-gray-700">
                          Pilih Foto
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setMotherImageFile(file);
                              setMotherImage(URL.createObjectURL(file));
                            }
                          }} />
                        </label>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Input label="Nomor Telepon Ibu" placeholder="Masukkan Nomor Telepon" value={form.mother.phone} onChange={(v) => update('mother', 'phone', v)} />
                    </div>
                    <Input label="Tempat Lahir" placeholder="Masukkan Tempat Lahir" value={form.mother.birthPlace} onChange={(v) => update('mother', 'birthPlace', v)} />
                  </div>
                  <div>
                    <Input label="Nama Lengkap" placeholder="Masukkan Nama Ibu" value={form.mother.name} onChange={(v) => update('mother', 'name', v)} />
                    <Input label="NIK" placeholder="Masukkan NIK Ibu" value={form.mother.nik} onChange={(v) => update('mother', 'nik', v)} />
                    <div className="mb-3">
                      <div className="text-[11px] text-gray-500 mb-1">Tanggal Lahir</div>
                      <input
                        type="date"
                        value={form.mother.birthDate}
                        onChange={(e) => update('mother', 'birthDate', e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#9ECAD6] focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs font-semibold text-gray-600 mb-2">Informasi Alamat Rumah</div>
                    <Input label="Provinsi" placeholder="Masukkan Provinsi" value={form.address.provinsi} onChange={(v) => update('address', 'provinsi', v)} />
                    <Input label="Kecamatan" placeholder="Masukkan Kecamatan" value={form.address.kecamatan} onChange={(v) => update('address', 'kecamatan', v)} />
                    <Input label="Detail Jalan" placeholder="Masukkan detail jalan alamat rumah" value={form.address.detail} onChange={(v) => update('address', 'detail', v)} />
                  </div>
                  <div>
                    <div className="h-[22px]" />
                    <Input label="Kota/Kabupaten" placeholder="Masukkan Kota/Kabupaten" value={form.address.kota} onChange={(v) => update('address', 'kota', v)} />
                    <Input label="Desa" placeholder="Masukkan Desa" value={form.address.desa} onChange={(v) => update('address', 'desa', v)} />
                    <Input label="Kode Pos" placeholder="Masukkan Kode Pos" value={form.address.kodePos} onChange={(v) => update('address', 'kodePos', v)} />
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-full bg-[#407A81] text-white hover:bg-[#326269] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Tambah Orang Tua'}
                  </button>
                </div>
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

