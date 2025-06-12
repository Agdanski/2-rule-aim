import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/lib/supabase';

// Environment variables for Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

// Error handling for missing environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Create a Supabase client for browser usage
export const createBrowserClientInstance = () => {
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );
};

// Create a standard Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Create an admin client with service role key for server operations
// This should ONLY be used in server-side code, never exposed to the client
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);

// Helper function to get user data
export const getUserData = async (userId: string) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

// Helper function to check subscription status
export const checkSubscriptionStatus = async (userId: string) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data; // Returns true if subscription exists, false otherwise
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
};

// Export a singleton instance for client components
export const browserClient = createBrowserClientInstance();

export default supabase;
