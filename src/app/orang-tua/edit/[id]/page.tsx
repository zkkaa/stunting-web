'use client';

import React, { useState, useEffect } from 'react';
import { Layout, ProtectedRoute } from '@/components';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { fetchParentDetailByNoKK, updateParentData } from '@/utils/database-clean';
import { useParams } from 'next/navigation';

function OrangTuaEditPageContent() {
  const router = useRouter();
  const params = useParams();
  const parentId = params?.id as string;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [fatherImageFile, setFatherImageFile] = useState<File | null>(null);
  const [motherImageFile, setMotherImageFile] = useState<File | null>(null);

  // Load parent data from database
  useEffect(() => {
    const loadParentData = async () => {
      if (!parentId) return;
      
      try {
        setLoading(true);
        setError('');
        
        // parentId should be no_kk (family number)
        const parentDetail = await fetchParentDetailByNoKK(parentId);
        
        if (!parentDetail) {
          setError('Data orang tua tidak ditemukan');
          return;
        }
        
        // Transform database data to component format
        const transformedData = {
          father: {
            name: parentDetail.father?.nama || 'Tidak ada',
            nik: parentDetail.father?.nik || '',
            phone: parentDetail.father?.no_hp || '',
            birthPlace: parentDetail.father?.tempat_lahir || '',
            birthDate: parentDetail.father?.tanggal_lahir || '',
            image: parentDetail.father?.image_orangtua || '/image/icon/pengukuran-anak.jpg',
          },
          mother: {
            name: parentDetail.mother?.nama || 'Tidak ada',
            nik: parentDetail.mother?.nik || '',
            phone: parentDetail.mother?.no_hp || '',
            birthPlace: parentDetail.mother?.tempat_lahir || '',
            birthDate: parentDetail.mother?.tanggal_lahir || '',
            image: parentDetail.mother?.image_orangtua || '/image/icon/pengukuran-anak.jpg',
          },
          family: {
            kk: parentDetail.family.no_kk,
            childrenCount: parentDetail.family.childrenCount, // Read-only, auto calculated
          },
          address: {
            provinsi: parentDetail.address?.provinsi || '',
            kota: parentDetail.address?.kota || '',
            kecamatan: parentDetail.address?.kecamatan || '',
            desa: parentDetail.address?.desa || '',
            kodePos: parentDetail.address?.kode_pos || '',
            detail: parentDetail.address?.jalan || '',
          },
        };
        
        setData(transformedData);
        setInitialData(transformedData);
        
      } catch (err) {
        console.error('Error loading parent data:', err);
        setError('Gagal memuat data orang tua');
      } finally {
        setLoading(false);
      }
    };

    loadParentData();
  }, [parentId]);

  const update = (path: string, value: string | number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setData((prev: any) => {
      const next = { ...prev };
      const keys = path.split('.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let cur: Record<string, any> = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...cur[keys[i]] };
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      console.log('💾 Saving parent data...');
      
      // Get the new No KK (might be different from original)
      const newNoKK = data.family.kk;
      
      // Call the update function with image files
      await updateParentData(
        parentId, // original no_kk for WHERE clause
        data,
        fatherImageFile || undefined,
        motherImageFile || undefined
      );
      
      console.log('✅ Parent data saved successfully');
      
      // Redirect to detail page with the NEW No KK (not the original parentId)
      router.push(`/orang-tua/${newNoKK}`);
    } catch (err) {
      console.error('❌ Error saving parent data:', err);
      setError('Gagal menyimpan data orang tua');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // If No KK has been changed, go to the original No KK detail page
    // If not changed, go to current parentId detail page
    const originalNoKK = initialData?.family?.kk || parentId;
    router.push(`/orang-tua/${originalNoKK}`);
  };

  return (
    <Layout>
      <div className="min-h-screen relative overflow-x-hidden">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-60 z-10"
          style={{
            background: `radial-gradient(ellipse at center top, rgba(158, 202, 214, 0.6) 0%, rgba(158, 202, 214, 0.3) 30%, rgba(158, 202, 214, 0.1) 50%, transparent 70%)`
          }}
        />

        <div className="relative z-20 py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <Link href={`/orang-tua/${parentId}`} className="mb-4 inline-flex items-center gap-2 text-lg md:text-2xl text-gray-700 hover:underline">
              <FiArrowLeft size={20} />
              <span>Kembali ke Detail</span>
            </Link>
            <div className="text-center text-2xl sm:text-3xl md:text-5xl font-semibold text-gray-700 mb-4">Edit Profile Orang Tua</div>

            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#407A81]"></div>
                <p className="mt-4 text-gray-600">Memuat data...</p>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-500 mb-4">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-4 py-2 bg-[#407A81] text-white rounded-md hover:bg-[#326269]"
                >
                  Coba Lagi
                </button>
              </div>
            ) : !data ? (
              <div className="text-center py-20">
                <p className="text-gray-500">Data tidak ditemukan</p>
              </div>
            ) : (
              <div 
                className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6"
                style={{ boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D' }}
              >
                <div className="p-4 sm:p-6">
                  {/* Father */}
                  <SectionTitle title="Identitas Ayah" />
                  <IdentityRow
                    editing={true}
                    image={data.father.image}
                    name={data.father.name}
                    nik={data.father.nik}
                    phone={data.father.phone}
                    birthPlace={data.father.birthPlace}
                    birthDate={data.father.birthDate}
                    subject="Ayah"
                    onChange={(field, val) => update(`father.${field}`, val)}
                    onImageFile={(file) => setFatherImageFile(file)}
                  />

                  {/* Mother */}
                  <div className="mt-6 sm:mt-8">
                    <SectionTitle title="Identitas Ibu" />
                    <IdentityRow
                      editing={true}
                      image={data.mother.image}
                      name={data.mother.name}
                      nik={data.mother.nik}
                      phone={data.mother.phone}
                      birthPlace={data.mother.birthPlace}
                      birthDate={data.mother.birthDate}
                      subject="Ibu"
                      onChange={(field, val) => update(`mother.${field}`, val)}
                      onImageFile={(file) => setMotherImageFile(file)}
                    />
                  </div>

                  {/* Family - Read-only section */}
                  <div className="mt-6 sm:mt-8">
                    <SectionTitle title="Identitas Keluarga" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <InputField 
                        label="No KK" 
                        value={data.family.kk} 
                        onChange={(v) => update('family.kk', v)} 
                      />
                      <div className="mb-3">
                        <div className="text-[11px] text-gray-500 mb-1">Jumlah Anak</div>
                        <div className="w-full px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-gray-600 text-sm">
                          {data.family.childrenCount} Anak (Otomatis)
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Jumlah anak dihitung otomatis berdasarkan data anak yang terdaftar</div>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="mt-6 sm:mt-8">
                    <SectionTitle title="Alamat Rumah" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <InputField label="Provinsi" value={data.address.provinsi} onChange={(v) => update('address.provinsi', v)} />
                        <InputField label="Kecamatan" value={data.address.kecamatan} onChange={(v) => update('address.kecamatan', v)} />
                        <InputField label="Detail Jalan" value={data.address.detail} onChange={(v) => update('address.detail', v)} />
                      </div>
                      <div>
                        <InputField label="Kota/Kabupaten" value={data.address.kota} onChange={(v) => update('address.kota', v)} />
                        <InputField label="Desa" value={data.address.desa} onChange={(v) => update('address.desa', v)} />
                        <InputField label="Kode Pos" value={data.address.kodePos} onChange={(v) => update('address.kodePos', v)} />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-8 flex items-center justify-end gap-3">
                    <button 
                      onClick={handleCancel} 
                      className="px-6 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                      disabled={saving}
                    >
                      Batal
                    </button>
                    <button 
                      onClick={handleSave} 
                      className="px-6 py-2 rounded-md bg-[#407A81] text-white hover:bg-[#326269] disabled:opacity-50"
                      disabled={saving}
                    >
                      {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <div className="text-base sm:text-lg font-semibold text-gray-700 mb-3">{title}</div>;
}

function InputField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-3">
      <div className="text-[11px] text-gray-500 mb-1">{label}</div>
      <input 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#9ECAD6] focus:border-transparent text-sm" 
      />
    </div>
  );
}

function IdentityRow({ editing = false, image, name, nik, phone, birthPlace, birthDate, subject, onChange, onImageFile }: { editing?: boolean; image: string; name: string; nik: string; phone: string; birthPlace: string; birthDate: string; subject?: 'Ayah' | 'Ibu'; onChange?: (field: string, value: string) => void; onImageFile?: (file: File) => void; }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-start">
      {/* Left: Photo + Upload */}
      <div>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 sm:w-28 sm:h-28 relative rounded-2xl overflow-hidden bg-[#E5F3F5] flex items-center justify-center text-[#397789]">
            {image && image !== '/image/icon/pengukuran-anak.jpg' && !image.startsWith('blob:') ? (
              <img 
                src={image} 
                alt={name} 
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.removeAttribute('style');
                }}
              />
            ) : image && image.startsWith('blob:') ? (
              <img src={image} alt={name} className="absolute inset-0 w-full h-full object-cover" />
            ) : null}
            <svg 
              width="36" 
              height="36" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className={image && image !== '/image/icon/pengukuran-anak.jpg' ? 'hidden' : ''}
            >
              <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-4.418 0-8 3.582-8 8h16c0-4.418-3.582-8-8-8Z" fill="#397789"/>
            </svg>
          </div>
          <div className="text-xs text-gray-500 leading-4">
            <div className="font-semibold">Upload Foto {subject}</div>
            <div>Format PNG, JPG maksimal 2MB</div>
          </div>
        </div>

        {/* Upload Button */}
        <div className="mt-3">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer text-sm">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  if (onChange) {
                    onChange('image', url);
                  }
                  if (onImageFile) {
                    onImageFile(file);
                  }
                }
              }}
            />
            <span>Pilih Foto</span>
          </label>
        </div>

        <div className="mt-4">
          <InputField label={`Nomor Telepon ${subject}`} value={phone} onChange={(v) => onChange && onChange('phone', v)} />
          <InputField label="Tempat Lahir" value={birthPlace} onChange={(v) => onChange && onChange('birthPlace', v)} />
        </div>
      </div>

      {/* Right: Form Fields */}
      <div>
        <InputField label="Nama Lengkap" value={name} onChange={(v) => onChange && onChange('name', v)} />
        <InputField label="NIK" value={nik} onChange={(v) => onChange && onChange('nik', v)} />
        <div className="mb-3">
          <div className="text-[11px] text-gray-500 mb-1">Tanggal Lahir</div>
          <input 
            type="date"
            value={birthDate} 
            onChange={(e) => onChange && onChange('birthDate', e.target.value)} 
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#9ECAD6] focus:border-transparent text-sm" 
          />
        </div>
      </div>
    </div>
  );
}

export default function OrangTuaEditPage() {
  return (
    <ProtectedRoute>
      <OrangTuaEditPageContent />
    </ProtectedRoute>
  );
}