'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthUser, LoginCredentials } from '@/types/user';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  updateProfileImage: (imageUrl: string) => Promise<{ success: boolean; error?: string }>;
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
    // Only run once on mount
    if (isInitialized.current) return;
    isInitialized.current = true;
    
    // Check if user is stored in localStorage
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

  const updateProfileImage = useCallback(async (imageUrl: string) => {
    if (!user) {
      return { success: false, error: 'User not logged in' };
    }

    try {
      // Update profile image in database
      const { error } = await supabase
        .from('User')
        .update({ profile_image: imageUrl })
        .eq('id', user.id);

      if (error) {
        console.error('Update error:', error);
        return { success: false, error: 'Failed to update profile image' };
      }

      // Update local state
      const updatedUser = { ...user, profile_image: imageUrl };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      return { success: true };
    } catch (error) {
      console.error('Update error:', error);
      return { success: false, error: 'An error occurred while updating profile image' };
    }
  }, [user]);

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    console.log(credentials);
    try {
      setLoading(true);
       
      console.log('Attempting login with:', credentials.email);
      
      // Query user from database
      const { data, error } = await supabase
        .from('User')
        .select('id, name, username, email, no_hp, password, profile_image')
        .eq('email', credentials.email)
        .single();

      console.log('Query result:', { data, error });

      if (error) {
        console.error('Database error:', error);
        return { success: false, error: `Database error: ${error.message}` };
      }

      if (!data) {
        console.log('No data returned for email:', credentials.email);
        return { success: false, error: 'User not found' };
      }

      console.log('User found:', data);

      // Simple password comparison (in production, use proper hashing)
      if (data.password !== credentials.password) {
        console.log('Password mismatch');
        return { success: false, error: 'Invalid credentials' };
      }

      // Remove password from user data
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userData } = data;
      const authUser: AuthUser = userData;

      // Store user in state and localStorage
      setUser(authUser);
      localStorage.setItem('user', JSON.stringify(authUser));

      console.log('Login successful:', authUser);
      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'An error occurred during sign in' };
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    signIn,
    signOut,
    updateProfileImage,
  }), [user, loading, signIn, signOut, updateProfileImage]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
