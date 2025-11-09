import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>;
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
        .maybeSingle();

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
        // Handle specific signup errors
        if (error.message.includes('User already registered')) {
          throw new Error('This email is already registered. Please sign in instead.');
        } else if (error.message.includes('Invalid email')) {
          throw new Error('Please enter a valid email address.');
        } else if (error.message.includes('Password should be at least 6 characters')) {
          throw new Error('Password must be at least 6 characters long.');
        } else {
          throw new Error('Signup failed. Please try again.');
        }
      }
      
      console.log('✅ Auth successful! User ID:', data.user?.id);
      
      // Create user profile
      if (data.user) {
        const profileCreated = await ensureUserProfile(
          data.user.id, 
          data.user.email, 
          userData.firstName, 
          userData.lastName
        );
        
        if (!profileCreated) {
          console.warn('⚠️ Profile creation failed, but user was created');
        }
      }
    } catch (error) {
      console.error('❌ Complete signup error:', error);
      throw error;
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
      
      if (error) {
        // Handle specific error types
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email address before signing in.');
        } else if (error.message.includes('Invalid email')) {
          throw new Error('Please enter a valid email address.');
        } else {
          throw new Error('Login failed. Please try again.');
        }
      }

      // Ensure profile exists for this user
      if (data.user) {
        await ensureUserProfile(data.user.id, data.user.email);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
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