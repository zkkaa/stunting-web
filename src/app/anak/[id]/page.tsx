'use client';

import React, { useState, useEffect } from 'react';
import { Layout, ProtectedRoute } from '@/components';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { FiArrowLeft, FiMoreVertical, FiEdit2, FiTrash2, FiClock, FiArrowRightCircle } from 'react-icons/fi';
import { fetchChildDetailWithParents, ChildData, AddressData, AnalysisData } from '@/utils/database-clean';

// Function to translate status to Indonesian (same as in database-clean.ts)
const translateStatus = (status: string): string => {
  switch (status) {
    case 'normal':
      return 'Normal';
    case 'tall':
      return 'Tinggi';
    case 'stunted':
      return 'Stunting';
    case 'severely stunted':
      return 'Stunting Parah';
    default:
      return status;
  }
};

// Function to get status colors (same as in database-clean.ts)
const getStatusColors = (status: string) => {
  switch (status) {
    case 'normal':
      return { bg: 'bg-[#E8F5E9]', text: 'text-[#4CAF50]', bgHex: '#E8F5E9', textHex: '#4CAF50' };
    case 'tall':
      return { bg: 'bg-[#E3F2FD]', text: 'text-[#2196F3]', bgHex: '#E3F2FD', textHex: '#2196F3' };
    case 'stunted':
      return { bg: 'bg-[#FFF9E6]', text: 'text-[#FFA726]', bgHex: '#FFF9E6', textHex: '#FFA726' };
    case 'severely stunted':
      return { bg: 'bg-[#FFEBEE]', text: 'text-[#EF5350]', bgHex: '#FFEBEE', textHex: '#EF5350' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-600', bgHex: '#F3F4F6', textHex: '#4B5563' };
  }
};

// Interfaces
interface ChildDetailData {
  id: string;
  name: string;
  photo: string | null;
  gender: string;
  age: number;
  ageMonths?: number;
  nomorKK: string;
  nikAnak: string;
  tanggalLahir: string;
  tempatLahir: string;
  beratBadanLahir: string;
  tinggiBadanLahir: string;
  lingkarKepalaLahir: string;
  namaAyah: string;
  nikAyah: string;
  tempatLahirAyah: string;
  tanggalLahirAyah: string;
  nomorTeleponAyah: string;
  namaIbu: string;
  nikIbu: string;
  tempatLahirIbu: string;
  tanggalLahirIbu: string;
  nomorTeleponIbu: string;
  provinsi: string;
  kota: string;
  kecamatan: string;
  desa: string;
  jalan: string;
  kodePos: string;
}

interface ScanHistoryRecord {
  id: string;
  childId: string;
  age: number;
  height: number;
  weight: number;
  status: 'normal' | 'tall' | 'stunted' | 'severely stunted';
  date: string;
  timeAgo: string;
}


function ProfileAnakPageContent() {
  const router = useRouter();
  const params = useParams();
  const childId = params?.id as string;
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [child, setChild] = useState<ChildDetailData | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChildDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await fetchChildDetailWithParents(childId);
        
        if (data && data.child) {
          // Convert database data to component interface
          const dataWithAddress = data as { 
            child: ChildData | null; 
            father: {
              nama?: string;
              tempat_lahir?: string;
              tanggal_lahir?: string;
              no_hp?: string;
              nik?: string;
            } | null; 
            mother: {
              nama?: string;
              tempat_lahir?: string;
              tanggal_lahir?: string;
              no_hp?: string;
              nik?: string;
            } | null; 
            address: AddressData | null;
            analysisHistory: AnalysisData[]
          };
          const childDetailData: ChildDetailData = {
            id: dataWithAddress.child!.nik,
            name: dataWithAddress.child!.nama,
            photo: dataWithAddress.child!.image_anak,
            gender: dataWithAddress.child!.gender,
            age: dataWithAddress.child!.umur_tahun || 0, // Use umur_tahun for primary age
            ageMonths: dataWithAddress.child!.umur_bulan || 0, // Add umur_bulan for additional detail
            nomorKK: dataWithAddress.child!.no_kk,
            nikAnak: dataWithAddress.child!.nik,
            tanggalLahir: dataWithAddress.child!.tanggal_lahir || '',
            tempatLahir: dataWithAddress.child!.tempat_lahir || '',
            beratBadanLahir: dataWithAddress.child!.bb_lahir?.toString() || '',
            tinggiBadanLahir: dataWithAddress.child!.tb_lahir?.toString() || '',
            lingkarKepalaLahir: dataWithAddress.child!.lk_lahir?.toString() || '',
            namaAyah: dataWithAddress.father?.nama || '',
            nikAyah: dataWithAddress.father?.nik || '',
            tempatLahirAyah: dataWithAddress.father?.tempat_lahir || '',
            tanggalLahirAyah: dataWithAddress.father?.tanggal_lahir || '',
            nomorTeleponAyah: dataWithAddress.father?.no_hp || '',
            namaIbu: dataWithAddress.mother?.nama || '',
            nikIbu: dataWithAddress.mother?.nik || '',
            tempatLahirIbu: dataWithAddress.mother?.tempat_lahir || '',
            tanggalLahirIbu: dataWithAddress.mother?.tanggal_lahir || '',
            nomorTeleponIbu: dataWithAddress.mother?.no_hp || '',
            provinsi: dataWithAddress.address?.provinsi || '',
            kota: dataWithAddress.address?.kota || '',
            kecamatan: dataWithAddress.address?.kecamatan || '',
            desa: dataWithAddress.address?.desa || '',
            jalan: dataWithAddress.address?.jalan || '',
            kodePos: dataWithAddress.address?.kode_pos || ''
          };
          
          // Convert analysis data to scan history
          const scanHistoryData: ScanHistoryRecord[] = dataWithAddress.analysisHistory.map((analysis) => {
            const analysisDate = new Date(analysis.created_at);
            
            // Format date and time: DD/MM/YYYY HH:mm
            const timeAgo = analysisDate.toLocaleString('id-ID', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });

            return {
              id: analysis.id,
              childId: analysis.nik,
              age: dataWithAddress.child!.umur_tahun || 0,
              height: analysis.tinggi,
              weight: analysis.berat,
              status: analysis.status as 'normal' | 'tall' | 'stunted' | 'severely stunted',
              date: analysis.created_at,
              timeAgo: timeAgo
            };
          });
          
          setChild(childDetailData);
          setScanHistory(scanHistoryData);
        } else {
          setError('Data anak tidak ditemukan');
        }
      } catch (err) {
        console.error('Error fetching child detail:', err);
        setError('Gagal memuat data anak');
      } finally {
        setLoading(false);
      }
    };

    fetchChildDetail();
  }, [childId]);
  
  const [form, setForm] = useState<ChildDetailData>(child || {
    id: '',
    name: '',
    photo: null,
    gender: '',
    age: 0,
    ageMonths: 0,
    nomorKK: '',
    nikAnak: '',
    tanggalLahir: '',
    tempatLahir: '',
    beratBadanLahir: '',
    tinggiBadanLahir: '',
    lingkarKepalaLahir: '',
    namaAyah: '',
    nikAyah: '',
    tempatLahirAyah: '',
    tanggalLahirAyah: '',
    nomorTeleponAyah: '',
    namaIbu: '',
    nikIbu: '',
    tempatLahirIbu: '',
    tanggalLahirIbu: '',
    nomorTeleponIbu: '',
    provinsi: '',
    kota: '',
    kecamatan: '',
    desa: '',
    jalan: '',
    kodePos: ''
  });

  // Update form when child data is loaded
  useEffect(() => {
    if (child) {
      setForm(child);
    }
  }, [child]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleBack = () => {
    router.push('/anak');
  };

  const handleEdit = () => {
    setShowDropdown(false);
    // Navigate to edit page using child's NIK
    router.push(`/anak/edit/${child?.nikAnak}`);
  };

  const handleDelete = () => {
    setShowDropdown(false);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    console.log('Deleting child:', childId);
    // Implement delete logic here
    setShowDeleteModal(false);
    router.push('/anak');
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleViewScanDetail = (scanId: string) => {
    router.push(`/anak/${childId}/hasil/${scanId}`);
  };

  // Show loading state
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data anak...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show error state
  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Terjadi Kesalahan</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Show not found state
  if (!child) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Data Tidak Ditemukan</h2>
            <p className="text-gray-600">Data anak dengan ID tersebut tidak ditemukan.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen relative overflow-x-hidden bg-gray-50">
        {/* Background Gradient Top */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-60 z-10"
          style={{
            background: `radial-gradient(ellipse at center top, rgba(158, 202, 214, 0.6) 0%, rgba(158, 202, 214, 0.3) 30%, rgba(158, 202, 214, 0.1) 50%, transparent 70%)`
          }}
        />

        {/* Content */}
        <div className="relative z-20 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Header with Back Button */}
            <div className="flex items-center gap-3 mb-8">
              <button
                onClick={handleBack}
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                <FiArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Anak</h1>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Header dengan Title dan More Options */}
              <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Profile Anak</h2>
                
                {/* More Options Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                  >
                    <FiMoreVertical size={20} />
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                      <button
                        onClick={handleEdit}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <FiEdit2 size={14} />
                        Edit
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                      >
                        <FiTrash2 size={14} />
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Content */}
              <div className="px-5 sm:px-8 pb-6 sm:pb-8">
                {/* Photo and Name */}
                <div className="flex flex-col items-center mb-8 sm:mb-10 mt-6">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center mb-3 sm:mb-4 overflow-hidden bg-[#E5F3F5] text-[#397789]">
                    {form.photo ? (
                      <img src={form.photo} alt={form.name} className="w-full h-full object-cover" />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-4.418 0-8 3.582-8 8h16c0-4.418-3.582-8-8-8Z" fill="#397789"/>
                      </svg>
                    )}
                  </div>
                  {isEditing && (
                    <div className="mb-2">
                      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer text-sm">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = URL.createObjectURL(file);
                              setForm((prev) => ({ ...prev, photo: url }));
                            }
                          }}
                        />
                        <span>Ganti Foto</span>
                      </label>
                    </div>
                  )}
                  {isEditing ? (
                    <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-xs text-gray-500 mb-1 block">Nama Anak</label>
                        <input defaultValue={child.name} className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#9ECAD6] focus:border-transparent text-sm sm:text-base" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Jenis Kelamin</label>
                        <select defaultValue={child.gender} className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#9ECAD6] focus:border-transparent text-sm sm:text-base">
                          <option>Laki Laki</option>
                          <option>Perempuan</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Umur (tahun)</label>
                        <input type="number" defaultValue={child.age} className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#9ECAD6] focus:border-transparent text-sm sm:text-base" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Umur (bulan)</label>
                        <input type="number" defaultValue={child.ageMonths || 0} className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#9ECAD6] focus:border-transparent text-sm sm:text-base" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 sm:mb-2 text-center">{form.name}</h3>
                      <p className="text-base sm:text-lg text-gray-600">{form.gender}</p>
                      <p className="text-base sm:text-lg text-gray-600 font-semibold">Nomor KK: {child.nomorKK}</p>
                    </>
                  )}
                </div>

                {/* Information Sections */}
                <div className="space-y-8 sm:space-y-10">
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-5">Data Anak</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                      <div>
                        <label className="text-sm sm:text-base text-gray-500 font-medium block mb-1.5 sm:mb-2">NIK Anak</label>
                        <p className="text-base sm:text-lg text-gray-900">{child.nikAnak}</p>
                      </div>
                      <div>
                        <label className="text-sm sm:text-base text-gray-500 font-medium block mb-1.5 sm:mb-2">Tanggal Lahir</label>
                        <p className="text-base sm:text-lg text-gray-900">{child.tanggalLahir}</p>
                      </div>
                      <div>
                        <label className="text-sm sm:text-base text-gray-500 font-medium block mb-1.5 sm:mb-2">Tanggal Lahir</label>
                        <p className="text-base sm:text-lg text-gray-900">{child.tanggalLahir}</p>
                      </div>
                      <div className="">
                        <label className="text-sm sm:text-base text-gray-500 font-medium block mb-1.5 sm:mb-2">Tempat Lahir</label>
                        <p className="text-base sm:text-lg text-gray-900">{child.tempatLahir}</p>
                      </div>
                      <div>
                        <label className="text-sm sm:text-base text-gray-500 font-medium block mb-1.5 sm:mb-2">Usia Anak</label>
                        <p className="text-base sm:text-lg text-gray-900">
                          {child.age > 0 ? `${child.age} Tahun` : ''}
                          {child.age > 0 && child.ageMonths && child.ageMonths > 0 ? ' ' : ''}
                          {child.ageMonths && child.ageMonths > 0 ? `${child.ageMonths} Bulan` : ''}
                          {child.age === 0 && (!child.ageMonths || child.ageMonths === 0) ? 'Baru lahir' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Data Tambahan saat Lahir */}
                  <div className="pt-6 sm:pt-8 border-t border-gray-200">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-5">Data Tambahan saat Lahir</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                      <div>
                        <label className="text-sm sm:text-base text-gray-500 font-medium block mb-1.5 sm:mb-2">Berat Badan Lahir</label>
                        {isEditing ? (
                          <input value={form.beratBadanLahir} onChange={(e) => setForm((p) => ({ ...p, beratBadanLahir: e.target.value }))} className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#9ECAD6] focus:border-transparent text-sm sm:text-base" />
                        ) : (
                          <p className="text-base sm:text-lg text-gray-900">{form.beratBadanLahir}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm sm:text-base text-gray-500 font-medium block mb-1.5 sm:mb-2">Tinggi Badan Lahir</label>
                        {isEditing ? (
                          <input value={form.tinggiBadanLahir} onChange={(e) => setForm((p) => ({ ...p, tinggiBadanLahir: e.target.value }))} className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#9ECAD6] focus:border-transparent text-sm sm:text-base" />
                        ) : (
                          <p className="text-base sm:text-lg text-gray-900">{form.tinggiBadanLahir}</p>
                        )}
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <label className="text-sm sm:text-base text-gray-500 font-medium block mb-1.5 sm:mb-2">Lingkar Kepala Lahir</label>
                        {isEditing ? (
                          <input value={form.lingkarKepalaLahir} onChange={(e) => setForm((p) => ({ ...p, lingkarKepalaLahir: e.target.value }))} className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#9ECAD6] focus:border-transparent text-sm sm:text-base" />
                        ) : (
                          <p className="text-base sm:text-lg text-gray-900">{form.lingkarKepalaLahir}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Identitas Ayah */}
                  <div className="pt-6 sm:pt-8 border-t border-gray-200">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-5">Identitas Ayah</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                      <div>
                        <label className="text-sm sm:text-base text-gray-500 font-medium block mb-1.5 sm:mb-2">Nama Ayah</label>
                        <p className="text-base sm:text-lg text-gray-900">{child.namaAyah}</p>
                      </div>
                      <div>
                        <label className="text-sm sm:text-base text-gray-500 font-medium block mb-1.5 sm:mb-2">NIK Ayah</label>
                        <p className="text-base sm:text-lg text-gray-900">{child.nikAyah}</p>
                      </div>
                      <div>
                        <label className="text-sm sm:text-base text-gray-500 font-medium block mb-1.5 sm:mb-2">Tempat Lahir</label>
                        <p className="text-base sm:text-lg text-gray-900">{child.tempatLahirAyah}</p>
                      </div>
                      <div>
                        <label className="text-sm sm:text-base text-gray-500 font-medium block mb-1.5 sm:mb-2">Tanggal Lahir</label>
                        <p className="text-base sm:text-lg text-gray-900">{child.tanggalLahirAyah}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm sm:text-base text-gray-500 font-medium block mb-1.5 sm:mb-2">Nomor Telepon Ayah</label>
                        <p className="text-base sm:text-lg text-gray-900">{child.nomorTeleponAyah}</p>
                      </div>
                    </div>
                  </div>

                  {/* Identitas Ibu */}
                  <div className="pt-6 sm:pt-8 border-t border-gray-200">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-5">Identitas Ibu</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                      <div>
                        <label className="text-sm sm:text-base text-gray-500 font-medium block mb-1.5 sm:mb-2">Nama Ibu</label>
                        <p className="text-base sm:text-lg text-gray-900">{child.namaIbu}</p>
                      </div>
                      <div>
                        <label className="text-sm sm:text-base text-gray-500 font-medium block mb-1.5 sm:mb-2">NIK Ibu</label>
                        <p className="text-base sm:text-lg text-gray-900">{child.nikIbu}</p>
                      </div>
                      <div>
                        <label className="text-sm sm:text-base text-gray-500 font-medium block mb-1.5 sm:mb-2">Tempat Lahir</label>
                        <p className="text-base sm:text-lg text-gray-900">{child.tempatLahirIbu}</p>
                      </div>
                      <div>
                        <label className="text-sm sm:text-base text-gray-500 font-medium block mb-1.5 sm:mb-2">Tanggal Lahir</label>
                        <p className="text-base sm:text-lg text-gray-900">{child.tanggalLahirIbu}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm sm:text-base text-gray-500 font-medium block mb-1.5 sm:mb-2">Nomor Telepon Ibu</label>
                        <p className="text-base sm:text-lg text-gray-900">{child.nomorTeleponIbu}</p>
                      </div>
                    </div>
                  </div>

                  {/* Informasi Alamat */}
                  <div className="pt-6 sm:pt-8 border-t border-gray-200">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-5">Informasi Alamat</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                      <div>
                        <label className="text-sm sm:text-base text-gray-500 font-medium block mb-1.5 sm:mb-2">Provinsi</label>
                        <p className="text-base sm:text-lg text-gray-900">{child.provinsi || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm sm:text-base text-gray-500 font-medium block mb-1.5 sm:mb-2">Kota</label>
                        <p className="text-base sm:text-lg text-gray-900">{child.kota || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm sm:text-base text-gray-500 font-medium block mb-1.5 sm:mb-2">Kecamatan</label>
                        <p className="text-base sm:text-lg text-gray-900">{child.kecamatan || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm sm:text-base text-gray-500 font-medium block mb-1.5 sm:mb-2">Desa</label>
                        <p className="text-base sm:text-lg text-gray-900">{child.desa || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm sm:text-base text-gray-500 font-medium block mb-1.5 sm:mb-2">Jalan</label>
                        <p className="text-base sm:text-lg text-gray-900">{child.jalan || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm sm:text-base text-gray-500 font-medium block mb-1.5 sm:mb-2">Kode Pos</label>
                        <p className="text-base sm:text-lg text-gray-900">{child.kodePos || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                {isEditing && (
                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Batal</button>
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-md bg-[#407A81] text-white hover:bg-[#326269]">Simpan</button>
                  </div>
                )}
              </div>
            </div>

            {/* Riwayat Pemindaian Anak */}
            <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Riwayat Pemindaian Anak</h2>
              </div>

              {/* History List */}
              <div className="px-6 py-6">
                {scanHistory.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {scanHistory.map((row) => (
                      <div key={row.id} className="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border-b border-gray-100 last:border-b-0">
                        {/* Mobile Layout */}
                        <div className="flex items-center gap-3 sm:hidden">
                          {/* avatar */}
                          <div className="w-10 h-10 rounded-full bg-[#E5F3F5] flex items-center justify-center text-[#397789] shrink-0">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-4.418 0-8 3.582-8 8h16c0-4.418-3.582-8-8-8Z" fill="#397789"/>
                            </svg>
                          </div>
                          {/* name & meta */}
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-900 text-sm mb-1">{child.name}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                              
                              <span className="inline-flex items-center gap-1">
                                <FiClock size={12} />
                                {row.timeAgo}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Desktop Layout (single row) */}
                        <div className="hidden sm:flex sm:items-center sm:flex-wrap lg:flex-nowrap gap-4 md:gap-6 w-full">
                        {/* avatar */}
                          <div className="w-12 h-12 rounded-full bg-[#E5F3F5] flex items-center justify-center text-[#397789] shrink-0">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-4.418 0-8 3.582-8 8h16c0-4.418-3.582-8-8-8Z" fill="#397789"/>
                          </svg>
                        </div>
                        {/* name & meta */}
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-900 text-base mb-1">{child.name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-3">
                              
                              <span className="inline-flex items-center gap-1">
                              <FiClock size={14} />
                                {row.timeAgo}
                            </span>
                          </div>
                        </div>
                        {/* height pill */}
                          <div 
                            className="flex items-center justify-center gap-2.5"
                            style={{ width: '140px', height: '56px', borderRadius: '16px', border: '1px solid rgba(57, 119, 137, 1)', backgroundColor: 'rgba(239, 255, 254, 1)' }}
                          >
                            <Image src="/image/icon/tinggi-badan.svg" alt="tinggi" width={31} height={38} style={{ width: '31px', height: '38px' }} />
                            <span className="text-base font-semibold text-[#397789]">{row.height} cm</span>
                        </div>
                        {/* weight pill */}
                          <div 
                            className="flex items-center justify-center gap-2.5"
                            style={{ width: '140px', height: '56px', borderRadius: '16px', border: '1px solid rgba(57, 119, 137, 1)', backgroundColor: 'rgba(239, 255, 254, 1)' }}
                          >
                            <Image src="/image/icon/berat-badan.svg" alt="berat" width={20} height={38} style={{ width: '20px', height: '38px' }} />
                            <span className="text-base font-semibold text-[#397789]">{row.weight} Kg</span>
                        </div>
                        {/* status */}
                          <div className="shrink-0" style={{ width: '120px' }}>
                            <span className={`inline-flex items-center justify-center w-full px-4 py-2 rounded-full text-sm font-medium ${getStatusColors(row.status).bg} ${getStatusColors(row.status).text}`}>
                              {translateStatus(row.status)}
                            </span>
                        </div>
                          {/* action button */}
                          <button onClick={() => handleViewScanDetail(row.id)} className="shrink-0 w-10 h-10 rounded-full border-2 border-[#397789] flex items-center justify-center text-[#397789] hover:bg-[#397789] hover:text-white transition-colors cursor-pointer">
                          <FiArrowRightCircle size={20} />
                        </button>
                        </div>

                        {/* Mobile: Measurement pills and status */}
                        <div className="sm:hidden flex flex-wrap items-center justify-center gap-2">
                        {/* height pill */}
                          <div 
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#397789] bg-[#EFFFFE]"
                            style={{ minWidth: '80px' }}
                          >
                            <Image src="/image/icon/tinggi-badan.svg" alt="tinggi" width={16} height={20} />
                            <span className="text-xs font-semibold text-[#397789]">{row.height} cm</span>
                          </div>
                          {/* weight pill */}
                          <div 
                            className="hidden"
                            style={{ minWidth: '80px' }}
                          >
                            <Image src="/image/icon/berat-badan.svg" alt="berat" width={12} height={20} />
                            <span className="text-xs font-semibold text-[#397789]">{row.weight} Kg</span>
                          </div>
                          {/* status */}
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColors(row.status).bg} ${getStatusColors(row.status).text}`}>
                              {translateStatus(row.status)}
                            </span>
                            {/* action button */}
                            <button onClick={() => handleViewScanDetail(row.id)} className="w-8 h-8 rounded-full border-2 border-[#397789] flex items-center justify-center text-[#397789] hover:bg-[#397789] hover:text-white transition-colors cursor-pointer">
                              <FiArrowRightCircle size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Desktop block merged above */}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-gray-500 text-sm">Belum ada riwayat pemindaian</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-center text-gray-900 mb-4">
                {child.name}
              </h2>
              <p className="text-center text-gray-600 mb-6">
                Apakah anda yakin ingin menghapusnya?
              </p>
              
              <div className="space-y-3">
                {/* Delete Button */}
                <button
                  onClick={confirmDelete}
                  className="w-full bg-[#407A81] text-white py-3 px-6 rounded-lg hover:bg-[#326269] transition-colors font-medium"
                >
                  Hapus
                </button>
                
                {/* Cancel Button */}
                <button
                  onClick={cancelDelete}
                  className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Batalkan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default function ProfileAnakPage() {
  return (
    <ProtectedRoute>
      <ProfileAnakPageContent />
    </ProtectedRoute>
  );
}
