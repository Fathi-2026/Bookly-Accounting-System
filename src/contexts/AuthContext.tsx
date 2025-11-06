import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: { firstName: string; lastName: string; email: string; password: string }) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to create or ensure user profile exists
  const ensureUserProfile = async (userId: string, userEmail: string | undefined, firstName?: string, lastName?: string) => {
    try {
      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle to avoid throwing error if no profile

      if (checkError) {
        console.error('Error checking profile:', checkError);
        return false;
      }

      if (!existingProfile) {
        console.log('Creating missing profile for user:', userId);
        
        const profileData = { 
          id: userId, 
          first_name: firstName || 'User',
          last_name: lastName || 'Account', 
          email: userEmail || 'unknown@example.com'
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([profileData]);

        if (profileError) {
          console.error('Failed to create profile:', profileError);
          return false;
        }

        console.log('Profile created successfully for user:', userId);
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('Error ensuring user profile:', error);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          setUser(session?.user ?? null);
          setIsLoading(false);
        }

        // Ensure profile exists but don't block the initial render
        if (session?.user) {
          ensureUserProfile(session.user.id, session.user.email).catch(console.error);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }

      // Ensure profile exists for new signups/logins
      if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        ensureUserProfile(session.user.id, session.user.email).catch(console.error);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (userData: { firstName: string; lastName: string; email: string; password: string }) => {
    setIsLoading(true);
    try {
      console.log('🔍 Starting signup for:', userData.email);
      
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (error) {
        console.error('❌ Auth error:', error);
        throw error;
      }
      
      console.log('✅ Auth successful! User ID:', data.user?.id);
      
      // Create user profile
      if (data.user) {
        await ensureUserProfile(
          data.user.id, 
          data.user.email, 
          userData.firstName, 
          userData.lastName
        );
      }

      return true;
    } catch (error) {
      console.error('❌ Complete signup error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;

      // Ensure profile exists for this user (non-blocking)
      if (data.user) {
        ensureUserProfile(data.user.id, data.user.email).catch(console.error);
      }

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login: signIn, 
      signup: signUp, 
      logout, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};