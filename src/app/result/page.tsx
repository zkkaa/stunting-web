'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Layout, ProtectedRoute } from '@/components';
import { FiArrowLeft, FiTrash2, FiCheck } from 'react-icons/fi';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { fetchChildByNik, translateStatus, getStatusColors, insertTempAnalisis, saveToAnalisisNew } from '@/utils/database-clean';
import { getTempImageUrl } from '@/utils/storage';

// Helper function to parse timestamp from structured image path
const parseImageTimestamp = (imagePath: string): Date => {
  try {
    // Expected format: childNik/2025-10-22T14-30-15/capture.jpg
    const parts = imagePath.split('/');
    if (parts.length >= 2) {
      const timestampPart = parts[1];
      // Convert back from our format: 2025-10-22T14-30-15 to ISO format
      const isoTimestamp = timestampPart.replace(/-(\d{2})-(\d{2})$/, ':$1:$2');
      return new Date(isoTimestamp + 'Z'); // Add Z for UTC
    }
  } catch (error) {
    console.warn('Failed to parse timestamp from image path:', imagePath, error);
  }
  return new Date(); // Fallback to current time
};

const copyImageToPemindaian = async (imageUrl: string, nik: string): Promise<string> => {
  try {
    // Create timestamp folder structure
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const newPath = `pemindaian/${nik}/${timestamp}/result.jpg`;
    
    // Call API to copy image
    const response = await fetch('/api/storage/copy-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sourceUrl: imageUrl,
        destinationPath: newPath,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to copy image');
    }
    
    const result = await response.json();
    return result.publicUrl;
  } catch (error) {
    console.error('Error copying image:', error);
    throw error;
  }
};

function ResultPageContent() {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [childData, setChildData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load child data and analysis results from URL params
  useEffect(() => {
    const loadResultData = async () => {
      try {
        setLoading(true);
        
        // Get parameters from URL
        const childId = searchParams?.get('child');
        const cameraType = searchParams?.get('camera');
        const imageId = searchParams?.get('image');
        const timestamp = searchParams?.get('timestamp');
        const imageUrl = searchParams?.get('imageUrl'); // Parameter gambar dari ComViT API
        
        console.log('Result page parameters:', { childId, cameraType, imageId, timestamp, imageUrl });
        
        if (!childId) {
          throw new Error('ID anak tidak ditemukan');
        }

        // Parse the structured image path to get timestamp for display
        const scanDateTime = imageId ? parseImageTimestamp(imageId) : new Date();
        
        // For now, we'll use mock analysis data since the real analysis isn't implemented yet
        // In production, you would fetch this from your analysis API
        const mockAnalysisResults = {
          height: Math.floor(Math.random() * 30) + 60, // 60-90 cm
          weight: (Math.random() * 8 + 8).toFixed(1), // 8-16 kg
          status: ['normal', 'tall', 'stunted', 'severely stunted'][Math.floor(Math.random() * 4)],
          confidence: (Math.random() * 30 + 70).toFixed(1), // 70-100%
          scanDate: scanDateTime.toLocaleDateString('id-ID', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          scanTime: scanDateTime.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'Asia/Jakarta'
          }) + ' WIB',
          imageUrl: imageUrl || (imageId ? getTempImageUrl(imageId) : '/image/icon/pengukuran-anak.jpg') // Prioritas: URL dari ComViT, fallback ke storage, fallback ke default
        };

        console.log('🖼️ Image URL being used:', mockAnalysisResults.imageUrl);
        console.log('🔗 Direct ComViT URL:', imageUrl);
        console.log('📁 Storage URL fallback:', imageId ? getTempImageUrl(imageId) : 'none');

        // Load child data from database
        let child = null;
        try {
          child = await fetchChildByNik(childId);
        } catch (dbError) {
          console.warn('Failed to load from database, using fallback:', dbError);
          
          // Fallback: try to get from session storage or use dummy data
          const storedChildren = sessionStorage.getItem('children');
          if (storedChildren) {
            const children = JSON.parse(storedChildren);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            child = children.find((c: any) => c.id === childId);
          }
        }

        if (!child) {
          // Ultimate fallback with dummy data
          child = {
            nama: 'Anak Test',
            nik: childId,
            gender: 'male',
            umur_tahun: 2,
            umur_bulan: 3,
            tempat_lahir: 'Jakarta',
            tanggal_lahir: '2022-08-15'
          };
        }

        setChildData(child);
        setAnalysisData(mockAnalysisResults);
        
        // Auto-insert ke TempAnalisis saat masuk result page
        try {
          const tempAnalysisData = {
            nik: child.nik,
            tinggi: mockAnalysisResults.height,
            berat: parseFloat(mockAnalysisResults.weight),
            status: mockAnalysisResults.status as 'severely stunted' | 'stunted' | 'tall' | 'normal',
            image: mockAnalysisResults.imageUrl
          };
          
          console.log('📝 Auto-inserting to TempAnalisis (no tanggal_pemeriksaan):', tempAnalysisData);
          await insertTempAnalisis(tempAnalysisData);
          console.log('✅ TempAnalisis inserted successfully');
        } catch (tempError) {
          console.warn('⚠️ Failed to insert TempAnalisis (will continue):', tempError);
          // Don't block the UI if TempAnalisis insert fails
        }
        
      } catch (err) {
        console.error('Error loading result data:', err);
        setError(err instanceof Error ? err.message : 'Gagal memuat data hasil');
      } finally {
        setLoading(false);
      }
    };

    loadResultData();
  }, [searchParams]);

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

  // Helper function to format gender display
  const formatGender = (gender: string): string => {
    if (gender === 'L' || gender === 'male') return 'Laki-laki';
    if (gender === 'P' || gender === 'female') return 'Perempuan';
    return gender;
  };

  const handleBack = () => {
    router.back();
  };

  const handleSave = async () => {
    if (!analysisData || !childData || saving) return;
    
    try {
      setSaving(true);
      console.log('💾 Starting save process...');
      
      // Use imageUrl directly from analysis data (ComViT response)
      let finalImageUrl = analysisData.imageUrl;
      
      console.log('🖼️ Using direct image URL from analysis:', finalImageUrl);
      
      // Option to copy image if needed (currently disabled in favor of direct URL)
      if (false && finalImageUrl && !finalImageUrl.includes('pemindaian/')) {
        console.log('� Copying image to pemindaian bucket...');
        try {
          finalImageUrl = await copyImageToPemindaian(analysisData.imageUrl, childData.nik);
          console.log('✅ Image copied to pemindaian:', finalImageUrl);
        } catch (copyError) {
          console.warn('⚠️ Failed to copy image, using original URL:', copyError);
          // Continue with original URL if copy fails
        }
      }
      
      // Prepare data for Analisis table tanpa tanggal_pemeriksaan
      const analysisResult = {
        nik: childData.nik,
        tinggi: parseFloat(analysisData.height),
        berat: parseFloat(analysisData.weight),
        status: analysisData.status as 'severely stunted' | 'stunted' | 'tall' | 'normal',
        image: finalImageUrl
      };
      
      console.log('📊 Saving to Analisis table (no tanggal_pemeriksaan):', analysisResult);
      
      // Save to Analisis table
      await saveToAnalisisNew(analysisResult);
      
      console.log('✅ Analysis saved successfully to Analisis table');
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('❌ Error saving result:', error);
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    console.log('Deleting result...');
    // TODO: Implement delete functionality
    router.back();
  };

  const handleDetailLengkap = () => {
    setShowDetailModal(true);
  };

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#407A81] mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat hasil analisis...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error || !childData || !analysisData) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
              <h2 className="text-lg font-semibold text-red-800 mb-2">Gagal Memuat Data</h2>
              <p className="text-red-600 mb-4">{error || 'Data tidak ditemukan'}</p>
              <button
                onClick={() => router.back()}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
            >
              <FiArrowLeft className="w-5 h-5" />
              <span className="font-medium">Anak</span>
            </button>
          </div>

          {/* Content Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Title inside card */}
            <div className="px-8 pt-8 pb-4 mb-8">
              <h1 className="text-5xl font-bold text-center text-gray-900">
                Hasil Analisis
              </h1>
            </div>
            <div className="px-8 pb-8">
              {/* Photo and Child Info Section */}
              <div className="grid lg:grid-cols-2 gap-8 mb-8">
                {/* Photo */}
                <div className="flex justify-center">
                  <div className="relative w-full max-w-md">
                    <div className="relative w-full h-96 rounded-xl overflow-hidden shadow-lg">
                      {/* Captured image */}
                      <Image
                        src={analysisData.imageUrl}
                        alt="Hasil pengukuran"
                        fill
                        className="object-cover"
                        onError={(e) => {
                          // Fallback to default image if captured image fails to load
                          e.currentTarget.src = '/image/icon/pengukuran-anak.jpg';
                        }}
                      />
                      {/* Measurement lines overlay */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-6 left-6 right-6">
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
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      {childData.nama}
                    </h2>
                    
                    <div className="space-y-4">
                      <div>
                        <span className="text-gray-400 font-medium text-sm mb-2 block">NIK Anak</span>
                        <div className="bg-[#F1F8F9] rounded-lg px-4 py-3">
                          <span className="font-semibold text-gray-900 text-sm">{childData.nik}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-400 font-medium text-sm mb-2 block">Usia Bayi saat ini</span>
                          <div className="bg-[#F1F8F9] rounded-lg px-4 py-3">
                            <span className="font-semibold text-gray-900 text-sm">
                              {formatAge(childData.umur_tahun || 0, childData.umur_bulan || 0)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400 font-medium text-sm mb-2 block">Jenis Kelamin</span>
                          <div className="bg-[#F1F8F9] rounded-lg px-4 py-3">
                            <span className="font-semibold text-gray-900 text-sm">
                              {formatGender(childData.gender)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-400 font-medium text-sm mb-2 block">Waktu Pemeriksaan</span>
                        <div className="flex items-center gap-3">
                          <div className="bg-[#F1F8F9] rounded-lg px-4 py-3 flex-1">
                            <span className="font-semibold text-gray-900 text-sm">{analysisData.scanDate}</span>
                          </div>
                          <div className="bg-[#9ECAD6] text-white rounded-lg px-4 py-3 text-center min-w-[120px]">
                            <span className="font-medium text-sm">{analysisData.scanTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Section */}
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-6">
                  Hasil Utama
                </h3>

                {/* Measurement Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Height Card */}
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Tinggi Badan</p>
                        <p className="text-4xl font-bold text-[#407A81]">{analysisData.height} cm</p>
                      </div>
                      <div className="w-20 h-20 flex items-center justify-center p-3">
                        <Image
                          src="/image/icon/tinggi-badan.svg"
                          alt="Height icon"
                          width={50}
                          height={50}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Weight Card */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Berat Badan</p>
                        <p className="text-4xl font-bold text-[#407A81]">{analysisData.weight} kg</p>
                      </div>
                      <div className="w-20 h-20 flex items-center justify-center p-3">
                        <Image
                          src="/image/icon/berat-badan.svg"
                          alt="Weight icon"
                          width={50}
                          height={50}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Section */}
                <div className="text-center mb-8">
                  <p className="text-sm text-gray-600 font-medium mb-6">Status Gizi Anak</p>
                  
                  <div className="flex items-center justify-center gap-6 mb-6">
                    <div className="flex-1 max-w-lg">
                      <div 
                        className="text-white rounded-full py-4 px-8 shadow-lg"
                        style={{ 
                          backgroundColor: getStatusColors(analysisData.status).textHex 
                        }}
                      >
                        <span className="font-semibold text-lg">
                          {translateStatus(analysisData.status)}
                        </span>
                      </div>
                      {/* Confidence indicator */}
                      <div className="mt-2 text-xs text-gray-500">
                        Confidence: {analysisData.confidence}%
                      </div>
                    </div>
                    <button
                      onClick={handleDetailLengkap}
                      className="bg-[#407A81] text-white rounded-full px-8 py-4 hover:bg-[#326269] transition-colors flex items-center gap-3 shadow-lg cursor-pointer"
                    >
                      <span className="font-medium">Detail Lengkap</span>
                      <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
                        <FiArrowLeft className="w-4 h-4 text-[#407A81] rotate-180" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-10">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#407A81] text-white py-4 px-8 rounded-xl hover:bg-[#326269] transition-colors font-semibold text-lg shadow-lg cursor-pointer disabled:opacity-50 flex items-center gap-3"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Menyimpan...</span>
                </>
              ) : (
                'Simpan'
              )}
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center justify-center gap-3 bg-white border-2 border-red-500 text-red-500 py-4 px-8 rounded-xl hover:bg-red-50 transition-colors font-semibold shadow-lg cursor-pointer"
            >
              <FiTrash2 className="w-5 h-5" />
              <span>Hapus Pemindaian</span>
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8">
            <h3 className="text-2xl font-bold text-center mb-8">Hasil Pemindaian</h3>

            {/* Image Section */}
            <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-md mb-8" style={{ backgroundColor: '#FFE5F0' }}>
              <Image
                src={analysisData.imageUrl}
                alt="Hasil pengukuran"
                fill
                className="object-cover"
              />
            </div>

            {/* Measurement Cards */}
            <div className="flex gap-6 mb-8">
              <div className="flex-1 bg-[#E5F5F7] rounded-xl p-8 flex flex-col items-center border border-[#CDE6EA]">
                <span className="text-lg font-medium text-gray-600 mb-4">Tinggi Badan</span>
                <div className="flex items-center gap-4">
                  <Image src="/image/icon/tinggi-badan.svg" alt="Tinggi Badan" width={80} height={80} />
                  <span className="text-4xl font-bold text-[#407A81]">{analysisData.height} cm</span>
                </div>
              </div>
              <div className="flex-1 bg-[#E5F5F7] rounded-xl p-8 flex flex-col items-center border border-[#CDE6EA]">
                <span className="text-lg font-medium text-gray-600 mb-4">Berat Badan</span>
                <div className="flex items-center gap-4">
                  <Image src="/image/icon/berat-badan.svg" alt="Berat Badan" width={80} height={80} />
                  <span className="text-4xl font-bold text-[#407A81]">{analysisData.weight} kg</span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowDetailModal(false)}
                className="min-w-[300px] bg-[#407A81] text-white py-3 rounded-full hover:bg-[#326269] transition-colors cursor-pointer font-semibold text-lg shadow-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheck className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Berhasil Disimpan!</h3>
              <p className="text-gray-600 mb-6">
                Hasil analisis telah berhasil disimpan ke database.
              </p>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push('/history');
                }}
                className="w-full bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition-colors font-semibold"
              >
                Lihat Riwayat
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
                Terjadi kesalahan saat menyimpan hasil analisis. Mungkin data dengan NIK dan tanggal yang sama sudah ada.
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
    </Layout>
  );
}

function ResultPageLoading() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#407A81] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat hasil analisis...</p>
        </div>
      </div>
    </Layout>
  );
}

export default function ResultPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<ResultPageLoading />}>
        <ResultPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
