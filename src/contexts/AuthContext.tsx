'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthUser, LoginCredentials } from '@/types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
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
        .select('id, name, username, email, no_hp, password, profile_image')
        .eq('email', credentials.email)
        .single();

      if (error) {
        // PGRST116 = no rows found, bukan error server
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Email atau kata sandi salah.' };
        }
        console.error('Database error during sign in:', error);
        return { success: false, error: 'Terjadi kesalahan pada server. Silakan coba lagi.' };
      }

      if (!data) {
        return { success: false, error: 'Email atau kata sandi salah.' };
      }

      // TODO: password saat ini masih dibandingkan sebagai plaintext.
      // Sebelum production, ganti dengan bcrypt.compare() setelah proses
      // hashing password diterapkan di alur pendaftaran user.
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

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signOut,
    }),
    [user, loading, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};