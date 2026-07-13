'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileButtonProps {
  className?: string;
}

const ProfileButton: React.FC<ProfileButtonProps> = ({ className = '' }) => {
  const { user } = useAuth();

  const displayName = user?.name || 'Profile';
  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || 'U';

  return (
    <Link
      href="/profile"
      className={`flex items-center gap-2 bg-[#407A81] text-white px-4 py-2 rounded-full hover:bg-[#326269] transition-colors duration-200 cursor-pointer ${className}`}
    >
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
        <span className="text-sm font-semibold text-white">{initial}</span>
      </div>
      <span className="font-medium">{displayName}</span>
    </Link>
  );
};

export default ProfileButton;