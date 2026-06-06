// POST /api/auth/login — send magic link
// Always uses createServerClient so the PKCE code verifier is stored in cookies.
// For dev emails, uses the service-role (secret) key to bypass email confirmation.
// For regular users, uses the publishable key — respects Supabase email confirmation.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const devEmails = (process.env.DEV_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const normalized = email.trim().toLowerCase();
  const isDev = devEmails.includes(normalized);

  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;
  const cookieStore = await cookies();

  // Always use createServerClient so the PKCE code verifier is stored in cookies.
  // Without this, the callback's exchangeCodeForSession can't find the verifier
  // and the session won't be set.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    isDev
      ? process.env.SUPABASE_SECRET_KEY!     // Dev: service-role → bypasses email confirmation
      : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,  // Regular: respects confirmation
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  const result = await supabase.auth.signInWithOtp({
    email: normalized,
    options: { emailRedirectTo: redirectTo },
  });

  if (result.error) {
    console.error("Login error:", result.error.message);
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
