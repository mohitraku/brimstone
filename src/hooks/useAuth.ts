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

    // Short token (6-12 chars) → try email OTP type first
    if (cleanToken.length <= 12) {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: cleanToken,
        type: "email",
      });
      if (!error) return;
      console.log("[verifyEmailOtp] email type failed, trying magiclink:", error.message);
    }

    // Long token or OTP type failed → try magiclink with SHA256 hash
    const tokenHash = await sha256(cleanToken);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token_hash: tokenHash,
      type: "magiclink",
    });
    if (error) throw error;
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