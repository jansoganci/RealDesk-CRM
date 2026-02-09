import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import i18n from '../i18n';
import { trackLogin } from '../utils/gtm';
import { getDetectedLanguage, getDetectedCurrency, SupportedLanguage, SupportedCurrency } from '../lib/localeDetection';
import { createLogger } from '../lib/logger';

const authLogger = createLogger('Auth');

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  language: string;
  currency: string;
  meetingReminderMinutes: number;
  commissionRate: number;
  fullName: string;
  phoneNumber: string | null;
  setLanguage: (language: string) => void;
  setCurrency: (currency: string) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ requiresEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  changeEmail: (newEmail: string) => Promise<{ success: boolean; error?: string }>;
  reauthenticate: (password: string) => Promise<{ success: boolean; error?: string }>;
  resendConfirmationEmail: (email: string) => Promise<void>;
  isEmailConfirmed: () => boolean;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Batched preferences state
  const [preferences, setPreferences] = useState({
    language: getDetectedLanguage(),
    currency: getDetectedCurrency(),
    meetingReminderMinutes: 30,
    commissionRate: 4.0,
    fullName: '',
    phoneNumber: null as string | null,
  });

  const ensuredUserPreferencesFor = useRef<string | null>(null);

  // Sync i18n with language state changes
  useEffect(() => {
    if (i18n.language !== preferences.language) {
      i18n.changeLanguage(preferences.language);
    }
  }, [preferences.language]);

  useEffect(() => {
    const fetchSessionAndPreferences = async () => {
      authLogger.debug('Starting auth initialization...');

      // PHASE 4: Instant Hydration via Session Cache
      // getSession() is near-instant as it reads from LocalStorage
      const { data: { session: cachedSession } } = await supabase.auth.getSession();
      
      if (cachedSession?.user) {
        authLogger.debug('Instant hydration via cached session');
        setUser(cachedSession.user);
        setSession(cachedSession);
        // We set loading to false EARLY so the UI can render
        setLoading(false);
      }

      const initialUserId = cachedSession?.user?.id;

      const promises: [Promise<any>, Promise<any>?] = [
        supabase.auth.getUser() // Silent validation in background
      ];

      if (initialUserId) {
        promises.push(
          (supabase
            .from('user_preferences')
            .select('language, currency, meeting_reminder_minutes, commission_rate, full_name, phone_number')
            .eq('user_id', initialUserId)
            .maybeSingle() as any) as Promise<any>
        );
      }

      const [userRes, prefsRes] = await Promise.all(promises);
      const { data: { user }, error } = userRes;

      if (error || !user) {
        if (error) {
          authLogger.warn('No valid user session found during silent validation', error.message);
        }
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      // Check if email is confirmed
      const emailConfirmed = user.email_confirmed_at !== null && user.email_confirmed_at !== undefined;

      if (!emailConfirmed) {
        authLogger.debug('Email not confirmed in background check, clearing session');
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      // Update state with verified user and session
      setUser(user);
      setSession(cachedSession || null);

      // Handle preferences result
      if (prefsRes && prefsRes.data) {
        const prefs = prefsRes.data;
        setPreferences({
          language: prefs.language || 'tr',
          currency: prefs.currency || 'TRY',
          meetingReminderMinutes: prefs.meeting_reminder_minutes || 30,
          commissionRate: prefs.commission_rate || 4.0,
          fullName: prefs.full_name || '',
          phoneNumber: prefs.phone_number || null,
        });
      }
      
      setLoading(false);
    };

    fetchSessionAndPreferences();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      authLogger.debug('Auth state changed', {
        event,
        hasSession: !!session,
        userId: session?.user?.id.slice(0, 8) + '...',
      });

      // Avoid redundant state updates if session is unchanged
      setUser(prevUser => {
        const newUser = session?.user ?? null;
        if (prevUser?.id === newUser?.id && event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') {
          return prevUser;
        }
        return newUser;
      });

      setSession(prevSession => {
        if (prevSession?.access_token === session?.access_token) {
          return prevSession;
        }
        return session ?? null;
      });

      if (session?.user) {
        const emailConfirmed = session.user.email_confirmed_at !== null && session.user.email_confirmed_at !== undefined;

        if (emailConfirmed) {
          if (event === "SIGNED_IN") {
            const method = localStorage.getItem("pending_login_method") || "unknown";
            localStorage.removeItem("pending_login_method");
            trackLogin(method as 'email' | 'google' | 'magic_link');

            // Clean URL hash after successful OAuth login
            if (window.location.hash) {
              // Get the clean path, ensuring we have at least '/'
              const cleanPath = window.location.pathname || '/';
              const cleanSearch = window.location.search || '';
              window.history.replaceState(null, '', cleanPath + cleanSearch);
            }
          }
        }
      } else {
        setPreferences({
          language: getDetectedLanguage(),
          currency: getDetectedCurrency(),
          meetingReminderMinutes: 30,
          commissionRate: 4.0,
          fullName: '',
          phoneNumber: null,
        });
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const ensureUserPreferences = async () => {
      const currentUserId = user?.id;

      if (!currentUserId || ensuredUserPreferencesFor.current === currentUserId) {
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

  const updateUserPreferences = useCallback(async (prefs: { language?: string; currency?: string }) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_preferences')
      .update(prefs)
      .eq('user_id', user.id)
      .select()
      .single();

    if (!data && !error) {
      await supabase.from('user_preferences').insert({ ...prefs, user_id: user.id });
    }
  }, [user?.id]);

  const setLanguage = useCallback(async (newLanguage: string) => {
    setPreferences(prev => ({ ...prev, language: newLanguage as SupportedLanguage }));
    await updateUserPreferences({ language: newLanguage });
  }, [updateUserPreferences]);

  const setCurrency = useCallback(async (newCurrency: string) => {
    setPreferences(prev => ({ ...prev, currency: newCurrency as SupportedCurrency }));
    await updateUserPreferences({ currency: newCurrency });
  }, [updateUserPreferences]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    await supabase.auth.signOut();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/confirm-email`,
      },
    });

    if (error) throw error;
    const requiresEmailConfirmation = !data.session && !!data.user;
    return { requiresEmailConfirmation };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    ensuredUserPreferencesFor.current = null;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      authLogger.error('Password update error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  }, []);

  const requestPasswordReset = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      authLogger.error('Password reset request error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  }, []);

  const changeEmail = useCallback(async (newEmail: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.updateUser(
      { email: newEmail },
      { emailRedirectTo: `${window.location.origin}/email-changed` }
    );
    if (error) {
      authLogger.error('Email change error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  }, []);

  const reauthenticate = useCallback(async (password: string): Promise<{ success: boolean; error?: string }> => {
    let email = user?.email;
    if (!email) {
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data.user?.email) {
        authLogger.error('reauthenticate getUser error:', userError);
        return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yap.' };
      }
      email = data.user.email;
    }
    if (!email) {
      return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yap.' };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      authLogger.error('reauthenticate error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  }, [user?.email]);

  const resendConfirmationEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/confirm-email`,
      },
    });
    if (error) throw error;
  }, []);

  const isEmailConfirmed = useCallback((): boolean => {
    return user?.email_confirmed_at !== null && user?.email_confirmed_at !== undefined;
  }, [user?.email_confirmed_at]);

  const signInWithGoogle = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) {
        authLogger.error('signInWithGoogle error:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error: any) {
      authLogger.error('signInWithGoogle exception:', error);
      return { success: false, error: error.message ?? 'Unknown error' };
    }
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    language: preferences.language,
    currency: preferences.currency,
    meetingReminderMinutes: preferences.meetingReminderMinutes,
    commissionRate: preferences.commissionRate,
    fullName: preferences.fullName,
    phoneNumber: preferences.phoneNumber,
    setLanguage,
    setCurrency,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    requestPasswordReset,
    changeEmail,
    reauthenticate,
    resendConfirmationEmail,
    isEmailConfirmed,
    signInWithGoogle
  }), [
    user?.id,
    session?.access_token,
    loading,
    preferences,
    setLanguage,
    setCurrency,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    requestPasswordReset,
    changeEmail,
    reauthenticate,
    resendConfirmationEmail,
    isEmailConfirmed,
    signInWithGoogle
  ]);

  return (
    <AuthContext.Provider value={value}>
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
