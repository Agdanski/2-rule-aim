'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

// Define the context type
type SupabaseContextType = {
  supabase: ReturnType<typeof createClient>;
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: any | null;
    data: { user: User | null; session: Session | null } | null;
  }>;
  signUp: (email: string, password: string, metadata?: object) => Promise<{
    error: any | null;
    data: { user: User | null; session: Session | null } | null;
  }>;
  signOut: () => Promise<{ error: any | null }>;
  resetPassword: (email: string) => Promise<{ error: any | null }>;
  updatePassword: (password: string) => Promise<{ error: any | null }>;
};

// Create the context with a default value
const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

// Provider props type
interface SupabaseProviderProps {
  children: ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  // Create the Supabase client
  const supabase = createClient();
  const router = useRouter();

  // State for session and loading
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session on mount
  useEffect(() => {
    const getSession = async () => {
      setIsLoading(true);
      try {
        // Get the current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user || null);

        // Set up auth state change listener
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          async (event: AuthChangeEvent, currentSession: Session | null) => {
            setSession(currentSession);
            setUser(currentSession?.user || null);
            
            // Force a router refresh to update server components
            router.refresh();
            
            // Handle specific auth events
            if (event === 'SIGNED_IN') {
              // Check if user needs to see medical disclaimer
              if (currentSession?.user) {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('last_disclaimer_shown, disclaimer_dont_show')
                  .eq('id', currentSession.user.id)
                  .single();
                
                const now = new Date();
                const lastShown = profile?.last_disclaimer_shown 
                  ? new Date(profile.last_disclaimer_shown) 
                  : null;
                
                // Show disclaimer if never shown or last shown more than 30 days ago
                const showDisclaimer = !lastShown || 
                  !profile?.disclaimer_dont_show || 
                  now.getTime() - lastShown.getTime() > 30 * 24 * 60 * 60 * 1000;
                
                if (showDisclaimer) {
                  router.push('/disclaimer');
                } else {
                  router.push('/dashboard');
                }
              }
            } else if (event === 'SIGNED_OUT') {
              router.push('/');
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();
  }, [router, supabase]);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: result.error, data: result.data };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error, data: null };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, metadata?: object) => {
    try {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: metadata,
        },
      });
      return { error: result.error, data: result.data };
    } catch (error) {
      console.error('Error signing up:', error);
      return { error, data: null };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error };
    }
  };

  // Reset password (sends reset email)
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { error };
    }
  };

  // Update password
  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      return { error };
    } catch (error) {
      console.error('Error updating password:', error);
      return { error };
    }
  };

  // Create the value for the context
  const value: SupabaseContextType = {
    supabase,
    session,
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

// Custom hook to use the Supabase context
export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}
