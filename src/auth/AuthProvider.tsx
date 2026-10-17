import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { sr } from '../i18n/sr';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type Result = { error?: string; info?: string };

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<Result>;
  signUp: (fullName: string, email: string, password: string) => Promise<Result>;
  signInWithGoogle: () => Promise<Result>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function translateError(message: string): string {
  const m = message.toLowerCase();
  const e = sr.auth.errors;
  if (m.includes('invalid login credentials')) return e.invalidCredentials;
  if (m.includes('already registered') || m.includes('already exists')) return e.emailTaken;
  if (m.includes('email not confirmed')) return e.emailNotConfirmed;
  if (m.includes('rate limit') || m.includes('too many')) return e.rateLimit;
  if (m.includes('password')) return `${e.weakPassword} (${message})`;
  if (m.includes('signup') && m.includes('disabled')) return e.signupDisabled;
  if (m.includes('invalid') && m.includes('email')) return e.invalidEmail;
  if (m.includes('failed to fetch') || m.includes('network')) return e.network;
  // Keep the original text visible so unexpected server errors can be diagnosed.
  return `${e.generic} (${message})`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const value: AuthContextValue = {
    session,
    loading,

    async signIn(email, password) {
      if (!supabase) return { error: sr.auth.errors.notConfigured };
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? { error: translateError(error.message) } : {};
    },

    async signUp(fullName, email, password) {
      if (!supabase) return { error: sr.auth.errors.notConfigured };
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName }, emailRedirectTo: Linking.createURL('/') },
      });
      if (error) return { error: translateError(error.message) };
      // With email confirmation on, Supabase returns no session until the link is clicked.
      return data.session ? {} : { info: sr.auth.checkEmail };
    },

    async signInWithGoogle() {
      if (!supabase) return { error: sr.auth.errors.notConfigured };
      const redirectTo = Linking.createURL('/');

      if (Platform.OS === 'web') {
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
        return error ? { error: translateError(error.message) } : {};
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data.url) return { error: sr.auth.errors.generic };

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success') return {};
      const code = new URL(result.url).searchParams.get('code');
      if (!code) return { error: sr.auth.errors.generic };
      const exchange = await supabase.auth.exchangeCodeForSession(code);
      return exchange.error ? { error: translateError(exchange.error.message) } : {};
    },

    async signOut() {
      await supabase?.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
