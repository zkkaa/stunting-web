'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Layout, ProtectedRoute } from '@/components';
import { FiFilter, FiSearch, FiMoreVertical, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { fetchParentsData, deleteParentData } from '@/utils/database-clean';

type ParentProfile = {
  id: string;
  fatherName: string;
  motherName: string;
  nik: string;
  childrenCount: number;
  fatherImage: string;
  motherImage: string;
};

function OrangTuaPageContent() {
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [sortOption, setSortOption] = useState<'latest'|'az'|'za'|'children'>('latest');
  const [showFilters, setShowFilters] = useState(false);
  const [parents, setParents] = useState<ParentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);

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
        const transformedData: ParentProfile[] = data.map(parent => ({
          id: parent.id,
          fatherName: parent.fatherName,
          motherName: parent.motherName,
          nik: parent.nik,
          childrenCount: parent.childrenCount,
          fatherImage: parent.fatherImage || '',
          motherImage: parent.motherImage || ''
        }));
        
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black">Profile Orang Tua</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                
              </p>
            </div>

            {/* Actions Card */}
            <div 
              className="mb-4 sm:mb-6 bg-white rounded-xl border border-gray-200 shadow-sm"
              style={{ boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D' }}
            >
              <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button onClick={() => window.location.href = '/orang-tua/tambah'} className="px-3 sm:px-4 py-2 rounded-md bg-[#407A81] text-white hover:bg-[#326269] font-medium text-sm sm:text-base w-full sm:w-fit">
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
                    <ParentCard key={p.id} parent={p} />
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
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft size={16} />
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
                          onClick={() => handlePageChange(pageNum)}
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
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronRight size={16} />
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

function ParentCard({ parent }: { parent: ParentProfile }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      console.log('🗑️ Deleting parent with No KK:', parent.nik);
      
      await deleteParentData(parent.nik);
      
      console.log('✅ Parent deleted successfully');
      setConfirmOpen(false);
      
      // Refresh the page to update the list
      window.location.reload();
    } catch (error) {
      console.error('❌ Error deleting parent:', error);
      alert('Gagal menghapus data orang tua');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div 
      className="relative bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-lg transition-all duration-200"
      style={{ boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D' }}
    >
      {/* menu */}
      <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
        <button onClick={() => setOpen(v => !v)} className="p-1 text-[var(--color-primary)]/80 hover:text-[var(--color-primary)]">
          <FiMoreVertical size={16} />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-2 w-36 sm:w-40 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden z-20">
            <button onClick={() => router.push(`/orang-tua/${parent.nik}`)} className="w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-gray-50">Lihat Detail</button>
            <button onClick={() => router.push(`/orang-tua/edit/${parent.nik}`)} className="w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-gray-50">Edit</button>
            <button onClick={() => setConfirmOpen(true)} className="w-full text-left px-3 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50">Hapus</button>
          </div>
        )}
      </div>
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !deleting && setConfirmOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6">
            <div className="text-center text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Apakah anda yakin ingin menghapusnya?
            </div>
            <div className="text-center text-sm text-gray-600 mb-6">
              Data orang tua, alamat, dan semua anak terkait akan dihapus secara permanen.
            </div>
            <div className="space-y-3">
              <button 
                onClick={handleDelete}
                disabled={deleting}
                className="w-full px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
              <button 
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
                className="w-full px-4 py-2 rounded-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Father row */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#E5F3F5] flex items-center justify-center text-[#397789]">
          {parent.fatherImage && parent.fatherImage !== '/image/icon/pengukuran-anak.jpg' ? (
            <img 
              src={parent.fatherImage} 
              alt={`${parent.fatherName}`}
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
            className={parent.fatherImage && parent.fatherImage !== '/image/icon/pengukuran-anak.jpg' ? 'hidden' : ''}
          >
            <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-4.418 0-8 3.582-8 8h16c0-4.418-3.582-8-8-8Z" fill="#397789"/>
          </svg>
        </div>
        <div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">{parent.fatherName}</div>
          <div className="text-sm text-[#407A81] font-medium">Ayah</div>
        </div>
      </div>

      {/* Mother row */}
      <div className="flex items-center gap-3 sm:gap-4 mt-3 sm:mt-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#E5F3F5] flex items-center justify-center text-[#397789]">
          {parent.motherImage && parent.motherImage !== '/image/icon/pengukuran-anak.jpg' ? (
            <img 
              src={parent.motherImage} 
              alt={`${parent.motherName}`}
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
            className={parent.motherImage && parent.motherImage !== '/image/icon/pengukuran-anak.jpg' ? 'hidden' : ''}
          >
            <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2c-4.418 0-8 3.582-8 8h16c0-4.418-3.582-8-8-8Z" fill="#397789"/>
          </svg>
        </div>
        <div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">{parent.motherName}</div>
          <div className="text-sm text-[#407A81] font-medium">Ibu</div>
        </div>
      </div>

      {/* Info lines */}
      <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3 text-center">
        <div className="text-sm sm:text-base">
          <span className="font-semibold text-[var(--color-primary)]">No KK:</span>
          <span className="ml-2 text-gray-500">{parent.nik}</span>
        </div>
        <div className="text-sm sm:text-base">
          <span className="font-semibold text-[var(--color-primary)]">Jumlah Anak:</span>
          <span className="ml-2 text-gray-500">{parent.childrenCount} Anak</span>
        </div>
      </div>
    </div>
  );
}

export default function OrangTuaPage() {
  return (
    <ProtectedRoute>
      <OrangTuaPageContent />
    </ProtectedRoute>
  );
}

