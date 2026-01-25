'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
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

// Helper to get Supabase client (only on client-side)
const getSupabaseClient = () => {
  if (typeof window === 'undefined') {
    return null; // Server-side
  }

  const supabaseUrl = 'https://mfymrinerlgzygnoimve.supabase.co';
  const supabaseKey = 'sb_publishable_nECRhfJNuXfovy-0-V5Crg_NUCRSZic';

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials missing');
    return null;
  }

  // Dynamically import to avoid server-side issues
  const { createClient } = require('@supabase/supabase-js');
  return createClient(supabaseUrl, supabaseKey);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase, setSupabase] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Supabase on client-side
  useEffect(() => {
    const client = getSupabaseClient();
    setSupabase(client);
    
    if (client) {
      checkAuth(client);
    } else {
      setIsLoading(false);
    }
  }, []);

  const checkAuth = async (client: any) => {
    try {
      const { data: { session } } = await client.auth.getSession();
      
      if (session?.user) {
        const { data: userData } = await client
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (userData) {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!supabase) {
      setError('Auth service not available');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔐 Login attempt:', email);
      
      // 1. Login dengan Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('❌ Auth error:', authError.message);
        setError(authError.message);
        return false;
      }

      if (!data?.user) {
        setError('No user data returned');
        return false;
      }

      console.log('✅ Auth successful, user ID:', data.user.id);
      
      // 2. Try to get user profile
      let userData = null;
      try {
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        userData = profileData;
      } catch (profileErr) {
        console.log('Profile fetch error:', profileErr);
      }
      
      // 3. If no profile found, create one
      if (!userData) {
        console.log('🔄 Creating user profile...');
        const username = data.user.email?.split('@')[0] || 'user';
        
        await supabase
          .from('users')
          .insert({
            id: data.user.id,
            username,
            email: data.user.email!,
            role: 'user',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`,
            created_at: new Date().toISOString()
          })
          .then(() => console.log('✅ Profile created'))
          .catch((err: any) => console.log('Profile insert error (might exist):', err.message));
        
        // Fetch after creation
        const { data: newData } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        userData = newData;
      }
      
      // 4. Set user state
      if (userData) {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        // Basic user from auth data
        const basicUser = {
          id: data.user.id,
          username: data.user.email?.split('@')[0] || 'user',
          email: data.user.email!,
          role: 'user' as const,
          created_at: new Date().toISOString()
        };
        setUser(basicUser);
        localStorage.setItem('user', JSON.stringify(basicUser));
      }
      
      console.log('✅ Login successful!');
      return true;
      
    } catch (error: any) {
      console.error('❌ Login error:', error);
      setError('Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    if (!supabase) {
      setError('Auth service not available');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('📝 Registration attempt:', { username, email });
      
      // Check if user exists
      const { data: existingUsers } = await supabase
        .from('users')
        .select('id')
        .or(`email.eq.${email},username.eq.${username}`);
      
      if (existingUsers && existingUsers.length > 0) {
        setError('User with this email or username already exists');
        return false;
      }
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      });
      
      if (authError) {
        console.error('❌ Auth error:', authError);
        setError(authError.message);
        return false;
      }
      
      if (!authData.user) {
        setError('User creation failed');
        return false;
      }
      
      console.log('✅ Auth user created:', authData.user.id);
      
      // Create profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          username,
          email,
          role: 'user',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`,
          created_at: new Date().toISOString()
        });
      
      if (profileError) {
        console.error('❌ Profile error:', profileError);
        setError('Profile creation failed');
        return false;
      }
      
      console.log('✅ Profile created');
      
      // Auto login
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (loginError) {
        console.warn('⚠️ Auto login failed:', loginError.message);
        setError('Registration successful! Please login manually.');
        return true;
      }
      
      // Get user data
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (userData) {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
      console.log('✅ Registration complete! User logged in.');
      return true;
      
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      setError('Registration failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('user');
    console.log('👋 User logged out');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Listen for auth state changes
  useEffect(() => {
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        if (session?.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (userData) {
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } else {
          setUser(null);
          localStorage.removeItem('user');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

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