'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ProfileButton from '../ui/ProfileButton';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  label: string;
  href: string;
}

interface NavbarProps {
  logo?: string;
  navItems?: NavItem[];
  className?: string;
}

const publicNavItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Scan', href: '/scan-publik' }, 
  { label: 'Konsultasi', href: '/konsultasi' },
];

const privateNavItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Orang Tua', href: '/orang-tua' }, 
  { label: 'Anak', href: '/anak' },
  { label: 'Scan', href: '/scan' },
  { label: 'History', href: '/history' },
  { label: 'Konsultasi', href: '/konsultasi' },
];

const Navbar: React.FC<NavbarProps> = ({
  logo = 'Stunting',
  navItems,
  className = '',
}) => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  
  // Use appropriate nav items based on auth status
  const currentNavItems = navItems || (user ? privateNavItems : publicNavItems);

  const isActiveLink = (href: string) => {
    if (!pathname) return false;
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav 
      className={`bg-[#EFFFFE] px-4 sm:px-6 lg:px-8 relative z-50 table-shadow ${className}`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="shrink-0">
            <Link href="/" className="text-2xl font-bold text-(--color-primary)">
              {logo}
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="hidden sm:block">
            <div className="flex space-x-8">
              {currentNavItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    isActiveLink(item.href)
                      ? 'text-(--color-primary) border-b-2 border-(--color-primary)'
                      : 'text-gray-600 hover:text-(--color-primary)'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Login Button or Profile Button - Hidden on mobile */}
          <div className="hidden sm:flex shrink-0">
            {loading ? (
              <div className="px-4 py-2 text-sm font-medium text-gray-500">
                Loading...
              </div>
            ) : user ? (
              <ProfileButton />
            ) : (
              <Link href="/login" className="px-4 py-2 rounded-md bg-[#407A81] text-white hover:bg-[#326269] text-sm font-medium">
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="text-gray-600 hover:text-(--color-primary) focus:outline-none focus:ring-2 focus:ring-(--color-primary) p-2 cursor-pointer"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-[#EFFFFE] border-t border-gray-200">
              {currentNavItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={`block px-3 py-2 text-base font-medium transition-colors duration-200 ${
                    isActiveLink(item.href)
                      ? 'text-(--color-primary) bg-gray-100'
                      : 'text-gray-600 hover:text-(--color-primary) hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Login/Profile in Mobile Menu */}
              <div className="pt-4 border-t border-gray-200">
                <div className="px-3 py-2">
                  {loading ? (
                    <div className="block w-full text-center px-4 py-2 text-base font-medium text-gray-500">
                      Loading...
                    </div>
                  ) : user ? (
                    <Link href="/profile" onClick={closeMobileMenu} className="block w-full text-center px-4 py-2 rounded-md bg-[#407A81] text-white hover:bg-[#326269] text-base font-medium">
                      Profile
                    </Link>
                  ) : (
                    <Link href="/login" onClick={closeMobileMenu} className="block w-full text-center px-4 py-2 rounded-md bg-[#407A81] text-white hover:bg-[#326269] text-base font-medium">
                      Login
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
