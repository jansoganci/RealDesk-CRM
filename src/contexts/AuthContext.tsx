import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  demoMode: boolean;
  language: string;
  currency: string;
  setLanguage: (language: string) => void;
  setCurrency: (currency: string) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  enableDemoMode: () => void;
  exitDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [language, setLanguageState] = useState('en');
  const [currency, setCurrencyState] = useState('USD');

  useEffect(() => {
    const fetchSessionAndPreferences = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('language, currency')
          .eq('user_id', session.user.id)
          .single();
        if (preferences) {
          setLanguageState(preferences.language || 'en');
          setCurrencyState(preferences.currency || 'USD');
        }
      }
      setLoading(false);
    };

    fetchSessionAndPreferences();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setLanguageState('en');
        setCurrencyState('USD');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateUserPreferences = async (prefs: { language?: string; currency?: string }) => {
    if (!user) return;

    // First, try to update an existing row
    const { data, error } = await supabase
      .from('user_preferences')
      .update(prefs)
      .eq('user_id', user.id)
      .select()
      .single();

    // If the update didn't find a row (data is null) and there was no error, insert a new one.
    // A '404 Not Found' is not considered a fatal error by the client, so error will be null.
    if (!data && !error) {
      await supabase.from('user_preferences').insert({ ...prefs, user_id: user.id });
    }
  };

  const setLanguage = async (newLanguage: string) => {
    setLanguageState(newLanguage);
    await updateUserPreferences({ language: newLanguage });
  };

  const setCurrency = async (newCurrency: string) => {
    setCurrencyState(newCurrency);
    await updateUserPreferences({ currency: newCurrency });
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Also exit demo mode when signing out
    setDemoMode(false);
  };

  const enableDemoMode = () => {
    setDemoMode(true);
    setLoading(false);
    
    // Set global demo mode flag for service proxy
    (window as any).__DEMO_MODE__ = true;
    
    // Create a mock user object for demo mode
    const mockUser = {
      id: 'demo-user-id',
      email: 'demo@example.com',
      user_metadata: {
        full_name: 'Demo User'
      },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    } as User;
    
    setUser(mockUser);
  };

  const exitDemoMode = () => {
    setDemoMode(false);
    setUser(null);
    setSession(null);
    
    // Clear global demo mode flag
    (window as any).__DEMO_MODE__ = false;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, demoMode, language, currency, setLanguage, setCurrency, signIn, signUp, signOut, enableDemoMode, exitDemoMode }}>
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
