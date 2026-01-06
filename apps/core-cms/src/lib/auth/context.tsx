'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createBrowserClient as createClient } from '@smartnews/database';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[Auth] Initializing...');
    // Create client inside useEffect to ensure it runs only on client side
    const supabase = createClient();

    const fetchProfile = async (userId: string) => {
      try {
        console.log('[Auth] Fetching profile for:', userId);

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<null>((resolve) => {
          setTimeout(() => {
            console.warn('[Auth] Profile fetch is taking longer than expected, will retry...');
            resolve(null);
          }, 5000);
        });

        const fetchPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .is('deleted_at', null)
          .single();

        const result = await Promise.race([fetchPromise, timeoutPromise]);

        if (result === null) {
          // Timeout occurred, but don't throw - just return and let another event retry
          return;
        }

        const { data, error } = result;

        if (error) throw error;
        console.log('[Auth] Profile loaded successfully');
        setProfile(data);
      } catch (error) {
        console.error('[Auth] Error fetching profile:', error);
        setProfile(null);
      }
    };

    // Set up auth state listener - this will handle initial session
    console.log('[Auth] Setting up listener...');
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Event:', event, 'User:', session?.user?.id || 'none');
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }

      // Stop loading after handling initial session
      console.log('[Auth] Loading complete');
      setLoading(false);
    });

    // Trigger getSession to emit initial INITIAL_SESSION event
    console.log('[Auth] Triggering getSession...');
    supabase.auth.getSession();

    return () => {
      console.log('[Auth] Cleanup');
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .is('deleted_at', null)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    }
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signOut, refreshProfile }}
    >
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
