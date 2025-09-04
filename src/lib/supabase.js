import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Only throw error in development if variables are missing
if (import.meta.env.DEV && (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY)) {
  console.warn('Missing Supabase environment variables. Using placeholder values for build.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Database table names (for consistency)
export const TABLES = {
  USERS: 'users',
  AD_CAMPAIGNS: 'ad_campaigns',
  AD_CREATIVE_VARIATIONS: 'ad_creative_variations',
  TEST_ACCOUNTS: 'test_accounts',
  PAYMENT_TRANSACTIONS: 'payment_transactions',
  ANALYTICS_EVENTS: 'analytics_events'
};

// Helper function to handle Supabase errors
export const handleSupabaseError = (error, context = '') => {
  console.error(`Supabase error ${context}:`, error);
  
  if (error?.code === 'PGRST301') {
    throw new Error('Unauthorized access. Please log in again.');
  }
  
  if (error?.code === 'PGRST116') {
    throw new Error('Resource not found.');
  }
  
  if (error?.code === '23505') {
    throw new Error('This record already exists.');
  }
  
  if (error?.code === '23503') {
    throw new Error('Invalid reference. Please check your data.');
  }
  
  throw new Error(error?.message || 'An unexpected error occurred.');
};

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) handleSupabaseError(error, 'getting current user');
  return user;
};

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const user = await getCurrentUser();
  return !!user;
};

export default supabase;
