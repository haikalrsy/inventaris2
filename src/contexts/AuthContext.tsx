import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { isAdmin as checkIsAdmin } from '../config';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
  isSiswa: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userData: User) => {
    setLoading(true);
    // Safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 10000);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.id)
        .single();
      
      if (error) {
        console.log('Profile not found, creating one...');
        const role = checkIsAdmin(userData.email) ? 'admin' : 'siswa';
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .upsert({
            id: userData.id,
            full_name: userData.user_metadata?.full_name || 'User',
            role: role
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating profile:', createError);
          setLoading(false);
        } else {
          setProfile(newProfile);
        }
      } else {
        if (checkIsAdmin(userData.email) && data.role !== 'admin') {
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', userData.id)
            .select()
            .single();
          
          if (updateError) {
            console.error('Error promoting role:', updateError);
            setProfile(data);
          } else {
            setProfile(updatedProfile);
          }
        } else {
          setProfile(data);
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Clear local states first to provide immediate UI feedback
      setUser(null);
      setProfile(null);
      setLoading(false);
      
      // Attempt supabase sign out
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Final fallback to ensure state is dead
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/app',
          skipBrowserRedirect: true
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Use a popup for Google login to avoid redirect issues in iframes
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
          data.url,
          'google-login',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        if (!popup) {
          throw new Error('Popup blocked! Please allow popups for login.');
        }

        // The onAuthStateChange listener in useEffect will handle the session once the popup finishes the flow
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) throw error;

    if (data.user) {
      const finalRole = checkIsAdmin(email) ? 'admin' : role;
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          full_name: fullName,
          role: finalRole,
        });
      
      if (profileError) throw profileError;
    }
  };

  const isAdminFromConfig = checkIsAdmin(user?.email);
  const isAdminState = profile?.role === 'admin' || isAdminFromConfig;
  const isSiswa = profile?.role === 'siswa' && !isAdminFromConfig;

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin: isAdminState, isSiswa, signOut, signInWithGoogle, signUp }}>
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
