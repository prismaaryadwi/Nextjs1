// app/lib/auth-helper.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_KEY!;
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
  avatar_url?: string;
}

export const validateToken = (token: string | null): AuthUser | null => {
  try {
    if (!token) return null;
    const user = JSON.parse(token);
    if (!user.id || !user.username || !user.email) {
      return null;
    }
    return user;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
};

export const authenticate = async (authHeader: string | undefined): Promise<AuthUser | null> => {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.replace('Bearer ', '');
    const user = validateToken(token);
    
    if (!user) {
      return null;
    }
    
    // Verify user exists in database
    const { data: dbUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error || !dbUser) {
      return null;
    }
    
    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      role: dbUser.role || 'user',
      avatar_url: dbUser.avatar_url
    };
    
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
};

export const adminOnly = (user: AuthUser | null): boolean => {
  return user?.role === 'admin';
};

export const calculateReadTime = (content: string): number => {
  const words = content.trim().split(/\s+/).length;
  const wordsPerMinute = 200;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
};