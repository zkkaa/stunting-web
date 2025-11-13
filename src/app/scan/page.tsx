'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Layout, ProtectedRoute } from '@/components';
import { Bayi } from '@/types/bayi';
import { useRouter } from 'next/navigation';
import { FiMoreVertical, FiFilter, FiSearch } from 'react-icons/fi';
import { fetchChildrenData, ChildData } from '@/utils/database-clean';

function ScanPageContent() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('latest');
  const [showFilters, setShowFilters] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Bayi | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [childrenData, setChildrenData] = useState<ChildData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Fetch children data on component mount
  useEffect(() => {
    const loadChildrenData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchChildrenData();
        setChildrenData(data);
      } catch (err) {
        console.error('Error loading children data:', err);
        setError('Gagal memuat data anak. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };

    loadChildrenData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle child card click
  const handleChildClick = (child: Bayi) => {
    setSelectedChild(child);
    setShowCameraModal(true);
  };

  // Handle camera selection
  const handleCameraSelect = (cameraType: 'Raspberry' | 'handphone') => {
    console.log(`Selected ${cameraType} camera for ${selectedChild?.name}`);
    setShowCameraModal(false);
    setSelectedChild(null);
    
    // Navigate to camera page with camera type and child info
    const cameraParam = cameraType === 'Raspberry' ? 'raspberry' : 'handphone';
    const childParam = selectedChild?.id || '';
    router.push(`/camera?camera=${cameraParam}&child=${childParam}`);
  };

  // Convert database data to Bayi format for compatibility
  const convertedChildren = useMemo(() => {
    return childrenData.map((child): Bayi => ({
      id: child.id,
      name: child.nama,
      age: child.umur_tahun || 0, // Use umur_tahun for primary age
      ageMonths: child.umur_bulan || 0, // Add umur_bulan for additional detail
      gender: child.gender === 'L' ? 'Laki Laki' : child.gender === 'P' ? 'Perempuan' : child.gender,
      height: child.tb_lahir || 0,
      weight: child.bb_lahir || 0,
      status: 'normal', // Default status since we don't have classification yet
      created_at: child.created_at,
      tanggal_lahir: child.tanggal_lahir
    }));
  }, [childrenData]);

  const filteredAndSortedChildren = useMemo(() => {
    const filtered = convertedChildren.filter((child: Bayi) => {
      const matchesSearch = child.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    // Sort data
    filtered.sort((a: Bayi, b: Bayi) => {
      switch (sortOption) {
        case 'az':
          return a.name.localeCompare(b.name);
        case 'za':
          return b.name.localeCompare(a.name);
        case 'age':
          return a.age - b.age;
        case 'latest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [convertedChildren, searchTerm, sortOption]);

  return (
    <Layout>
      <div className="min-h-screen relative overflow-x-hidden">
        {/* Background Gradient Top */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-60 z-10"
          style={{
            background: `radial-gradient(ellipse at center top, rgba(158, 202, 214, 0.6) 0%, rgba(158, 202, 214, 0.3) 30%, rgba(158, 202, 214, 0.1) 50%, transparent 70%)`
          }}
        />
        
        {/* Background Gradient Bottom Right */}
        <div 
          className="absolute bottom-0 right-0 w-96 h-96 -z-1"
          style={{
            background: `linear-gradient(151.12deg, #FFFFFF 53.4%, #9ECAD6 172.54%)`
          }}
        />
        
        {/* Content */}
        <div className="relative z-20 py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-black mb-4">
                Pemindaian
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Silahkan Pilih Anak yang ingin anda lakukan pemindaian. Jika belum<br />
                ada, lakukan Tambah Anak.
              </p>
            </div>

            {/* Container dengan drop shadow */}
            <div 
              className="bg-white rounded-2xl p-6 border border-gray-200"
              style={{
                boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D'
              }}
            >
              {/* Action Bar */}
              <div className="p-0 flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                {/* Left side - Tambah Anak and Filter (centered like orang tua) */}
                <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 sm:gap-3 items-center justify-center mx-auto">
                  <button
                    onClick={() => router.push('/anak/tambah')}
                    className="w-full sm:w-fit px-3 sm:px-4 py-2 rounded-md bg-[#407A81] text-white hover:bg-[#326269] font-medium"
                  >
                    Tambah Anak
                  </button>
                  
                  {/* Filter Button */}
                  <div className="relative w-full sm:w-auto" ref={filterRef}>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="inline-flex items-center justify-center gap-2 w-full sm:w-fit px-3 sm:px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
                    >
                      <FiFilter className="text-gray-500" />
                      <span className="text-gray-700">Filter by</span>
                    </button>
                    
                    {/* Filter Dropdown Content */}
                    {showFilters && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] max-w-[calc(100vw-2rem)] overflow-hidden">
                        <div className="p-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Urutkan:</label>
                            <div className="space-y-2">
                              {[
                                { value: 'az', label: 'A→Z' },
                                { value: 'za', label: 'Z→A' },
                                { value: 'age', label: 'Usia Bayi' },
                                { value: 'latest', label: 'Terbaru' }
                              ].map((option) => (
                                <label key={option.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors">
                                  <input
                                    type="radio"
                                    name="sortFilter"
                                    value={option.value}
                                    checked={sortOption === option.value}
                                    onChange={(e) => setSortOption(e.target.value)}
                                    className="w-4 h-4 border-gray-300 focus:ring-0 focus:ring-offset-0"
                                    style={{
                                      accentColor: '#407A81'
                                    }}
                                  />
                                  <span className="text-sm text-gray-700 whitespace-nowrap">{option.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Right side - Search Input */}
                <div className="relative flex-1 min-w-[200px] sm:min-w-[240px] mt-2 sm:mt-0">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari Anak"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none w-full"
                  />
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-[#407A81] transition ease-in-out duration-150">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memuat data anak...
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="text-center py-8">
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-800">{error}</p>
                    <button 
                      onClick={() => window.location.reload()} 
                      className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Coba Lagi
                    </button>
                  </div>
                </div>
              )}

              {/* Grid Card Layout */}
              {!loading && !error && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAndSortedChildren.map((child: Bayi) => (
                    <ChildCard 
                      key={child.id} 
                      child={child} 
                      onClick={handleChildClick} 
                      onOpenMenu={(id) => setMenuOpenId(menuOpenId === id ? null : id)} 
                      menuOpenId={menuOpenId} 
                      onEdit={(id) => { 
                        const childData = childrenData.find(c => c.id === id);
                        if (childData) {
                          setMenuOpenId(null); 
                          router.push(`/anak/edit/${childData.nik}`); 
                        }
                      }} 
                      onDelete={(id) => { setMenuOpenId(null); setDeleteId(id); }}
                      childImage={childrenData.find(c => c.id === child.id)?.image_anak}
                    />
                  ))}
                </div>
              )}

              {/* No Results */}
              {!loading && !error && filteredAndSortedChildren.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Tidak ada data anak yang ditemukan</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Camera Selection Modal */}
        {showCameraModal && (
          <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-center text-gray-900 mb-6">
                Pilih Camera Pemindaian
              </h2>
              
              <div className="space-y-4">
                {/* Camera Raspberry Button */}
                <button
                  onClick={() => handleCameraSelect('Raspberry')}
                  className="w-full bg-[#407A81] text-white py-3 px-6 rounded-lg hover:bg-[#326269] transition-colors font-medium"
                >
                  Camera Raspberry
                </button>
                
                {/* Camera Handphone Button */}
                <button
                  onClick={() => handleCameraSelect('handphone')}
                  className="w-full border-2 border-[#407A81] text-[#407A81] py-3 px-6 rounded-lg hover:bg-[#407A81] hover:text-white transition-colors font-medium"
                >
                  Camera Handphone
                </button>
              </div>
              
              {/* Close button */}
              <button
                onClick={() => {
                  setShowCameraModal(false);
                  setSelectedChild(null);
                }}
                className="mt-6 w-full text-gray-500 hover:text-gray-700 transition-colors text-sm"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

// Child Card Component
interface ChildCardProps {
  child: Bayi;
  onClick: (child: Bayi) => void;
  onOpenMenu: (id: string) => void;
  menuOpenId: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  childImage?: string | null;
}

function ChildCard({ child, onClick, onOpenMenu, menuOpenId, onEdit, onDelete, childImage }: ChildCardProps) {
  return (
    <div 
      onClick={() => onClick(child)}
      className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
      style={{
        boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D'
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            {childImage ? (
              <img 
                src={childImage} 
                alt={child.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#E5F3F5] flex items-center justify-center text-[#397789] shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-4.418 0-8 3.582-8 8h16c0-4.418-3.582-8-8-8Z" fill="#397789"/>
                </svg>
              </div>
            )}
          </div>
          
          {/* Info */}
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{child.name}</h3>
            <p className="text-xs text-[#407A81] font-medium">{child.gender}</p>
            <p className="text-xs text-[#407A81]">
              Umur: <span className="text-gray-500">
                {child.age > 0 ? `${child.age} Tahun` : ''}
                {child.age > 0 && child.ageMonths && child.ageMonths > 0 ? ' ' : ''}
                {child.ageMonths && child.ageMonths > 0 ? `${child.ageMonths} Bulan` : ''}
                {child.age === 0 && (!child.ageMonths || child.ageMonths === 0) ? 'Baru lahir' : ''}
              </span>
            </p>
          </div>
        </div>
        
        {/* More Options */}
        <div className="relative">
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            onClick={(e) => { e.stopPropagation(); onOpenMenu(child.id); }}
          >
            <FiMoreVertical size={16} />
          </button>
          {menuOpenId === child.id && (
            <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-10 overflow-hidden">
              <button onClick={(e) => { e.stopPropagation(); onEdit(child.id); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Edit</button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(child.id); }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Hapus</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <ProtectedRoute>
      <ScanPageContent />
    </ProtectedRoute>
  );
}
