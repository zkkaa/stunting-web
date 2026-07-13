'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiAlertTriangle } from 'react-icons/fi';

interface NavigationGuardContextType {
  setDirty: (dirty: boolean) => void;
  guardedPush: (href: string) => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextType | undefined>(undefined);

export function useNavigationGuard() {
  const ctx = useContext(NavigationGuardContext);
  if (!ctx) throw new Error('useNavigationGuard must be used within NavigationGuardProvider');
  return ctx;
}

/**
 * Hook untuk dipakai di halaman form. Daftarkan status "dirty" (ada perubahan
 * belum disimpan) supaya navigasi internal (Link/navbar) dicegat dan menampilkan
 * konfirmasi. Otomatis reset saat komponen unmount.
 */
export function useUnsavedChanges(isDirty: boolean) {
  const { setDirty } = useNavigationGuard();
  useEffect(() => {
    setDirty(isDirty);
  }, [isDirty, setDirty]);

  useEffect(() => {
    return () => setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function NavigationGuardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isDirtyRef = useRef(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const setDirty = useCallback((dirty: boolean) => {
    isDirtyRef.current = dirty;
  }, []);

  const guardedPush = useCallback((href: string) => {
    if (isDirtyRef.current) {
      setPendingHref(href);
    } else {
      router.push(href);
    }
  }, [router]);

  // Refresh / tutup tab - dialog bawaan browser
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Cegat semua klik link internal (Link, navbar, breadcrumb) selama form dirty
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!isDirtyRef.current) return;

      const anchor = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('/')) return; // hanya cegat link internal
      if (e.ctrlKey || e.metaKey || e.shiftKey) return; // biarkan buka tab baru dst.

      e.preventDefault();
      setPendingHref(href);
    };

    document.addEventListener('click', handleClick, true); // capture phase, sebelum Link menangani
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  const handleConfirmLeave = () => {
    isDirtyRef.current = false;
    if (pendingHref) {
      router.push(pendingHref);
    }
    setPendingHref(null);
  };

  return (
    <NavigationGuardContext.Provider value={{ setDirty, guardedPush }}>
      {children}

      {pendingHref && (
        <div className="fixed inset-0 z-200 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPendingHref(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-7">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
                <FiAlertTriangle className="text-amber-500" size={28} />
              </div>
            </div>
            <div className="text-center text-lg font-semibold text-gray-900 mb-2">Perubahan belum disimpan</div>
            <div className="text-center text-sm text-gray-600 mb-6">
              Anda memiliki perubahan yang belum disimpan. Jika keluar sekarang, perubahan tersebut akan hilang.
            </div>
            <div className="space-y-3">
              <button
                onClick={handleConfirmLeave}
                className="w-full px-4 py-2.5 rounded-full bg-red-600 text-white hover:bg-red-700 text-sm font-medium transition-colors"
              >
                Tinggalkan Halaman
              </button>
              <button
                onClick={() => setPendingHref(null)}
                className="w-full px-4 py-2.5 rounded-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                Tetap di Halaman Ini
              </button>
            </div>
          </div>
        </div>
      )}
    </NavigationGuardContext.Provider>
  );
}