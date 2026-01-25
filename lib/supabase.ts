import { createClient } from '@supabase/supabase-js';

// Hardcoded values untuk frontend
const supabaseUrl = 'https://mfymrinerlgzygnoimve.supabase.co';
const supabaseKey = 'sb_publishable_nECRhfJNuXfovy-0-V5Crg_NUCRSZic';

// Client hanya di client-side
export const supabase = typeof window !== 'undefined' 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const getSupabaseClient = () => {
  if (typeof window === 'undefined') return null;
  return supabase;
};