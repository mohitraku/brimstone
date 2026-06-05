// POST /api/portal — create Polar customer portal session
import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { getSubscription } from "@/lib/db";
import { createPortalSession } from "@/lib/polar";

export async function POST() {
  try {
    const user = await requireAuth();

    const sub = await getSubscription(user.id);
    if (!sub?.polar_subscription_id) {
      return NextResponse.json({ error: "No subscription" }, { status: 404 });
    }

    const url = await createPortalSession(sub.polar_subscription_id);
    return NextResponse.json({ url });
  } catch (e: unknown) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    console.error("POST /api/portal failed:", e);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
