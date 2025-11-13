'use client';

import React, { useState, Suspense, useRef } from 'react';
import { Layout, ProtectedRoute } from '@/components';
import { FiArrowLeft } from 'react-icons/fi';
import { useRouter, useSearchParams } from 'next/navigation';
import { insertChildData, uploadChildImage, NewChildData } from '@/utils/database-clean';

function TambahAnakFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const no_kk = searchParams?.get('no_kk');
  const fatherName = searchParams?.get('fatherName');
  const motherName = searchParams?.get('motherName');

  const [formData, setFormData] = useState({
    name: '',
    nik: '',
    birthPlace: '',
    birthDate: '',
    currentAge: '',
    ageUnit: 'Bulan',
    gender: 'L', // L = Laki-laki, P = Perempuan
    birthWeight: '',
    birthHeight: '',
    birthHeadCircumference: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isManualAge, setIsManualAge] = useState(false); // Track if user wants manual age input

  // Function to calculate age from birth date
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
    // const remainingMonths = months % 12;
    
    return { months: months < 0 ? 0 : months, years };
  };

  // Auto-calculate age when birth date changes
  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const birthDate = e.target.value;
    console.log('🎂 Birth date changed to:', birthDate);
    console.log('🔄 Current state - isManualAge:', isManualAge, 'currentAge:', formData.currentAge);
    
    if (birthDate && !isManualAge) {
      console.log('🤖 Auto-calculating age from birth date');
      const { months, years } = calculateAgeFromBirthDate(birthDate);
      console.log('📊 Calculated age - months:', months, 'years:', years);
      
      // Set age based on what makes more sense (under 2 years = months, over 2 years = years)
      if (years < 2) {
        console.log('👶 Setting age to', months, 'months');
        setFormData(prev => ({ 
          ...prev, 
          birthDate,
          currentAge: months.toString(), 
          ageUnit: 'Bulan' 
        }));
      } else {
        console.log('🧒 Setting age to', years, 'years');
        setFormData(prev => ({ 
          ...prev, 
          birthDate,
          currentAge: years.toString(), 
          ageUnit: 'Tahun' 
        }));
      }
    } else {
      console.log('� Manual mode or no birth date - just updating birth date');
      // Just update birth date without changing age
      setFormData(prev => ({ ...prev, birthDate }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // If user manually changes age, enable manual mode
    if (name === 'currentAge') {
      console.log('🖱️ User manually changing age to:', value);
      setIsManualAge(true);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // // Separate handler for age input to prevent conflicts
  // const handleAgeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const value = e.target.value;
  //   console.log('🔢 Age input changed to:', value, 'isManualAge:', isManualAge);
    
  //   // Only set manual mode if user actually types (not from auto-calculation)
  //   if (!isManualAge) {
  //     console.log('⚠️ Age changed but not setting manual mode (auto-calculation)');
  //   } else {
  //     console.log('✋ User manually changing age');
  //   }
    
  //   setFormData(prev => ({
  //     ...prev,
  //     currentAge: value
  //   }));
  // };

  const handleGenderSelect = (gender: string) => {
    setFormData(prev => ({
      ...prev,
      gender
    }));
  };

  const [childImage, setChildImage] = useState<string>('');
  const [childImageFile, setChildImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!no_kk) {
      setSubmitError('Data orang tua tidak ditemukan');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Calculate age in years based on birth date and current age input
      // Calculate age in years and months
      const calculateAge = () => {
        if (formData.birthDate) {
          const { months, years } = calculateAgeFromBirthDate(formData.birthDate);
          return { years, months: months % 12 };
        }
        // If no birth date, use manual age input
        const currentAge = parseInt(formData.currentAge) || 0;
        if (formData.ageUnit === 'Tahun') {
          return { years: currentAge, months: 0 };
        } else {
          return { years: Math.floor(currentAge / 12), months: currentAge % 12 };
        }
      };

      const ageData = calculateAge();

      // Upload image if provided
      let imageUrl = null;
      if (childImageFile && formData.nik) {
        try {
          console.log('Uploading child image...');
          imageUrl = await uploadChildImage(childImageFile, formData.nik);
          console.log('Image uploaded successfully:', imageUrl);
        } catch (imageError) {
          console.error('Error uploading image:', imageError);
          // Continue without image if upload fails
        }
      }

      const childData: NewChildData = {
        nik: formData.nik,
        no_kk: no_kk,
        nama: formData.name,
        tanggal_lahir: formData.birthDate,
        tempat_lahir: formData.birthPlace,
        gender: formData.gender,
        umur_tahun: ageData.years,
        umur_bulan: ageData.months,
        bb_lahir: parseFloat(formData.birthWeight) || 0,
        tb_lahir: parseFloat(formData.birthHeight) || 0,
        lk_lahir: parseFloat(formData.birthHeadCircumference) || 0,
        image_anak: imageUrl,
        aktif: true
      };

      console.log('Submitting child data:', childData);
      
      await insertChildData(childData);
      
      console.log('Child data saved successfully');
      router.push('/anak');
      
    } catch (error: unknown) {
      console.error('Error saving child data:', error);
      setSubmitError(error instanceof Error ? error.message : 'Gagal menyimpan data anak');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/anak/tambah');
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
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
              Tambah Anak
            </h1>
            
            {/* Parent Info */}
            {fatherName && motherName && (
              <div className="text-center mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Orang Tua yang Dipilih:</p>
                <p className="font-semibold text-gray-900">
                  {decodeURIComponent(fatherName)} & {decodeURIComponent(motherName)}
                </p>
                <p className="text-sm text-gray-500">No. KK: {no_kk}</p>
              </div>
            )}

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
                    <div className="relative">
                      <input
                        type="date"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleBirthDateChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  {/* Usia Bayi saat ini */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Usia Bayi saat ini
                      {formData.birthDate && !isManualAge && (
                        <span className="text-xs text-green-600 ml-2">(Otomatis dari tanggal lahir)</span>
                      )}
                      {isManualAge && (
                        <span className="text-xs text-blue-600 ml-2">(Input manual)</span>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        name="currentAge"
                        value={formData.currentAge}
                        onChange={(e) => {
                          const value = e.target.value;
                          console.log('🔢 Manual age input:', value);
                          console.log('🔍 Before manual input - isManualAge:', isManualAge);
                          
                          // Only mark as manual if user actually types (not from programmatic update)
                          if (e.nativeEvent && e.nativeEvent.isTrusted) {
                            console.log('✋ User manually typing age');
                            setIsManualAge(true);
                          }
                          
                          setFormData(prev => ({
                            ...prev,
                            currentAge: value
                          }));
                        }}
                        className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none text-center"
                        placeholder="0"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (formData.birthDate && !isManualAge) {
                            // Recalculate age in months from birth date
                            const { months } = calculateAgeFromBirthDate(formData.birthDate);
                            setFormData(prev => ({ ...prev, currentAge: months.toString(), ageUnit: 'Bulan' }));
                          } else {
                            // Just change unit without recalculating
                            setFormData(prev => ({ ...prev, ageUnit: 'Bulan' }));
                          }
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors cursor-pointer ${
                          formData.ageUnit === 'Bulan'
                            ? 'bg-[#407A81] text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Bulan
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (formData.birthDate && !isManualAge) {
                            // Recalculate age in years from birth date
                            const { years } = calculateAgeFromBirthDate(formData.birthDate);
                            setFormData(prev => ({ ...prev, currentAge: years.toString(), ageUnit: 'Tahun' }));
                          } else {
                            // Just change unit without recalculating
                            setFormData(prev => ({ ...prev, ageUnit: 'Tahun' }));
                          }
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors cursor-pointer ${
                          formData.ageUnit === 'Tahun'
                            ? 'bg-[#407A81] text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Tahun
                      </button>
                    </div>
                    
                    {/* Toggle button untuk mode manual/otomatis */}
                    {formData.birthDate && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const newIsManualAge = !isManualAge;
                            setIsManualAge(newIsManualAge);
                            
                            if (!newIsManualAge && formData.birthDate) {
                              // Switch back to auto mode - recalculate age from birth date
                              const { months, years } = calculateAgeFromBirthDate(formData.birthDate);
                              if (formData.ageUnit === 'Bulan') {
                                setFormData(prev => ({ ...prev, currentAge: months.toString() }));
                              } else {
                                setFormData(prev => ({ ...prev, currentAge: years.toString() }));
                              }
                            }
                          }}
                          className="text-xs text-[#407A81] hover:text-[#326269] underline"
                        >
                          {isManualAge ? 'Kembali ke perhitungan otomatis' : 'Input manual'}
                        </button>
                      </div>
                    )}
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

export default function TambahAnakFormPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <Layout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-gray-500">Loading...</div>
          </div>
        </Layout>
      }>
        <TambahAnakFormContent />
      </Suspense>
    </ProtectedRoute>
  );
}
