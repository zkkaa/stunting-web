'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Layout, ProtectedRoute } from '@/components';
import { FiArrowLeft } from 'react-icons/fi';
import { useRouter, useParams } from 'next/navigation';
import { fetchChildByNik, updateChildData, uploadChildImage, deleteChildImage, UpdateChildData, ChildData } from '@/utils/database-clean';

// Helper function to calculate age from birth date
const calculateAgeFromBirthDate = (birthDate: string) => {
  if (!birthDate) return { months: 0, years: 0 };
  
  const birth = new Date(birthDate);
  const today = new Date();
  
  let months = (today.getFullYear() - birth.getFullYear()) * 12;
  months -= birth.getMonth();
  months += today.getMonth();
  
  // Adjust if the current day is before the birth day
  if (today.getDate() < birth.getDate()) {
    months--;
  }
  
  const years = Math.floor(months / 12);
  
  return { months: months < 0 ? 0 : months, years };
};

function EditChildPageContent() {
  const router = useRouter();
  const params = useParams();
  const nik = params?.id as string; // URL parameter adalah NIK anak
  
  // State for child data and loading
  const [childData, setChildData] = useState<ChildData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Image state
  const [childImage, setChildImage] = useState<string>('');
  const [childImageFile, setChildImageFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nik: '',
    birthPlace: '',
    birthDate: '',
    currentAgeYears: '',
    currentAgeMonths: '',
    gender: 'L', // L = Laki-laki, P = Perempuan
    birthWeight: '',
    birthHeight: '',
    birthHeadCircumference: ''
  });
  
  // Load child data on component mount
  useEffect(() => {
    const loadChildData = async () => {
      if (!nik) return;
      
      try {
        setLoading(true);
        const data = await fetchChildByNik(nik);
        
        if (data) {
          setChildData(data);
          setOriginalImageUrl(data.image_anak || '');
          setChildImage(data.image_anak || '');
          
          // Calculate current age from birth date for display
          const { months, years } = calculateAgeFromBirthDate(data.tanggal_lahir);
          
          setFormData({
            name: data.nama || '',
            nik: data.nik || '',
            birthPlace: data.tempat_lahir || '',
            birthDate: data.tanggal_lahir || '',
            currentAgeYears: years.toString(),
            currentAgeMonths: (months % 12).toString(),
            gender: data.gender || 'L',
            birthWeight: data.bb_lahir?.toString() || '',
            birthHeight: data.tb_lahir?.toString() || '',
            birthHeadCircumference: data.lk_lahir?.toString() || ''
          });
        }
      } catch (error) {
        console.error('Error loading child data:', error);
        setSubmitError('Gagal memuat data anak');
      } finally {
        setLoading(false);
      }
    };
    
    loadChildData();
  }, [nik]);

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </Layout>
    );
  }

  // Not found state
  if (!childData) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Data tidak ditemukan</h1>
            <button
              onClick={() => router.push('/anak')}
              className="text-[#407A81] hover:underline cursor-pointer"
            >
              Kembali ke Anak
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleBack = () => {
    router.push('/anak');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      
      // Auto-update age when birth date changes
      if (name === 'birthDate' && value) {
        const { months, years } = calculateAgeFromBirthDate(value);
        updated.currentAgeYears = years.toString();
        updated.currentAgeMonths = (months % 12).toString();
      }
      
      return updated;
    });
  };

  const handleGenderSelect = (gender: string) => {
    setFormData(prev => ({
      ...prev,
      gender
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nik) {
      setSubmitError('NIK anak tidak ditemukan');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Calculate age in years and months based on birth date
      const calculateAge = () => {
        if (formData.birthDate) {
          const { months, years } = calculateAgeFromBirthDate(formData.birthDate);
          return { years, months: months % 12 };
        }
        // If no birth date, use manual age input
        const ageYears = parseInt(formData.currentAgeYears) || 0;
        const ageMonths = parseInt(formData.currentAgeMonths) || 0;
        return { years: ageYears, months: ageMonths };
      };

      const ageData = calculateAge();

      // Handle image upload/update
      let imageUrl = originalImageUrl;
      
      if (childImageFile && formData.nik) {
        try {
          console.log('Uploading new child image...');
          
          // Delete old image if exists and is different
          if (originalImageUrl && originalImageUrl !== childImage) {
            await deleteChildImage(originalImageUrl);
          }
          
          // Upload new image
          imageUrl = await uploadChildImage(childImageFile, formData.nik);
          console.log('New image uploaded successfully:', imageUrl);
          
        } catch (imageError) {
          console.error('Error handling image:', imageError);
          // Continue without image update if upload fails
          imageUrl = originalImageUrl;
        }
      }

      const updateData: UpdateChildData = {
        nik: formData.nik,
        nama: formData.name,
        tanggal_lahir: formData.birthDate,
        tempat_lahir: formData.birthPlace,
        gender: formData.gender,
        umur_tahun: ageData.years,
        umur_bulan: ageData.months,
        bb_lahir: parseFloat(formData.birthWeight) || 0,
        tb_lahir: parseFloat(formData.birthHeight) || 0,
        lk_lahir: parseFloat(formData.birthHeadCircumference) || 0,
        image_anak: imageUrl
      };

      console.log('Updating child data:', updateData);
      
      await updateChildData(nik, updateData);
      
      console.log('Child data updated successfully');
      router.push('/anak');
      
    } catch (error: unknown) {
      console.error('Error updating child data:', error);
      setSubmitError(error instanceof Error ? error.message : 'Gagal mengupdate data anak');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <div className="max-w-3xl mx-auto px-4 py-8">
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
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden p-8">
            {/* Title */}
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Edit Profile Anak
            </h1>

            {/* Error Message */}
            {submitError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{submitError}</p>
              </div>
            )}

            {/* Profile Image */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-[#E5F3F5] flex items-center justify-center text-[#397789]">
                  {childImage ? (
                    <img src={childImage} alt="foto anak" className="w-full h-full object-cover" />
                  ) : (
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-4.418 0-8 3.582-8 8h16c0-4.418-3.582-8-8-8Z" fill="#397789"/>
                    </svg>
                  )}
                </div>
                {/* Camera icon overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-[#407A81] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#326269] transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                      setChildImage(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Identitas Anak Section */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Identitas Anak</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nama Anak */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Anak
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                      placeholder="Emma Jhon"
                    />
                  </div>

                  {/* NIK Anak */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NIK Anak
                    </label>
                    <input
                      type="text"
                      name="nik"
                      value={formData.nik}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                      placeholder="008211102131223"
                    />
                  </div>

                  {/* Tempat Lahir */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tempat Lahir
                    </label>
                    <input
                      type="text"
                      name="birthPlace"
                      value={formData.birthPlace}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                      placeholder="Tasikmalaya"
                    />
                  </div>

                  {/* Tanggal Lahir */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                    />
                  </div>

                  {/* Usia Bayi saat ini */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Usia Bayi saat ini
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Tahun</label>
                        <input
                          type="number"
                          name="currentAgeYears"
                          value={formData.currentAgeYears}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none text-center"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Bulan</label>
                        <input
                          type="number"
                          name="currentAgeMonths"
                          value={formData.currentAgeMonths}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none text-center"
                          placeholder="0"
                          min="0"
                          max="11"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Otomatis terisi dari tanggal lahir. Bisa diedit manual jika diperlukan.
                    </p>
                  </div>

                  {/* Jenis Kelamin */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jenis Kelamin
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleGenderSelect('L')}
                        className={`py-2 px-4 rounded-lg font-medium transition-colors cursor-pointer ${
                          formData.gender === 'L'
                            ? 'bg-[#407A81] text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Laki Laki
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenderSelect('P')}
                        className={`py-2 px-4 rounded-lg font-medium transition-colors cursor-pointer ${
                          formData.gender === 'P'
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

              {/* Data Timbangan saat Lahir Section */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Timbangan saat Lahir</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Berat Badan Lahir */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Berat Badan Lahir
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="birthWeight"
                      value={formData.birthWeight}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                      placeholder="0.5 Kg"
                    />
                  </div>

                  {/* Tinggi Badan Lahir */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tinggi Badan Lahir
                    </label>
                    <input
                      type="number"
                      name="birthHeight"
                      value={formData.birthHeight}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                      placeholder="30 Cm"
                    />
                  </div>

                  {/* Lingkar Kepala Lahir */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lingkar Kepala Lahir
                    </label>
                    <input
                      type="number"
                      name="birthHeadCircumference"
                      value={formData.birthHeadCircumference}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                      placeholder="15 Cm"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-2/3 lg:w-1/2 bg-[#407A81] text-white py-4 px-8 rounded-xl hover:bg-[#326269] transition-colors font-semibold text-lg shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function EditChildPage() {
  return (
    <ProtectedRoute>
      <EditChildPageContent />
    </ProtectedRoute>
  );
}
