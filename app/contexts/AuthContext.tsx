'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  avatar_url?: string; // FIXED: avatar_url bukan avatar
  bio?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get Supabase client
const getSupabase = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = 'https://mfymrinerlgzygnoimve.supabase.co';
    const supabaseKey = 'sb_publishable_nECRhfJNuXfovy-0-V5Crg_NUCRSZic';
    
    return createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user from localStorage on init
  useEffect(() => {
    const savedUser = localStorage.getItem('seija_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('seija_user');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const supabase = getSupabase();
    if (!supabase) {
      setError('Authentication service unavailable');
      return false;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Login attempt:', email);
      
      // 1. Find user by email
      const { data: users, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim())
        .limit(1);
      
      if (fetchError) {
        console.error('Fetch error:', fetchError);
        setError('Login failed');
        setIsLoading(false);
        return false;
      }
      
      if (!users || users.length === 0) {
        setError('User not found');
        setIsLoading(false);
        return false;
      }
      
      const userData = users[0];
      
      // 2. Simple password check for development
      if (password.length === 0) {
        setError('Password required');
        setIsLoading(false);
        return false;
      }
      
      // 3. Set user
      const userProfile: User = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role || 'user',
        avatar_url: userData.avatar_url,
        bio: userData.bio,
        created_at: userData.created_at
      };
      
      setUser(userProfile);
      localStorage.setItem('seija_user', JSON.stringify(userProfile));
      
      console.log('✅ Login successful:', userProfile.username);
      setIsLoading(false);
      return true;
      
    } catch (error: any) {
      console.error('Login exception:', error);
      setError('Login failed. Please try again.');
      setIsLoading(false);
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    const supabase = getSupabase();
    if (!supabase) {
      setError('Authentication service unavailable');
      return false;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Registration:', { username, email });
      
      // Validation
      if (username.length < 3) {
        setError('Username must be at least 3 characters');
        setIsLoading(false);
        return false;
      }
      
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setIsLoading(false);
        return false;
      }
      
      if (!email.includes('@')) {
        setError('Invalid email address');
        setIsLoading(false);
        return false;
      }
      
      // 1. Check if user already exists
      const { data: existingUsers } = await supabase
        .from('users')
        .select('id')
        .or(`email.eq.${email},username.eq.${username}`);
      
      if (existingUsers && existingUsers.length > 0) {
        setError('User with this email or username already exists');
        setIsLoading(false);
        return false;
      }
      
      // 2. Create user in database
      const newUser: any = {
        username: username.trim(),
        email: email.trim(),
        password_hash: password,
        role: 'user',
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(username.trim())}&background=random`
      };
      
      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();
      
      if (insertError) {
        console.error('Insert error:', insertError);
        setError('Registration failed: ' + insertError.message);
        setIsLoading(false);
        return false;
      }
      
      console.log('✅ User created in database');
      setIsLoading(false);
      return true;
      
    } catch (error: any) {
      console.error('Registration exception:', error);
      setError('Registration failed. Please try again.');
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    console.log('👋 Logging out');
    setUser(null);
    localStorage.removeItem('seija_user');
    
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }, 100);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('seija_user', JSON.stringify(updatedUser));
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    updateUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}