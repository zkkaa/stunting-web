'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Layout, ProtectedRoute } from '@/components';
import { FiFilter, FiSearch } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { fetchParentsData } from '@/utils/database-clean';

type ParentProfile = {
  id: string;
  fatherName: string;
  motherName: string;
  nik: string;
  childrenCount: number;
  fatherImage: string;
  motherImage: string;
  no_kk: string;
};

function TambahAnakPageContent() {
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [sortOption, setSortOption] = useState<'latest'|'az'|'za'|'children'>('latest');
  const [showFilters, setShowFilters] = useState(false);
  const [parents, setParents] = useState<ParentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch data from database
  useEffect(() => {
    const loadParentsData = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await fetchParentsData();
        
        // Transform ParentData to ParentProfile
        const transformedData: ParentProfile[] = data.map(parent => {
          console.log('Parent data:', {
            id: parent.id,
            fatherName: parent.fatherName,
            motherName: parent.motherName,
            fatherImage: parent.fatherImage,
            motherImage: parent.motherImage
          });
          
          return {
            id: parent.id,
            fatherName: parent.fatherName,
            motherName: parent.motherName,
            nik: parent.nik,
            childrenCount: parent.childrenCount,
            fatherImage: parent.fatherImage || '/image/icon/pengukuran-anak.jpg',
            motherImage: parent.motherImage || '/image/icon/pengukuran-anak.jpg',
            no_kk: parent.no_kk
          };
        });
        
        setParents(transformedData);
        
        if (transformedData.length === 0) {
          setError('Tidak ada data orang tua ditemukan');
        } else {
          setError(''); // Clear any previous error
        }
      } catch (err) {
        console.error('Error loading parents data:', err);
        setError('Gagal memuat data orang tua');
      } finally {
        setLoading(false);
      }
    };

    loadParentsData();
  }, []);

  // Reset current page when parents data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [parents]);

  const filtered = useMemo(() => {
    const list = parents.filter(p =>
      `${p.fatherName} ${p.motherName}`.toLowerCase().includes(query.toLowerCase()) ||
      p.nik.includes(query)
    );

    list.sort((a, b) => {
      switch (sortOption) {
        case 'az':
          return a.fatherName.localeCompare(b.fatherName);
        case 'za':
          return b.fatherName.localeCompare(a.fatherName);
        case 'children':
          return b.childrenCount - a.childrenCount;
        case 'latest':
        default:
          return parseInt(b.id) - parseInt(a.id);
      }
    });

    return list;
  }, [parents, query, sortOption]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const handleSelectParent = (parent: ParentProfile) => {
    // Navigate to form tambah anak with parent no_kk
    router.push(`/anak/tambah/form?no_kk=${parent.no_kk}&fatherName=${encodeURIComponent(parent.fatherName)}&motherName=${encodeURIComponent(parent.motherName)}`);
  };

  return (
    <Layout>
      <div className="min-h-screen relative overflow-x-hidden">
        {/* Background */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-60 z-10"
          style={{
            background: `radial-gradient(ellipse at center top, rgba(158, 202, 214, 0.6) 0%, rgba(158, 202, 214, 0.3) 30%, rgba(158, 202, 214, 0.1) 50%, transparent 70%)`
          }}
        />

        <div className="relative z-20 py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black">Pilih Orang Tua Bayi</h1>
            </div>

            {/* Actions Card */}
            <div 
              className="mb-4 sm:mb-6 bg-white rounded-xl border border-gray-200 shadow-sm"
              style={{ boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D' }}
            >
              <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button onClick={() => router.push('/orang-tua/tambah')} className="px-3 sm:px-4 py-2 rounded-md bg-[#407A81] text-white hover:bg-[#326269] font-medium text-sm sm:text-base w-full sm:w-fit">
                    Tambah Orang Tua
                  </button>
                  <div className="relative" ref={filterRef}>
                    <button 
                      onClick={() => setShowFilters(!showFilters)}
                      className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-sm sm:text-base w-full sm:w-fit"
                    >
                      <FiFilter className="text-gray-600" size={16} />
                      <span className="text-gray-700">Filter by</span>
                    </button>
                    {showFilters && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] max-w-[calc(100vw-2rem)] overflow-hidden">
                        <div className="p-4">
                          <label className="block text-sm font-medium text-gray-700 mb-3">Urutkan:</label>
                          <div className="space-y-2">
                            {[{value:'latest',label:'Terbaru'},{value:'az',label:'Nama A-Z'},{value:'za',label:'Nama Z-A'},{value:'children',label:'Jumlah Anak'}].map((opt) => (
                              <label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors">
                                <input type="radio" name="sortFilter" value={opt.value} checked={sortOption===opt.value} onChange={(e)=>setSortOption(e.target.value as 'latest'|'az'|'za'|'children')} className="w-4 h-4 border-gray-300 focus:ring-0 focus:ring-offset-0" style={{accentColor:'#407A81'}} />
                                <span className="text-sm text-gray-700 whitespace-nowrap">{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Cari Orang Tua"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-[#9ECAD6] focus:border-transparent text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>

            {/* Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {loading ? (
                <div className="col-span-full text-center text-gray-500 py-10">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#407A81]"></div>
                  <p className="mt-2">Memuat data...</p>
                </div>
              ) : error ? (
                <div className="col-span-full text-center text-red-500 py-10">
                  <p>{error}</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="mt-2 px-4 py-2 bg-[#407A81] text-white rounded-md hover:bg-[#326269]"
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : (
                <>
                  {paginatedData.map((p) => (
                    <ParentCard key={p.id} parent={p} onSelect={() => handleSelectParent(p)} />
                  ))}
                  {paginatedData.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 py-10">Tidak ada data</div>
                  )}
                </>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} data
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 rounded-md text-sm font-medium ${
                            currentPage === pageNum
                              ? 'bg-[#407A81] text-white'
                              : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Component for parent image with fallback
function ParentImage({ src, alt, isDefault }: { src: string; alt: string; isDefault: boolean }) {
  const [imageError, setImageError] = useState(false);
  
  console.log('ParentImage:', { src, alt, isDefault, imageError });
  
  if (isDefault || imageError) {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-4.418 0-8 3.582-8 8h16c0-4.418-3.582-8-8-8Z" fill="#397789"/>
      </svg>
    );
  }
  
  return (
    <Image 
      src={src} 
      alt={alt}
      fill
      className="object-cover"
      onError={() => {
        console.log('Image failed to load:', src);
        setImageError(true);
      }}
      onLoad={() => {
        console.log('Image loaded successfully:', src);
      }}
    />
  );
}

function ParentCard({ parent, onSelect }: { parent: ParentProfile; onSelect: () => void }) {
  return (
    <div 
      onClick={onSelect}
      className="relative bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-[#407A81]"
      style={{ boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D' }}
    >
      {/* Father row */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#E5F3F5] flex items-center justify-center relative">
          <ParentImage 
            src={parent.fatherImage}
            alt={`Foto ${parent.fatherName}`}
            isDefault={!parent.fatherImage || parent.fatherImage === '/image/icon/pengukuran-anak.jpg'}
          />
        </div>
        <div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">{parent.fatherName}</div>
          <div className="text-sm text-[#407A81] font-medium">Ayah</div>
        </div>
      </div>

      {/* Mother row */}
      <div className="flex items-center gap-3 sm:gap-4 mt-3 sm:mt-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#E5F3F5] flex items-center justify-center relative">
          <ParentImage 
            src={parent.motherImage}
            alt={`Foto ${parent.motherName}`}
            isDefault={!parent.motherImage || parent.motherImage === '/image/icon/pengukuran-anak.jpg'}
          />
        </div>
        <div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">{parent.motherName}</div>
          <div className="text-sm text-[#407A81] font-medium">Ibu</div>
        </div>
      </div>

      {/* Info lines */}
      <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3 text-center">
        <div className="text-sm sm:text-base">
          <span className="font-semibold text-[#407A81]">No KK:</span>
          <span className="ml-2 text-gray-500">{parent.nik}</span>
        </div>
        <div className="text-sm sm:text-base">
          <span className="font-semibold text-[#407A81]">Jumlah Anak:</span>
          <span className="ml-2 text-gray-500">{parent.childrenCount} Anak</span>
        </div>
      </div>
    </div>
  );
}

export default function TambahAnakPage() {
  return (
    <ProtectedRoute>
      <TambahAnakPageContent />
    </ProtectedRoute>
  );
}
