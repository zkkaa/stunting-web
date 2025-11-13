'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Layout, ProtectedRoute } from '@/components';
import Link from 'next/link';
import { FiMoreVertical, FiArrowLeft } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { fetchParentDetailByNoKK, insertChildData, uploadChildImage, NewChildData } from '@/utils/database-clean';
import { useParams } from 'next/navigation';

// Helper function to format age display
const formatAge = (years: number, months: number): string => {
  if (years === 0 && months === 0) {
    return 'Baru lahir';
  } else if (years === 0) {
    return `${months} Bulan`;
  } else if (months === 0) {
    return `${years} Tahun`;
  } else {
    return `${years} Tahun ${months} Bulan`;
  }
};

function OrangTuaDetailPageContent() {
  const router = useRouter();
  const params = useParams();
  const parentId = params?.id as string;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
            childrenCount: parentDetail.family.childrenCount,
          },
          address: {
            provinsi: parentDetail.address?.provinsi || '',
            kota: parentDetail.address?.kota || '',
            kecamatan: parentDetail.address?.kecamatan || '',
            desa: parentDetail.address?.desa || '',
            kodePos: parentDetail.address?.kode_pos || '',
            detail: parentDetail.address?.jalan || '',
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          children: parentDetail.children.map((child: any) => ({
            id: child.nik,
            name: child.nama,
            avatar: child.image_anak || '/image/icon/bayi-icon.svg',
            gender: child.gender,
            ageYears: child.umur_tahun || 0,
            ageMonths: child.umur_bulan || 0,
            nik: child.nik
          })),
        };
        
        setData(transformedData);
        
      } catch (err) {
        console.error('Error loading parent data:', err);
        setError('Gagal memuat data orang tua');
      } finally {
        setLoading(false);
      }
    };

    loadParentData();
  }, [parentId]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [childForm, setChildForm] = useState({
    name: '',
    nik: '',
    birthPlace: '',
    birthDate: '',
    currentAge: '',
    ageUnit: 'Bulan',
    gender: 'L',
    birthWeight: '',
    birthHeight: '',
    birthHeadCircumference: '',
    photo: null as string | null,
  });
  const [childImageFile, setChildImageFile] = useState<File | null>(null);
  const [isSubmittingChild, setIsSubmittingChild] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isManualAge, setIsManualAge] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [childMenuOpenId, setChildMenuOpenId] = useState<string | null>(null);
  const [childDeleteId, setChildDeleteId] = useState<string | null>(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showAddChild) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddChild]);

  // Function to calculate age from birth date
  const calculateAgeFromBirthDate = (birthDate: string) => {
    if (!birthDate) return { months: 0, years: 0 };
    
    const birth = new Date(birthDate);
    const today = new Date();
    
    let months = (today.getFullYear() - birth.getFullYear()) * 12;
    months -= birth.getMonth();
    months += today.getMonth();
    
    if (today.getDate() < birth.getDate()) {
      months--;
    }
    
    const years = Math.floor(months / 12);
    
    return { months: months < 0 ? 0 : months, years };
  };

  // Handle birth date change with auto-calculation
  const handleChildBirthDateChange = (birthDate: string) => {
    if (birthDate && !isManualAge) {
      const { months, years } = calculateAgeFromBirthDate(birthDate);
      
      if (years < 2) {
        setChildForm(prev => ({ 
          ...prev, 
          birthDate,
          currentAge: months.toString(), 
          ageUnit: 'Bulan' 
        }));
      } else {
        setChildForm(prev => ({ 
          ...prev, 
          birthDate,
          currentAge: years.toString(), 
          ageUnit: 'Tahun' 
        }));
      }
    } else {
      setChildForm(prev => ({ ...prev, birthDate }));
    }
  };

  // Handle child form submission
  const handleAddChildSubmit = async () => {
    if (!parentId) {
      setSubmitError('Data orang tua tidak ditemukan');
      return;
    }

    try {
      setIsSubmittingChild(true);
      setSubmitError(null);

      // Calculate age in years and months
      const calculateAge = () => {
        if (childForm.birthDate) {
          const { months, years } = calculateAgeFromBirthDate(childForm.birthDate);
          return { years, months: months % 12 };
        }
        const currentAge = parseInt(childForm.currentAge) || 0;
        if (childForm.ageUnit === 'Tahun') {
          return { years: currentAge, months: 0 };
        } else {
          return { years: Math.floor(currentAge / 12), months: currentAge % 12 };
        }
      };

      const ageData = calculateAge();

      // Upload image if provided
      let imageUrl = null;
      if (childImageFile && childForm.nik) {
        try {
          console.log('Uploading child image...');
          imageUrl = await uploadChildImage(childImageFile, childForm.nik);
          console.log('Image uploaded successfully:', imageUrl);
        } catch (imageError) {
          console.error('Error uploading image:', imageError);
        }
      }

      const childData: NewChildData = {
        nik: childForm.nik,
        no_kk: parentId,
        nama: childForm.name,
        tanggal_lahir: childForm.birthDate,
        tempat_lahir: childForm.birthPlace,
        gender: childForm.gender,
        umur_tahun: ageData.years,
        umur_bulan: ageData.months,
        bb_lahir: parseFloat(childForm.birthWeight) || 0,
        tb_lahir: parseFloat(childForm.birthHeight) || 0,
        lk_lahir: parseFloat(childForm.birthHeadCircumference) || 0,
        image_anak: imageUrl,
        aktif: true
      };

      console.log('Submitting child data:', childData);
      
      await insertChildData(childData);
      
      console.log('Child data saved successfully');
      
      // Reset form and close modal
      setChildForm({
        name: '',
        nik: '',
        birthPlace: '',
        birthDate: '',
        currentAge: '',
        ageUnit: 'Bulan',
        gender: 'L',
        birthWeight: '',
        birthHeight: '',
        birthHeadCircumference: '',
        photo: null,
      });
      setChildImageFile(null);
      setIsManualAge(false);
      setShowAddChild(false);
      
      // Reload parent data to show new child
      const parentDetail = await fetchParentDetailByNoKK(parentId);
      if (parentDetail) {
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
            childrenCount: parentDetail.family.childrenCount,
          },
          address: {
            provinsi: parentDetail.address?.provinsi || '',
            kota: parentDetail.address?.kota || '',
            kecamatan: parentDetail.address?.kecamatan || '',
            desa: parentDetail.address?.desa || '',
            kodePos: parentDetail.address?.kode_pos || '',
            detail: parentDetail.address?.jalan || '',
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          children: parentDetail.children.map((child: any) => ({
            id: child.nik,
            name: child.nama,
            avatar: child.image_anak || '/image/icon/bayi-icon.svg',
            gender: child.gender,
            ageYears: child.umur_tahun || 0,
            ageMonths: child.umur_bulan || 0,
            nik: child.nik
          })),
        };
        setData(transformedData);
      }
      
    } catch (error: unknown) {
      console.error('Error saving child data:', error);
      setSubmitError(error instanceof Error ? error.message : 'Gagal menyimpan data anak');
    } finally {
      setIsSubmittingChild(false);
    }
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
            <Link href="/orang-tua" className="mb-4 inline-flex items-center gap-2 text-lg  md:text-2xl text-gray-700 hover:underline">
            <FiArrowLeft size={20} />
              <span>Orang Tua</span>
            </Link>
            <div className="text-center text-2xl sm:text-3xl md:text-5xl font-semibold text-gray-700 mb-4">Profile Orang Tua</div>

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
              <>
            

            {/* Detail Card */}
            <div 
              className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6"
              style={{ boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D' }}
            >
              <div className="p-4 sm:p-6">
                <div className="flex justify-end relative">
                  <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 text-[#397789]"><FiMoreVertical /></button>
                  {menuOpen && (
                    <div className="absolute top-8 right-0 w-40 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden z-20">
                      <button onClick={() => { router.push(`/orang-tua/edit/${parentId}`); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Edit</button>
                      <button onClick={() => { setMenuOpen(false); setShowDelete(true); }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Hapus</button>
                    </div>
                  )}
                </div>

                {/* Father */}
                <SectionTitle title="Identitas Ayah" />
                <IdentityRow
                  image={data.father.image}
                  name={data.father.name}
                  nik={data.father.nik}
                  phone={data.father.phone}
                  birthPlace={data.father.birthPlace}
                  birthDate={data.father.birthDate}
                  subject="Ayah"
                />

                {/* Mother */}
                <div className="mt-4 sm:mt-6">
                  <SectionTitle title="Identitas Ibu" />
                  <IdentityRow
                    image={data.mother.image}
                    name={data.mother.name}
                    nik={data.mother.nik}
                    phone={data.mother.phone}
                    birthPlace={data.mother.birthPlace}
                    birthDate={data.mother.birthDate}
                    subject="Ibu"
                  />
                </div>

                {/* Family */}
                <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <div className="text-base sm:text-lg font-semibold text-gray-700 mb-2">Identitas Keluarga</div>
                    <div className="mb-2">
                      <div className="text-sm sm:text-base text-gray-500">No KK</div>
                      <div className="text-lg sm:text-xl font-semibold text-gray-800">{data.family.kk}</div>
                    </div>
                  </div>
                  <div>
                    <div className="h-[22px]" />
                    <div className="mb-2">
                      <div className="text-sm sm:text-base text-gray-500">Jumlah Anak</div>
                      <div className="text-lg sm:text-xl font-semibold text-gray-800">{`${data.family.childrenCount} Anak`}</div>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <SectionTitle title="Alamat Rumah" />
                    <KeyValue label="Provinsi" value={data.address.provinsi} />
                    <KeyValue label="Kecamatan" value={data.address.kecamatan} />
                    <KeyValue label="Detail Jalan" value={data.address.detail} />
                  </div>
                  <div>
                    <div className="h-[22px]" />
                    <KeyValue label="Kota/Kabupaten" value={data.address.kota} />
                    <KeyValue label="Desa" value={data.address.desa} />
                    <KeyValue label="Kode Pos" value={data.address.kodePos} />
                  </div>
                </div>
              </div>
            </div>

            {/* Children Card */}
            <div 
              className="bg-white rounded-xl border border-gray-200 shadow-sm"
              style={{ boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D' }}
            >
              <div className="p-4 flex items-center justify-between">
                <div className="font-semibold text-gray-700 text-lg">Anak</div>
                <button onClick={() => setShowAddChild(true)} className="px-4 py-2 rounded-full bg-[#407A81] text-white text-sm hover:bg-[#326269]">Tambah Anak</button>
              </div>
              <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                {data?.children && data.children.length > 0 ? (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  data.children.map((c: any) => (
                  <div
                    key={c.id}
                    className="relative rounded-md border border-gray-200 bg-white px-3 py-3 cursor-pointer hover:border-[#407A81]"
                    style={{ boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D' }}
                    onClick={() => router.push(`/anak/${c.nik}`)}
                  >
                    <button
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                      onClick={(e) => { e.stopPropagation(); setChildMenuOpenId(childMenuOpenId === c.id ? null : c.id); }}
                    >
                      <FiMoreVertical />
                    </button>
                    {childMenuOpenId === c.id && (
                      <div className="absolute right-2 top-8 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-20 overflow-hidden">
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setChildMenuOpenId(null); 
                            router.push(`/anak/edit/${c.nik}`);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setChildMenuOpenId(null); setChildDeleteId(c.id); }}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#E5F3F5] flex items-center justify-center text-[#397789]">
                        {c.avatar && c.avatar !== '/image/icon/bayi-icon.svg' ? (
                          <img 
                            src={c.avatar} 
                            alt={c.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.removeAttribute('style');
                            }}
                          />
                        ) : null}
                        <svg 
                          width="28" 
                          height="28" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                          className={c.avatar && c.avatar !== '/image/icon/bayi-icon.svg' ? 'hidden' : ''}
                        >
                          <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-4.418 0-8 3.582-8 8h16c0-4.418-3.582-8-8-8Z" fill="#397789"/>
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 text-lg leading-tight truncate">{c.name}</div>
                        <div className="text-xs text-[#407A81]">{c.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
                        <div className="text-xs text-gray-500">Umur: {formatAge(c.ageYears || 0, c.ageMonths || 0)}</div>
                      </div>
                    </div>
                  </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <div className="text-gray-400">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-3">
                        <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-4.418 0-8 3.582-8 8h16c0-4.418-3.582-8-8-8Z" fill="currentColor"/>
                      </svg>
                    </div>
                    <p className="text-gray-500 text-base">Tidak Ada Anak</p>
                    <p className="text-gray-400 text-sm mt-1">Belum ada data anak yang terdaftar</p>
                  </div>
                )}
              </div>
            </div>
            {/* Child delete confirm */}
            {childDeleteId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setChildDeleteId(null)} />
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                  <div className="text-center text-lg font-semibold text-gray-900 mb-4">Hapus anak ini?</div>
                  <div className="space-y-3">
                    <button onClick={() => { console.log('hapus anak', childDeleteId); setChildDeleteId(null); }} className="w-full px-4 py-2 rounded-full bg-[#407A81] text-white hover:bg-[#326269]">Hapus</button>
                    <button onClick={() => setChildDeleteId(null)} className="w-full px-4 py-2 rounded-full border-2 border-[#407A81] text-[#407A81] hover:bg-[#E7F5F7]">Batalkan</button>
                  </div>
                </div>
              </div>
            )}
            {/* Add Child Modal */}
              {showAddChild && (
              <div className="fixed inset-0 z-50 flex justify-center px-4 py-24">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => {
                  setShowAddChild(false);
                  setSubmitError(null);
                }} />
                <div className="relative mx-auto bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-y-auto">
                  <div className="sticky top-0 bg-white pt-6 pb-4 px-6 md:px-8 border-b border-gray-100 z-10">
                    <div className="text-center text-2xl font-bold">Tambah Anak</div>
                  </div>
                  <div className="p-6 md:p-8 pt-4">
                  
                  {/* Error Message */}
                  {submitError && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{submitError}</p>
                    </div>
                  )}
                  
                  {/* Profile Image */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-[#E5F3F5] flex items-center justify-center text-[#397789]">
                        {childForm.photo ? (
                          <img src={childForm.photo} alt="foto anak" className="w-full h-full object-cover" />
                        ) : (
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-4.418 0-8 3.582-8 8h16c0-4.418-3.582-8-8-8Z" fill="#397789"/>
                          </svg>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-[#407A81] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#326269] transition-colors"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setChildImageFile(file);
                            setChildForm(prev => ({ ...prev, photo: URL.createObjectURL(file) }));
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Identitas Anak Section */}
                  <div className="mb-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Identitas Anak</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nama Anak</label>
                        <input
                          type="text"
                          value={childForm.name}
                          onChange={(e) => setChildForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                          placeholder="Emma Jhon"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">NIK Anak</label>
                        <input
                          type="text"
                          value={childForm.nik}
                          onChange={(e) => setChildForm(prev => ({ ...prev, nik: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                          placeholder="008211102131223"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tempat Lahir</label>
                        <input
                          type="text"
                          value={childForm.birthPlace}
                          onChange={(e) => setChildForm(prev => ({ ...prev, birthPlace: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                          placeholder="Tasikmalaya"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Lahir</label>
                        <input
                          type="date"
                          value={childForm.birthDate}
                          onChange={(e) => handleChildBirthDateChange(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Usia Bayi saat ini
                          {childForm.birthDate && !isManualAge && (
                            <span className="text-xs text-green-600 ml-2">(Otomatis)</span>
                          )}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={childForm.currentAge}
                            onChange={(e) => {
                              if (e.nativeEvent && e.nativeEvent.isTrusted) {
                                setIsManualAge(true);
                              }
                              setChildForm(prev => ({ ...prev, currentAge: e.target.value }));
                            }}
                            className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none text-center"
                            placeholder="0"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (childForm.birthDate && !isManualAge) {
                                const { months } = calculateAgeFromBirthDate(childForm.birthDate);
                                setChildForm(prev => ({ ...prev, currentAge: months.toString(), ageUnit: 'Bulan' }));
                              } else {
                                setChildForm(prev => ({ ...prev, ageUnit: 'Bulan' }));
                              }
                            }}
                            className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors cursor-pointer ${
                              childForm.ageUnit === 'Bulan'
                                ? 'bg-[#407A81] text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Bulan
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (childForm.birthDate && !isManualAge) {
                                const { years } = calculateAgeFromBirthDate(childForm.birthDate);
                                setChildForm(prev => ({ ...prev, currentAge: years.toString(), ageUnit: 'Tahun' }));
                              } else {
                                setChildForm(prev => ({ ...prev, ageUnit: 'Tahun' }));
                              }
                            }}
                            className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors cursor-pointer ${
                              childForm.ageUnit === 'Tahun'
                                ? 'bg-[#407A81] text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Tahun
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Kelamin</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setChildForm(prev => ({ ...prev, gender: 'L' }))}
                            className={`py-2 px-4 rounded-lg font-medium transition-colors cursor-pointer ${
                              childForm.gender === 'L'
                                ? 'bg-[#407A81] text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Laki Laki
                          </button>
                          <button
                            type="button"
                            onClick={() => setChildForm(prev => ({ ...prev, gender: 'P' }))}
                            className={`py-2 px-4 rounded-lg font-medium transition-colors cursor-pointer ${
                              childForm.gender === 'P'
                                ? 'bg-[#407A81] text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Perempuan
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Data Timbangan Section */}
                  <div className="mb-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Data Timbangan saat Lahir</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Berat Badan Lahir</label>
                        <input
                          type="number"
                          step="0.1"
                          value={childForm.birthWeight}
                          onChange={(e) => setChildForm(prev => ({ ...prev, birthWeight: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                          placeholder="0.5 Kg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tinggi Badan Lahir</label>
                        <input
                          type="number"
                          value={childForm.birthHeight}
                          onChange={(e) => setChildForm(prev => ({ ...prev, birthHeight: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                          placeholder="30 Cm"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Lingkar Kepala Lahir</label>
                        <input
                          type="number"
                          value={childForm.birthHeadCircumference}
                          onChange={(e) => setChildForm(prev => ({ ...prev, birthHeadCircumference: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                          placeholder="15 Cm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center justify-center gap-4">
                    <button 
                      onClick={() => {
                        setShowAddChild(false);
                        setSubmitError(null);
                      }} 
                      disabled={isSubmittingChild}
                      className="px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button 
                      onClick={handleAddChildSubmit}
                      disabled={isSubmittingChild}
                      className="px-6 py-3 rounded-lg bg-[#407A81] text-white hover:bg-[#326269] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingChild ? 'Menyimpan...' : 'Tambah Anak'}
                    </button>
                  </div>
                  </div>
                </div>
              </div>
            )}
            {/* Delete confirm modal */}
            {showDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDelete(false)} />
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                  <div className="text-center text-lg font-semibold text-gray-900 mb-4">Apakah anda yakin ingin menghapusnya?</div>
                  <div className="space-y-3">
                    <button onClick={() => { setShowDelete(false); console.log('hapus orang tua'); }} className="w-full px-4 py-2 rounded-full bg-[#407A81] text-white hover:bg-[#326269]">Hapus</button>
                    <button onClick={() => setShowDelete(false)} className="w-full px-4 py-2 rounded-full border-2 border-[#407A81] text-[#407A81] hover:bg-[#E7F5F7]">Batalkan</button>
                  </div>
                </div>
              </div>
            )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <div className="text-sm sm:text-xs font-semibold text-gray-600 mb-2">{title}</div>;
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2">
      <div className="text-xs sm:text-[11px] text-gray-500">{label}</div>
      <div className="text-base sm:text-sm text-gray-800">{value || 'Tidak ada'}</div>
    </div>
  );
}

function InputField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-2">
      <div className="text-[11px] text-gray-500 mb-1">{label}</div>
      <input 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#9ECAD6] focus:border-transparent text-sm" 
      />
    </div>
  );
}



function IdentityRow({ image, name, nik, phone, birthPlace, birthDate, subject }: { image: string; name: string; nik: string; phone: string; birthPlace: string; birthDate: string; subject?: 'Ayah' | 'Ibu'; }) {
  // Only clean name if it's not "Tidak ada"
  const cleanedName = name === 'Tidak ada' ? name : name.replace(/^(Bapak|Ibu)\s+/i, '').trim();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5 items-start">
      {/* Left: Photo + helper (only when editing) + phone */}
      <div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 relative rounded-2xl overflow-hidden bg-[#E5F3F5] flex items-center justify-center text-[#397789]">
            {image && image !== '/image/icon/pengukuran-anak.jpg' ? (
              <img 
                src={image} 
                alt={name} 
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.removeAttribute('style');
                }}
              />
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
          {/* Header beside image */}
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight truncate">
              {cleanedName === 'Tidak ada' 
                ? `${subject === 'Ibu' ? 'Ibu' : 'Bapak'} Tidak Ada`
                : `${subject === 'Ibu' ? 'Ibu' : 'Bapak'} ${cleanedName.split(/\s+/)[0]}`
              }
            </div>
            <div className="text-xs sm:text-sm text-[#397789] mt-1 truncate">No Telepon: {phone || 'Tidak ada'}</div>
          </div>

        </div>


      </div>

      {/* Right / Details column (view: empty spacer) */}
      <div className="-ml-1 sm:-ml-2 md:-ml-4 lg:-ml-6">
        <div />
      </div>

      {/* Full-width details row */}
      <div className="sm:col-span-2 mt-2 w-full">
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-start justify-between w-full">
            <div>
              <div className="text-[11px] sm:text-xs text-gray-500 mb-1">Nama Lengkap</div>
              <div className="text-base sm:text-lg font-semibold text-gray-900">{cleanedName}</div>
            </div>
            <div className="pl-6 text-left lg:w-[360px] xl:w-[420px]">
              <div className="text-[11px] sm:text-xs text-gray-500 mb-1">NIK</div>
              <div className="text-base sm:text-lg font-semibold text-gray-900">{nik || 'Tidak ada'}</div>
            </div>
          </div>
          <div className="flex items-start justify-between w-full">
            <div>
              <div className="text-[11px] sm:text-xs text-gray-500 mb-1">Tempat Lahir</div>
              <div className="text-base sm:text-lg font-semibold text-gray-900">{birthPlace || 'Tidak ada'}</div>
            </div>
            <div className="pl-6 text-left lg:w-[360px] xl:w-[420px]">
              <div className="text-[11px] sm:text-xs text-gray-500 mb-1">Tanggal Lahir</div>
              <div className="text-base sm:text-lg font-semibold text-gray-900">{birthDate || 'Tidak ada'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrangTuaDetailPage() {
  return (
    <ProtectedRoute>
      <OrangTuaDetailPageContent />
    </ProtectedRoute>
  );
}

