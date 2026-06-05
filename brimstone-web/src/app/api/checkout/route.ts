// POST /api/checkout — create Polar checkout session
import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/polar";

export async function POST() {
  try {
    const user = await requireAuth();
    const email = user.email ?? user.id;
    const url = await createCheckoutSession(email);
    return NextResponse.json({ url });
  } catch (e: unknown) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    console.error("POST /api/checkout failed:", e);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
