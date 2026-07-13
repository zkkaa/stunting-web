'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Layout, ProtectedRoute, DeleteConfirmModal } from '@/components';
import Link from 'next/link';
import { FiMoreVertical, FiArrowLeft, FiPhone, FiMapPin, FiPlus, FiUser } from 'react-icons/fi';
import { useRouter, useParams } from 'next/navigation';
import { fetchKeluargaDetail, insertAnak, deleteAnak, deleteKeluarga } from '@/utils/database';
import { calculateAgeInMonths } from '@/lib/stuntingCalculator';
import { OrangTua, Alamat, Anak, NewAnakPayload } from '@/types';

function formatUmur(tanggalLahir: string): string {
  const totalBulan = calculateAgeInMonths(tanggalLahir);
  const tahun = Math.floor(totalBulan / 12);
  const bulan = totalBulan % 12;
  if (tahun === 0 && bulan === 0) return 'Baru lahir';
  if (tahun === 0) return `${bulan} Bulan`;
  if (bulan === 0) return `${tahun} Tahun`;
  return `${tahun} Tahun ${bulan} Bulan`;
}

function formatTanggal(tanggal: string | null | undefined): string {
  if (!tanggal) return 'Tidak ada';
  return new Date(tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

interface DetailData {
  ayah: OrangTua | null;
  ibu: OrangTua | null;
  alamat: Alamat | null;
  anak: Anak[];
}

function OrangTuaDetailPageContent() {
  const router = useRouter();
  const params = useParams();
  const noKk = params?.id as string;

  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showDeleteKeluarga, setShowDeleteKeluarga] = useState(false);
  const [childMenuOpenId, setChildMenuOpenId] = useState<string | null>(null);
  const [childDeleteId, setChildDeleteId] = useState<string | null>(null);

  const loadData = async () => {
    if (!noKk) return;
    try {
      setLoading(true);
      setError('');
      const detail = await fetchKeluargaDetail(noKk);
      setData(detail);
    } catch (err) {
      console.error('Error loading keluarga detail:', err);
      setError('Gagal memuat data orang tua');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noKk]);

  useEffect(() => {
    document.body.style.overflow = showAddChild ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddChild]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      const target = event.target as HTMLElement;
      if (!target.closest('[data-child-menu]')) {
        setChildMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const childToDelete = data?.anak.find((a) => a.nik === childDeleteId) || null;

  return (
    <Layout>
      <div className="min-h-screen relative overflow-x-hidden bg-gray-50/50">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-60 z-10"
          style={{
            background: `radial-gradient(ellipse at center top, rgba(158, 202, 214, 0.6) 0%, rgba(158, 202, 214, 0.3) 30%, rgba(158, 202, 214, 0.1) 50%, transparent 70%)`,
          }}
        />

        <div className="relative z-20 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Link href="/orang-tua" className="mb-4 inline-flex items-center gap-2 text-sm sm:text-base text-gray-600 hover:text-[#407A81] transition-colors">
              <FiArrowLeft size={18} />
              <span>Kembali ke Orang Tua</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Profile Orang Tua</h1>

            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#407A81]"></div>
                <p className="mt-4 text-gray-500 text-sm">Memuat data...</p>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-500 mb-4 text-sm">{error}</p>
                <button onClick={loadData} className="px-4 py-2 bg-[#407A81] text-white rounded-md hover:bg-[#326269] text-sm">
                  Coba Lagi
                </button>
              </div>
            ) : !data ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-sm">Data tidak ditemukan</p>
              </div>
            ) : (
              <>
                {/* Card utama: identitas ayah, ibu, keluarga, alamat */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
                  <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Identitas Keluarga</span>
                    <div className="relative" ref={menuRef}>
                      <button
                        onClick={() => setMenuOpen((v) => !v)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-[#407A81] hover:bg-gray-50 transition-colors"
                      >
                        <FiMoreVertical size={18} />
                      </button>
                      {menuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-20">
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              router.push(`/orang-tua/edit/${noKk}`);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              setShowDeleteKeluarga(true);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-5 sm:px-7 py-6 space-y-6">
                    <ParentProfileBlock label="Ayah" orangTua={data.ayah} />
                    <div className="border-t border-gray-100" />
                    <ParentProfileBlock label="Ibu" orangTua={data.ibu} />
                  </div>

                  <div className="px-5 sm:px-7 py-5 bg-gray-50/70 border-t border-gray-100 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">No KK</div>
                      <div className="text-sm sm:text-base font-semibold text-gray-900">{noKk}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Jumlah Anak</div>
                      <div className="text-sm sm:text-base font-semibold text-gray-900">{data.anak.length} Anak</div>
                    </div>
                  </div>

                  <div className="px-5 sm:px-7 py-5 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3 text-gray-500">
                      <FiMapPin size={15} />
                      <span className="text-xs font-semibold uppercase tracking-wide">Alamat Rumah</span>
                    </div>
                    {data.alamat ? (
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {data.alamat.jalan}, {data.alamat.desa}, {data.alamat.kecamatan}, {data.alamat.kota}, {data.alamat.provinsi}{' '}
                        {data.alamat.kode_pos}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">Alamat belum diisi</p>
                    )}
                  </div>
                </div>

                {/* Card anak */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Data Anak</span>
                    <button
                      onClick={() => setShowAddChild(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#407A81] text-white text-sm font-medium hover:bg-[#326269] transition-colors"
                    >
                      <FiPlus size={15} />
                      Tambah Anak
                    </button>
                  </div>

                  <div className="p-5 sm:p-7">
                    {data.anak.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {data.anak.map((c) => (
                          <div
                            key={c.nik}
                            onClick={() => router.push(`/anak/${c.nik}`)}
                            className="relative rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-[#407A81] hover:shadow-md transition-all"
                          >
                            <div className="absolute top-3 right-3" data-child-menu>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setChildMenuOpenId(childMenuOpenId === c.nik ? null : c.nik);
                                }}
                                className="text-gray-400 hover:text-gray-600 p-1"
                              >
                                <FiMoreVertical size={16} />
                              </button>
                              {childMenuOpenId === c.nik && (
                                <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-20 overflow-hidden">
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setChildMenuOpenId(null);
                                      setChildDeleteId(c.nik);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#E5F3F5] flex items-center justify-center text-[#397789] shrink-0">
                                {c.foto_profil ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={c.foto_profil} alt={c.nama} className="w-full h-full object-cover" />
                                ) : (
                                  <FiUser size={22} />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-gray-900 text-base leading-tight truncate">{c.nama}</div>
                                <div className="text-xs text-[#407A81] mt-0.5">{c.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{formatUmur(c.tanggal_lahir)}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <FiUser className="mx-auto text-gray-300 mb-3" size={36} />
                        <p className="text-gray-500 text-sm font-medium">Belum ada anak yang terdaftar</p>
                        <p className="text-gray-400 text-xs mt-1">Klik &quot;Tambah Anak&quot; untuk mendaftarkan anak pertama</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {childToDelete && (
        <DeleteConfirmModal
          title="Hapus anak ini?"
          description={
            <>
              Data <span className="font-semibold">{childToDelete.nama}</span> dan seluruh riwayat scan-nya akan dihapus secara{' '}
              <span className="font-semibold text-red-600">permanen</span>.
            </>
          }
          onCancel={() => setChildDeleteId(null)}
          onConfirm={async () => {
            await deleteAnak(childToDelete.nik);
            setChildDeleteId(null);
            await loadData();
          }}
        />
      )}

      {showDeleteKeluarga && data && (
        <DeleteConfirmModal
          title="Apakah anda yakin ingin menghapusnya?"
          description={
            <>
              Data orang tua, alamat, seluruh anak, dan riwayat scan terkait akan dihapus secara{' '}
              <span className="font-semibold text-red-600">permanen</span>.
            </>
          }
          onCancel={() => setShowDeleteKeluarga(false)}
          onConfirm={async () => {
            await deleteKeluarga(noKk);
            router.push('/orang-tua');
          }}
        />
      )}

      {showAddChild && (
        <AddChildModal noKk={noKk} onClose={() => setShowAddChild(false)} onSuccess={async () => { setShowAddChild(false); await loadData(); }} />
      )}
    </Layout>
  );
}

function ParentProfileBlock({ label, orangTua }: { label: 'Ayah' | 'Ibu'; orangTua: OrangTua | null }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
      <div className="flex items-center gap-4 sm:block sm:shrink-0">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-[#E5F3F5] flex items-center justify-center text-[#397789] shrink-0">
          {orangTua?.foto_profil ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={orangTua.foto_profil} alt={orangTua.nama} className="w-full h-full object-cover" />
          ) : (
            <FiUser size={30} />
          )}
        </div>
        <div className="sm:hidden">
          <div className="text-xs font-semibold text-[#407A81] uppercase tracking-wide">{label}</div>
          <div className="text-lg font-bold text-gray-900">{orangTua?.nama || 'Belum diisi'}</div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="hidden sm:block mb-3">
          <div className="text-xs font-semibold text-[#407A81] uppercase tracking-wide">{label}</div>
          <div className="text-xl font-bold text-gray-900">{orangTua?.nama || 'Belum diisi'}</div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <div className="text-xs text-gray-500 mb-0.5">NIK</div>
            <div className="text-sm text-gray-800 font-medium">{orangTua?.nik || 'Tidak ada'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
              <FiPhone size={11} /> No Telepon
            </div>
            <div className="text-sm text-gray-800 font-medium">{orangTua?.no_hp || 'Tidak ada'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Tempat Lahir</div>
            <div className="text-sm text-gray-800 font-medium">{orangTua?.tempat_lahir || 'Tidak ada'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Tanggal Lahir</div>
            <div className="text-sm text-gray-800 font-medium">{formatTanggal(orangTua?.tanggal_lahir)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddChildModal({ noKk, onClose, onSuccess }: { noKk: string; onClose: () => void; onSuccess: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    nama: '',
    nik: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    gender: 'L' as 'L' | 'P',
    bb_lahir: '',
    tb_lahir: '',
    lk_lahir: '',
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!form.nama.trim() || !form.nik.trim() || !form.tanggal_lahir) {
      setSubmitError('Nama, NIK, dan Tanggal Lahir wajib diisi.');
      return;
    }

    const payload: NewAnakPayload = {
      nik: form.nik.trim(),
      no_kk: noKk,
      nama: form.nama.trim(),
      tempat_lahir: form.tempat_lahir.trim(),
      tanggal_lahir: form.tanggal_lahir,
      gender: form.gender,
      bb_lahir: form.bb_lahir ? parseFloat(form.bb_lahir) : undefined,
      tb_lahir: form.tb_lahir ? parseFloat(form.tb_lahir) : undefined,
      lk_lahir: form.lk_lahir ? parseFloat(form.lk_lahir) : undefined,
    };

    try {
      setSubmitting(true);
      await insertAnak(payload, photoFile || undefined);
      onSuccess();
    } catch (err) {
      console.error('Error saving anak:', err);
      setSubmitError(err instanceof Error ? err.message : 'Gagal menyimpan data anak.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex justify-center px-4 py-10 sm:py-16 overflow-y-auto">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !submitting && onClose()} />
      <div className="relative mx-auto bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-fit">
        <div className="sticky top-0 bg-white pt-6 pb-4 px-6 sm:px-8 border-b border-gray-100 rounded-t-2xl">
          <div className="text-center text-xl sm:text-2xl font-bold text-gray-900">Tambah Anak</div>
        </div>
        <div className="p-6 sm:p-8 pt-5">
          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{submitError}</div>
          )}

          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-[#E5F3F5] flex items-center justify-center text-[#397789]">
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreview} alt="foto anak" className="w-full h-full object-cover" />
                ) : (
                  <FiUser size={40} />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-[#407A81] rounded-full flex items-center justify-center hover:bg-[#326269] transition-colors"
              >
                <FiPlus className="text-white" size={16} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setPhotoFile(file);
                    setPhotoPreview(URL.createObjectURL(file));
                  }
                }}
              />
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Identitas Anak</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">NIK Anak</label>
                <input
                  type="text"
                  value={form.nik}
                  onChange={(e) => setForm((p) => ({ ...p, nik: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                  placeholder="3273xxxxxxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Nama Anak</label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm((p) => ({ ...p, nama: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                  placeholder="Nama lengkap"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Tempat Lahir</label>
                <input
                  type="text"
                  value={form.tempat_lahir}
                  onChange={(e) => setForm((p) => ({ ...p, tempat_lahir: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                  placeholder="Tasikmalaya"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Tanggal Lahir</label>
                <input
                  type="date"
                  value={form.tanggal_lahir}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setForm((p) => ({ ...p, tanggal_lahir: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 mb-1.5">Jenis Kelamin</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, gender: 'L' }))}
                    className={`py-2.5 rounded-lg font-medium text-sm transition-colors ${
                      form.gender === 'L' ? 'bg-[#407A81] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Laki-laki
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, gender: 'P' }))}
                    className={`py-2.5 rounded-lg font-medium text-sm transition-colors ${
                      form.gender === 'P' ? 'bg-[#407A81] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Perempuan
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Data Saat Lahir (Opsional)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Berat (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.bb_lahir}
                  onChange={(e) => setForm((p) => ({ ...p, bb_lahir: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                  placeholder="3.2"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Tinggi (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.tb_lahir}
                  onChange={(e) => setForm((p) => ({ ...p, tb_lahir: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                  placeholder="49"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Lingkar Kepala (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.lk_lahir}
                  onChange={(e) => setForm((p) => ({ ...p, lk_lahir: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                  placeholder="34"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-2.5 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 rounded-lg bg-[#407A81] text-white hover:bg-[#326269] font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Menyimpan...' : 'Tambah Anak'}
            </button>
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