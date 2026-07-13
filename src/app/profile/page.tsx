'use client';

import React, { useState } from 'react';
import { Layout, ProtectedRoute } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { updateUserProfile, updateUserPassword } from '@/utils/database';
import { FiUser, FiLock, FiLogOut, FiEdit2, FiX, FiCheck, FiEye, FiEyeOff } from 'react-icons/fi';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-gray-400 font-medium text-xs mb-1 block">{label}</span>
      <div className="bg-[#F1F8F9] rounded-lg px-4 py-3">
        <span className="font-semibold text-gray-900 text-sm">{value}</span>
      </div>
    </div>
  );
}

function EditProfileModal({
  initialName,
  initialUsername,
  initialNoHp,
  onClose,
  onSaved,
}: {
  initialName: string;
  initialUsername: string;
  initialNoHp: string;
  onClose: () => void;
  onSaved: (data: { name: string; username: string; no_hp: string | null }) => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername);
  const [noHp, setNoHp] = useState(initialNoHp);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = name.trim().length > 0 && username.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isValid || saving) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        username: username.trim(),
        no_hp: noHp.trim() || null,
      };
      await updateUserProfile(user.id, payload);
      onSaved(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Edit Profil</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP</label>
            <input
              type="tel"
              value={noHp}
              onChange={(e) => setNoHp(e.target.value)}
              placeholder="Contoh: 081234567890"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-md hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!isValid || saving}
              className="flex-1 bg-[#407A81] text-white py-2.5 rounded-md hover:bg-[#326269] transition-colors font-medium disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isValid =
    currentPassword.length > 0 &&
    newPassword.length >= 6 &&
    newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isValid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await updateUserPassword(user.id, currentPassword, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah password.');
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Password Berhasil Diubah</h3>
          <p className="text-gray-600 mb-6 text-sm">Gunakan password baru untuk login berikutnya.</p>
          <button
            onClick={onClose}
            className="w-full bg-[#407A81] text-white py-3 rounded-xl hover:bg-[#326269] transition-colors font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Ubah Password</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password Lama</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
              required
            />
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-xs text-red-600 mt-1">Password baru tidak cocok.</p>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPasswords}
              onChange={() => setShowPasswords((v) => !v)}
              className="w-4 h-4"
              style={{ accentColor: '#407A81' }}
            />
            <span className="text-xs text-gray-600 inline-flex items-center gap-1">
              {showPasswords ? <FiEyeOff size={12} /> : <FiEye size={12} />}
              Tampilkan password
            </span>
          </label>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-md hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!isValid || saving}
              className="flex-1 bg-[#407A81] text-white py-2.5 rounded-md hover:bg-[#326269] transition-colors font-medium disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Ubah Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProfilePageContent() {
  const { user, signOut, updateUser } = useAuth();
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    signOut();
    router.push('/');
  };

  if (!user) return null;

  const initial = user.name?.trim()?.charAt(0)?.toUpperCase() || 'U';

  return (
    <Layout>
      <div className="min-h-screen relative overflow-x-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-60 z-0"
          style={{
            background: `radial-gradient(ellipse at center top, rgba(158, 202, 214, 0.6) 0%, rgba(158, 202, 214, 0.3) 30%, rgba(158, 202, 214, 0.1) 50%, transparent 70%)`,
          }}
        />

        <div className="relative z-10 py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div
              className="bg-white rounded-2xl p-6 sm:p-10"
              style={{ boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D' }}
            >
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Profil Saya</h1>

              {/* Identitas */}
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#E5F3F5] flex items-center justify-center text-[#397789] text-3xl font-bold mb-4">
                  {initial}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{user.name || 'Pengguna'}</h2>
                {user.username && <p className="text-gray-500 text-sm mt-0.5">@{user.username}</p>}
              </div>

              {/* Detail info */}
              <div className="space-y-4 mb-8">
                <InfoRow label="Email" value={user.email} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow label="Username" value={user.username || '-'} />
                  <InfoRow label="Nomor HP" value={user.no_hp || '-'} />
                </div>
              </div>

              {/* Aksi */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="w-full flex items-center justify-between px-5 py-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center shrink-0">
                      <FiUser className="w-5 h-5 text-teal-600" />
                    </span>
                    <span className="font-medium text-gray-900">Edit Profil</span>
                  </span>
                  <FiEdit2 className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full flex items-center justify-between px-5 py-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center shrink-0">
                      <FiLock className="w-5 h-5 text-teal-600" />
                    </span>
                    <span className="font-medium text-gray-900">Ubah Password</span>
                  </span>
                  <FiEdit2 className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="w-full flex items-center justify-between px-5 py-4 rounded-xl border border-gray-200 hover:bg-red-50 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                      <FiLogOut className="w-5 h-5 text-red-600" />
                    </span>
                    <span className="font-medium text-gray-900">Keluar Akun</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditProfileModal
          initialName={user.name || ''}
          initialUsername={user.username || ''}
          initialNoHp={user.no_hp || ''}
          onClose={() => setShowEditModal(false)}
          onSaved={(data) => {
            updateUser(data);
            setShowEditModal(false);
          }}
        />
      )}

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}

      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiLogOut className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Keluar dari akun?</h3>
            <p className="text-gray-600 mb-6 text-sm">Kamu perlu login kembali untuk mengakses fitur ini.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 transition-colors font-semibold"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}