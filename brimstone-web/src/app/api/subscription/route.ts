// GET /api/subscription — get subscription status
import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { getSubscription } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireAuth();
    const sub = await getSubscription(user.id);
    return NextResponse.json({
      status: sub?.status ?? "inactive",
      currentPeriodEnd: sub?.current_period_end ?? null,
    });
  } catch (e: unknown) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    console.error("GET /api/subscription failed:", e);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
