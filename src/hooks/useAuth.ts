import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import { digestStringAsync, CryptoDigestAlgorithm } from "expo-crypto";

async function sha256(input: string): Promise<string> {
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, input);
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  const sendEmailOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  }, []);

  const verifyEmailOtp = useCallback(async (email: string, token: string) => {
    const cleanToken = token.trim();

    // Approach 1: short token → email OTP (raw 6-digit code)
    if (cleanToken.length <= 12) {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: cleanToken,
        type: "email",
      });
      if (!error) return;
    }

    // Approach 2: SHA256(token) → magiclink type ({{ .Token }} in template)
    const hashedToken = await sha256(cleanToken);
    const { error: hashError } = await supabase.auth.verifyOtp({
      email,
      token_hash: hashedToken,
      type: "magiclink",
    });
    if (!hashError) return;

    // Approach 3: token already is a hash → pass directly ({{ .TokenHash }} in template)
    const { error: directError } = await supabase.auth.verifyOtp({
      email,
      token_hash: cleanToken,
      type: "magiclink",
    });
    if (directError) throw directError;
  }, []);

  const sendPhoneOtp = useCallback(async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  }, []);

  const verifyPhoneOtp = useCallback(async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return {
    session,
    user,
    isLoading,
    isAuthenticated: !!user,
    sendEmailOtp,
    verifyEmailOtp,
    sendPhoneOtp,
    verifyPhoneOtp,
    signOut,
  };
}