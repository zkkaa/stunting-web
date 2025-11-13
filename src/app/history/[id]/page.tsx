'use client';

import React, { useState, useEffect } from 'react';
import { Layout, ProtectedRoute } from '@/components';
import { FiArrowLeft, FiTrash2, FiSave, FiCheck } from 'react-icons/fi';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { fetchTempAnalysisById, saveToAnalisisNew, deleteTempAnalysis, checkIfSavedToAnalysis } from '@/utils/database-clean';
import { supabase } from '@/lib/supabase';

interface TempAnalysisDetail {
  id: string;
  nama_anak: string;
  nik_anak: string;
  age_years: number;
  age_months: number;
  jenis_kelamin: string;
  tinggi_badan: number;
  berat_badan: number;
  status_gizi: string;
  created_at: string;
  image_url?: string;
}

function HistoryDetailPageContent() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [record, setRecord] = useState<TempAnalysisDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch TempAnalysis data
        const tempData = await fetchTempAnalysisById(id);
        if (!tempData) {
          console.log('TempAnalysis not found');
          return;
        }
        
        // Fetch child data
        const { data: child, error: childError } = await supabase
          .from('DataAnak')
          .select('*')
          .eq('nik', tempData.nik)
          .single();
        
        if (childError) {
          console.error('Error fetching child data:', childError);
        }
        
        // Transform data
        const transformedRecord: TempAnalysisDetail = {
          id: tempData.id!,
          nama_anak: child?.nama || 'Unknown',
          nik_anak: tempData.nik,
          age_years: child?.umur_tahun || 0,
          age_months: child?.umur_bulan || 0,
          jenis_kelamin: child?.gender || 'male',
          tinggi_badan: tempData.tinggi,
          berat_badan: tempData.berat,
          status_gizi: tempData.status,
          created_at: tempData.created_at!, // Gunakan created_at saja
          image_url: tempData.image || undefined
        };
        
        setRecord(transformedRecord);
        
        // Check if already saved to Analisis
        const savedStatus = await checkIfSavedToAnalysis(id);
        setIsSaved(savedStatus);
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);
  
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#397789] mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!record) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Data tidak ditemukan</h1>
            <button
              onClick={() => router.push('/history')}
              className="text-[#407A81] hover:underline cursor-pointer"
            >
              Kembali ke Riwayat
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleBack = () => {
    router.push('/history');
  };

  const handleSave = async () => {
    if (!record || isSaved || saving) return;
    
    try {
      setSaving(true);
      
      // Prepare data for Analisis table tanpa tanggal_pemeriksaan
      const analysisData = {
        nik: record.nik_anak,
        tinggi: record.tinggi_badan,
        berat: record.berat_badan,
        status: record.status_gizi as 'severely stunted' | 'stunted' | 'tall' | 'normal',
        image: record.image_url || null
      };
      
      console.log('💾 Saving to Analisis (no tanggal_pemeriksaan):', analysisData);
      
      // Save to Analisis
      await saveToAnalisisNew(analysisData);
      
      // Update saved status
      setIsSaved(true);
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Error saving to Analisis:', error);
      // Gunakan modal error alih-alih alert
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!record || deleting) return;
    
    try {
      setDeleting(true);
      
      // Delete TempAnalysis
      await deleteTempAnalysis(record.id);
      
      // Redirect back to history
      router.push('/history');
      
    } catch (error) {
      console.error('Error deleting TempAnalysis:', error);
      alert('Gagal menghapus data');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleDetailLengkap = () => {
    setShowDetailModal(true);
  };

  // Helper function untuk format umur
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

  // Helper function untuk translate status
  const translateStatus = (status: string): string => {
    switch (status) {
      case 'normal':
        return 'Pertumbuhan Anak Sehat';
      case 'tall':
        return 'Pertumbuhan Anak Tinggi';
      case 'stunted':
        return 'Pertumbuhan Anak Stunting';
      case 'severely stunted':
        return 'Pertumbuhan Anak Stunting Parah';
      default:
        return 'Status Tidak Diketahui';
    }
  };

  // Helper function untuk status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'normal':
        return 'bg-green-500';
      case 'tall':
        return 'bg-blue-500';
      case 'stunted':
        return 'bg-yellow-500';
      case 'severely stunted':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6 lg:py-8">
          {/* Back Button */}
          <div className="mb-4 sm:mb-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
            >
              <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium text-sm sm:text-base">Riwayat Anak</span>
            </button>
          </div>

          {/* Content Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Title inside card */}
            <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-2 sm:pb-4 mb-4 sm:mb-6 lg:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-center text-gray-900">
                Hasil Analisis
              </h1>
            </div>
            <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
              {/* Photo and Child Info Section */}
              <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
                {/* Photo */}
                <div className="flex justify-center">
                  <div className="relative w-full max-w-sm sm:max-w-md">
                    <div className="relative w-full h-64 sm:h-80 lg:h-96 rounded-xl overflow-hidden shadow-lg">
                      {/* Captured image */}
                      <Image
                        src={record.image_url || "/image/icon/pengukuran-anak.jpg"}
                        alt="Hasil pengukuran"
                        fill
                        className="object-cover"
                      />
                      {/* Measurement lines overlay */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6">
                          <div className="flex justify-center">
                            {Array.from({ length: 15 }).map((_, i) => (
                              <div
                                key={i}
                                className="w-0.5 bg-blue-400 mx-0.5"
                                style={{ height: i % 4 === 0 ? '16px' : '10px' }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Child Info */}
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center lg:text-left">
                      {record.nama_anak}
                    </h2>
                    
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <span className="text-gray-400 font-medium text-xs sm:text-sm mb-2 block">NIK Anak</span>
                        <div className="bg-[#F1F8F9] rounded-lg px-3 sm:px-4 py-2 sm:py-3">
                          <span className="font-semibold text-gray-900 text-xs sm:text-sm">{record.nik_anak}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <span className="text-gray-400 font-medium text-xs sm:text-sm mb-2 block">Usia Bayi saat ini</span>
                          <div className="bg-[#F1F8F9] rounded-lg px-3 sm:px-4 py-2 sm:py-3">
                            <span className="font-semibold text-gray-900 text-xs sm:text-sm">{formatAge(record.age_years, record.age_months)}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400 font-medium text-xs sm:text-sm mb-2 block">Jenis Kelamin</span>
                          <div className="bg-[#F1F8F9] rounded-lg px-3 sm:px-4 py-2 sm:py-3">
                            <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                              {record.jenis_kelamin === 'male' ? 'Laki-laki' : 'Perempuan'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-400 font-medium text-xs sm:text-sm mb-2 block">Waktu Pemeriksaan</span>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                          <div className="bg-[#F1F8F9] rounded-lg px-3 sm:px-4 py-2 sm:py-3 flex-1">
                            <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                              {new Date(record.created_at).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="bg-[#9ECAD6] text-white rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-center min-w-[100px] sm:min-w-[120px]">
                            <span className="font-medium text-xs sm:text-sm">
                              {new Date(record.created_at).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'Asia/Jakarta'
                              })} WIB
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Section */}
              <div className="border-t border-gray-200 pt-6 sm:pt-8">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 text-center mb-4 sm:mb-6">
                  Hasil Utama
                </h3>

                {/* Measurement Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  {/* Height Card */}
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 sm:p-6 border border-cyan-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Tinggi Badan</p>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#407A81]">{record.tinggi_badan} cm</p>
                      </div>
                      <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center p-2 sm:p-3">
                        <Image
                          src="/image/icon/tinggi-badan.svg"
                          alt="Height icon"
                          width={40}
                          height={40}
                          className="sm:w-[50px] sm:h-[50px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Weight Card */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Berat Badan</p>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#407A81]">{record.berat_badan} kg</p>
                      </div>
                      <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center p-2 sm:p-3">
                        <Image
                          src="/image/icon/berat-badan.svg"
                          alt="Weight icon"
                          width={40}
                          height={40}
                          className="sm:w-[50px] sm:h-[50px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Section */}
                <div className="text-center mb-6 sm:mb-8">
                  <p className="text-xs sm:text-sm text-gray-600 font-medium mb-4 sm:mb-6">Status Gizi Anak</p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-4 sm:mb-6">
                    <div className="w-full sm:flex-1 sm:max-w-lg">
                      <div className={`text-white rounded-full py-3 sm:py-4 px-4 sm:px-8 shadow-lg ${getStatusColor(record.status_gizi)}`}>
                        <span className="font-semibold text-sm sm:text-lg">
                          {translateStatus(record.status_gizi)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Save/Already Saved Button */}
                    {!isSaved ? (
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-[#407A81] text-white rounded-full px-6 sm:px-8 py-3 sm:py-4 hover:bg-[#326269] transition-colors flex items-center gap-2 sm:gap-3 shadow-lg cursor-pointer disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span className="font-medium text-sm sm:text-base">Menyimpan...</span>
                          </>
                        ) : (
                          <>
                            <FiSave className="w-4 h-4" />
                            <span className="font-medium text-sm sm:text-base">Simpan ke Analisis</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="bg-green-500 text-white rounded-full px-6 sm:px-8 py-3 sm:py-4 flex items-center gap-2 sm:gap-3 shadow-lg">
                        <FiCheck className="w-4 h-4" />
                        <span className="font-medium text-sm sm:text-base">Sudah Disimpan</span>
                      </div>
                    )}
                    
                    <button
                      onClick={handleDetailLengkap}
                      className="bg-[#407A81] text-white rounded-full px-6 sm:px-8 py-3 sm:py-4 hover:bg-[#326269] transition-colors flex items-center gap-2 sm:gap-3 shadow-lg cursor-pointer"
                    >
                      <span className="font-medium text-sm sm:text-base">Detail Lengkap</span>
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-white rounded-full flex items-center justify-center">
                        <FiArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 text-[#407A81] rotate-180" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mt-6 sm:mt-8 lg:mt-10">
            <button
              onClick={handleBack}
              className="w-full sm:w-auto bg-[#407A81] text-white py-3 sm:py-4 px-6 sm:px-8 rounded-xl hover:bg-[#326269] transition-colors font-semibold text-base sm:text-lg shadow-lg cursor-pointer"
            >
              Kembali
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={deleting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 sm:gap-3 bg-white border-2 border-red-500 text-red-500 py-3 sm:py-4 px-6 sm:px-8 rounded-xl hover:bg-red-50 transition-colors font-semibold text-base sm:text-lg shadow-lg cursor-pointer disabled:opacity-50"
            >
              <FiTrash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{deleting ? 'Menghapus...' : 'Hapus Pemindaian'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheck className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Data Berhasil Disimpan!</h3>
              <p className="text-gray-600 mb-6">
                Data analisis telah berhasil disimpan ke database utama.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition-colors font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowErrorModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTrash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Gagal Menyimpan</h3>
              <p className="text-gray-600 mb-6">
                Terjadi kesalahan saat menyimpan data. Mungkin data dengan NIK dan tanggal yang sama sudah ada.
              </p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 transition-colors font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTrash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Hapus Pemindaian?</h3>
              <p className="text-gray-600 mb-6">
                Data pemindaian ini akan dihapus secara permanen dan tidak dapat dikembalikan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors font-semibold disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    'Hapus'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-8">
            <h3 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">Hasil Pemindaian</h3>

            {/* Image */}
            <div className="relative w-full h-48 sm:h-64 md:h-72 lg:h-80 rounded-xl overflow-hidden shadow-md mb-4 sm:mb-6">
              <Image
                src={record.image_url || "/image/icon/pengukuran-anak.jpg"}
                alt="Hasil pengukuran"
                fill
                className="object-cover"
              />
            </div>

            {/* Measurement cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="bg-[#E9F6F7] rounded-xl p-4 sm:p-6 border border-cyan-200">
                <p className="text-sm sm:text-base text-gray-600 mb-2 sm:mb-3 text-center font-medium">Tinggi Badan</p>
                <div className="flex items-center justify-between">
                  <div className="w-16 sm:w-20 md:w-28"></div>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#407A81] -mt-1">{record.tinggi_badan} cm</p>
                  <Image src="/image/icon/tinggi-badan.svg" alt="Tinggi" width={112} height={112} className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28" />
                </div>
              </div>
              <div className="bg-[#E9F6F7] rounded-xl p-4 sm:p-6 border border-cyan-200">
                <p className="text-sm sm:text-base text-gray-600 mb-2 sm:mb-3 text-center font-medium">Berat Badan</p>
                <div className="flex items-center justify-between">
                  <Image src="/image/icon/berat-badan.svg" alt="Berat" width={112} height={112} className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28" />
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#407A81] -mt-1">{record.berat_badan} kg</p>
                  <div className="w-16 sm:w-20 md:w-28"></div>
                </div>
              </div>
            </div>

            {/* Close button */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full sm:w-1/2 md:w-1/2 bg-[#407A81] text-white py-3 rounded-full hover:bg-[#326269] transition-colors cursor-pointer text-sm sm:text-base"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default function HistoryDetailPage() {
  return (
    <ProtectedRoute>
      <HistoryDetailPageContent />
    </ProtectedRoute>
  );
}
