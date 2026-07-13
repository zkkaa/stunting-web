'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthUser, LoginCredentials } from '@/types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error parsing stored user:', error);
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
  }, []);

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('user')
        .select('id, name, username, email, no_hp, password')
        .eq('email', credentials.email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Email atau kata sandi salah.' };
        }
        console.error('Database error during sign in:', error);
        return { success: false, error: 'Terjadi kesalahan pada server. Silakan coba lagi.' };
      }

      if (!data) {
        return { success: false, error: 'Email atau kata sandi salah.' };
      }

      if (data.password !== credentials.password) {
        return { success: false, error: 'Email atau kata sandi salah.' };
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...userData } = data;
      const authUser: AuthUser = userData;

      setUser(authUser);
      localStorage.setItem('user', JSON.stringify(authUser));

      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'Terjadi kesalahan saat login.' };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update data user di context + localStorage tanpa perlu re-login,
  // dipakai setelah edit profil berhasil di halaman /profile.
  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signOut,
      updateUser,
    }),
    [user, loading, signIn, signOut, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};