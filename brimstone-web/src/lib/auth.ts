// Server-side auth helpers — called at the top of every API route.
// No middleware needed. Each route explicitly opts into auth.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class SubscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubscriptionError";
  }
}

/** Create a server Supabase client using the request cookies. */
async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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
}

/**
 * Require a valid session. Throws AuthError (→ 401) if not authenticated.
 * Use this for read endpoints (flame is always viewable).
 */
export async function requireAuth() {
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new AuthError("Unauthenticated");
  }
  return user;
}

/**
 * Require an active subscription (or dev email). Throws SubscriptionError (→ 402) if not subscribed.
 * Use this for write endpoints (mutations require payment).
 */
export async function requireSubscription() {
  const user = await requireAuth();

  // Dev accounts bypass subscription check
  const devEmails = (process.env.DEV_EMAILS ?? "").split(",").map((e) => e.trim());
  if (devEmails.includes(user.email ?? "")) return user;

  // Check subscription status via service client
  const { createClient } = await import("@supabase/supabase-js");
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  );

  const { data } = await serviceClient
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .single();

  if (!data || (data.status !== "active" && data.status !== "trialing")) {
    throw new SubscriptionError("subscription_required");
  }

  return user;
}
