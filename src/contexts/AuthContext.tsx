import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import i18n from '../i18n';
import { trackLogin } from '../utils/gtm';

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
      console.log('🔍 [AuthContext] Starting auth initialization...');

      // IMPORTANT: Use getUser() instead of getSession()
      // getSession() only reads from browser cache (can be fake/stale)
      // getUser() actually asks Supabase server "is this user real and confirmed?"
      const { data: { user }, error } = await supabase.auth.getUser();

      console.log('🔍 [AuthContext] getUser() result:', {
        hasUser: !!user,
        userId: user?.id,
        email: user?.email,
        emailConfirmedAt: user?.email_confirmed_at,
        error: error?.message,
      });

      // If there's an error or no user, clear everything
      if (error || !user) {
        console.log('❌ [AuthContext] No valid user, clearing session');
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      // Check if email is confirmed
      const emailConfirmed = user.email_confirmed_at !== null && user.email_confirmed_at !== undefined;

      console.log('📧 [AuthContext] Email confirmation check:', {
        emailConfirmed,
        email_confirmed_at: user.email_confirmed_at,
      });

      // If email NOT confirmed, don't set user as logged in
      if (!emailConfirmed) {
        console.log('⚠️ [AuthContext] Email not confirmed, clearing session');
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      // Email is confirmed! Now get the full session
      const { data: { session } } = await supabase.auth.getSession();

      console.log('✅ [AuthContext] User authenticated! Setting session:', {
        userId: user.id,
        email: user.email,
        hasAccessToken: !!session?.access_token,
        accessTokenLength: session?.access_token?.length,
        expiresAt: session?.expires_at,
      });

      setSession(session);
      setUser(user);

      // Load user preferences
      if (user) {
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('language, currency, meeting_reminder_minutes, commission_rate')
          .eq('user_id', user.id)
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 [AuthContext] Auth state changed:', {
        event,
        hasSession: !!session,
        userId: session?.user?.id,
        emailConfirmedAt: session?.user?.email_confirmed_at,
      });

      // Check if email is confirmed before setting session
      if (session?.user) {
        const emailConfirmed = session.user.email_confirmed_at !== null && session.user.email_confirmed_at !== undefined;

        console.log('🔍 [AuthContext] onAuthStateChange - Email check:', {
          emailConfirmed,
          userId: session.user.id,
        });

        // Only set session if email is confirmed
        if (emailConfirmed) {
          console.log('✅ [AuthContext] Setting authenticated user in state');
          setSession(session);
          setUser(session.user);

          if (event === "SIGNED_IN") {
            const method = localStorage.getItem("pending_login_method") || "unknown";
            localStorage.removeItem("pending_login_method");
            trackLogin(method as 'email' | 'google' | 'magic_link');
          }
        } else {
          // Email not confirmed, don't set session
          console.log('⚠️ [Auth] Email not confirmed in auth state change');
          setSession(null);
          setUser(null);
        }
      } else {
        // No session, clear everything
        console.log('❌ [AuthContext] No session, clearing all state');
        setSession(null);
        setUser(null);
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
    // IMPORTANT: Clear any old sessions before signing up
    // This prevents "fake sessions" from sticking around
    await supabase.auth.signOut();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/confirm-email`,
      },
    });

    if (error) throw error;

    // Check if email confirmation is required
    // When email confirmation is enabled, Supabase returns user but no session
    const requiresEmailConfirmation = !data.session && !!data.user;

    return { requiresEmailConfirmation };
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

  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Password update error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error('Password reset request error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const changeEmail = async (newEmail: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.updateUser(
      { email: newEmail },
      { emailRedirectTo: `${window.location.origin}/email-changed` }
    );

    if (error) {
      console.error('Email change error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const reauthenticate = async (password: string): Promise<{ success: boolean; error?: string }> => {
    // Get current user's email from state or fetch it
    let email = user?.email;

    if (!email) {
      const { data, error: userError } = await supabase.auth.getUser();

      if (userError || !data.user?.email) {
        console.error('[Auth] reauthenticate getUser error:', userError);
        return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yap.' };
      }

      email = data.user.email;
    }

    if (!email) {
      return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yap.' };
    }

    // Verify password by attempting to sign in
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[Auth] reauthenticate error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const resendConfirmationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/confirm-email`,
      },
    });

    if (error) throw error;
  };

  const isEmailConfirmed = (): boolean => {
    // Check if user exists and email is confirmed
    // In Supabase, user.email_confirmed_at is set when email is confirmed
    return user?.email_confirmed_at !== null && user?.email_confirmed_at !== undefined;
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error('[Auth] signInWithGoogle error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('[Auth] signInWithGoogle exception:', error);
      return { success: false, error: error.message ?? 'Unknown error' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, language, currency, meetingReminderMinutes, commissionRate, setLanguage, setCurrency, signIn, signUp, signOut, resetPassword, updatePassword, requestPasswordReset, changeEmail, reauthenticate, resendConfirmationEmail, isEmailConfirmed, signInWithGoogle }}>
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
