'use client';

import React, { useState, Suspense } from 'react';
import { Layout } from '@/components';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn({ email, password });

    if (result.success) {
      // Redirect to the page that was requested, or home if none
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    } else {
      setError(result.error || 'Terjadi kesalahan saat login');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <div className="relative z-20 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md -mt-18 md:-mt-18">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8" style={{ boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D' }}>
            <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-2">Masuk</h1>
            <p className="text-center text-gray-600 mb-6">Silakan login untuk melanjutkan</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kata Sandi</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#407A81] focus:border-transparent outline-none pr-12"
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-0 px-3 text-[#407A81]">
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#407A81] text-white py-3 rounded-lg hover:bg-[#326269] transition-colors font-semibold disabled:opacity-50">
                {loading ? 'Memproses...' : 'Masuk'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Layout>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-600">Memuat...</div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </Layout>
  );
}


