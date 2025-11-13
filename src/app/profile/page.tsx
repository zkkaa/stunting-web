'use client';

import React from 'react';
import Layout from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ProfileImageUpload from '@/components/ui/ProfileImageUpload';

function ProfilePageContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    signOut();
    router.push('/');
  };

  // if (loading) {
  //   return (
  //     <Layout>
  //       <div className="min-h-screen flex items-center justify-center">
  //         <div className="text-center">
  //           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#407A81] mx-auto mb-4"></div>
  //           <p className="text-gray-600">Loading...</p>
  //         </div>
  //       </div>
  //     </Layout>
  //   );
  // }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <main className="relative">
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
            className="absolute bottom-0 right-0 w-[500px] h-[500px] z-0"
            style={{
              background: `linear-gradient(151.12deg, #FFFFFF 53.4%, #9ECAD6 172.54%)`
            }}
          />
          
          {/* Content */}
          <div className="relative z-20 pt-16 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl p-12 profile-card-shadow min-h-[600px]">
                {/* Header */}
                <div className="text-left mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
                </div>
                
                {/* Profile Section */}
                <div className="text-center mb-12">
                  {/* Profile Image Upload */}
                  <div className="mb-8">
                    <ProfileImageUpload currentImageUrl={user.profile_image} />
                  </div>
                  
                  {/* Name */}
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    {user.name || 'User'}
                  </h2>
                  {user.username && (
                    <p className="text-gray-600 mb-2">@{user.username}</p>
                  )}
                  <p className="text-gray-600 mb-2">{user.email}</p>
                  {user.no_hp && (
                    <p className="text-gray-600 mb-12">{user.no_hp}</p>
                  )}
                </div>
                
                {/* Menu Items */}
                <div className="space-y-6 max-w-4xl mx-auto">
                  {/* Privacy & Security */}
                  <div className="bg-white rounded-2xl p-6 profile-card-shadow hover:bg-gray-50 transition-colors cursor-pointer" style={{ height: '68px' }}>
                    <div className="flex items-center justify-between h-full">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <span className="text-gray-900 font-medium text-lg">Privacy & Security</span>
                      </div>
                      <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Logout Account */}
                  <div 
                    className="bg-white rounded-2xl p-6 profile-card-shadow hover:bg-gray-50 transition-colors cursor-pointer" 
                    style={{ height: '68px' }}
                    onClick={handleLogout}
                  >
                    <div className="flex items-center justify-between h-full">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        <span className="text-gray-900 font-medium text-lg">Logout Account</span>
                      </div>
                      <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
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
