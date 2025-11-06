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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (userData: { firstName: string; lastName: string; email: string; password: string }) => {
    setIsLoading(true);
    try {
      console.log('🔍 STEP 1: Starting signup for:', userData.email);
      
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (error) {
        console.error('❌ STEP 2: Auth error:', error);
        throw error;
      }
      
      console.log('✅ STEP 3: Auth successful! User ID:', data.user?.id);
      
      // Create user profile in your profiles table
      if (data.user) {
        console.log('🔍 STEP 4: Attempting to create profile...');
        
        const profileData = { 
          id: data.user.id, 
          first_name: userData.firstName, 
          last_name: userData.lastName,
          email: userData.email
        };
        
        console.log('📝 STEP 5: Profile data:', profileData);

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([profileData]);

        if (profileError) {
          console.error('❌ STEP 6: Profile creation FAILED:', profileError);
          console.error('❌ Error message:', profileError.message);
          console.error('❌ Error details:', profileError.details);
          console.error('❌ Error hint:', profileError.hint);
          
          // Don't throw error - continue with signup even if profile fails
          console.log('⚠️ Continuing signup without profile...');
        } else {
          console.log('✅ STEP 7: Profile created SUCCESSFULLY!');
        }

        // Verify the profile was created regardless of errors
        const { data: verifyProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        console.log('🔍 STEP 8: Profile verification:', verifyProfile ? 'SUCCESS' : 'FAILED');
      }

      return true;
    } catch (error) {
      console.error('❌ FINAL ERROR:', error);
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