import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import i18n from '../i18n';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  language: string;
  currency: string;
  meetingReminderMinutes: number;
  commissionRate: number;
  setLanguage: (language: string) => void;
  setCurrency: (currency: string) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguageState] = useState('tr');
  const [currency, setCurrencyState] = useState('TRY');
  const [meetingReminderMinutes, setMeetingReminderMinutesState] = useState(30);
  const [commissionRate, setCommissionRateState] = useState(4.0);
  const ensuredUserPreferencesFor = useRef<string | null>(null);

  // Sync i18n with language state changes
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  useEffect(() => {
    const fetchSessionAndPreferences = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('language, currency, meeting_reminder_minutes, commission_rate')
          .eq('user_id', session.user.id)
          .maybeSingle();
        if (preferences) {
          setLanguageState(preferences.language || 'tr');
          setCurrencyState(preferences.currency || 'TRY');
          setMeetingReminderMinutesState(preferences.meeting_reminder_minutes || 30);
          setCommissionRateState(preferences.commission_rate || 4.0);
        }
      }
      setLoading(false);
    };

    fetchSessionAndPreferences();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setLanguageState('tr');
        setCurrencyState('TRY');
        setMeetingReminderMinutesState(30);
        setCommissionRateState(4.0);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const ensureUserPreferences = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;

      if (!currentUserId) {
        return;
      }

      if (ensuredUserPreferencesFor.current === currentUserId) {
        return;
      }

      await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: currentUserId,
            language: 'tr',
            currency: 'TRY',
          },
          {
            onConflict: 'user_id',
            ignoreDuplicates: true,
          }
        );

      ensuredUserPreferencesFor.current = currentUserId;
    };

    ensureUserPreferences();
  }, [user?.id]);

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

    ensuredUserPreferencesFor.current = null;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, language, currency, meetingReminderMinutes, commissionRate, setLanguage, setCurrency, signIn, signUp, signOut, resetPassword, updatePassword }}>
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
