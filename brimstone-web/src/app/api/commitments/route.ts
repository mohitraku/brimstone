// /api/commitments — GET (list) + POST (create)
import { NextResponse } from "next/server";
import { requireAuth, requireSubscription, AuthError, SubscriptionError } from "@/lib/auth";
import { getAllCommitments, createCommitment, getTodaysCompletedIds } from "@/lib/db";
import { todayDateString } from "@/lib/flame-math";

export async function GET() {
  try {
    const user = await requireAuth();
    const today = todayDateString();
    const [commitments, completedIds] = await Promise.all([
      getAllCommitments(user.id),
      getTodaysCompletedIds(user.id, today),
    ]);

    return NextResponse.json({
      commitments,
      completedIds: [...completedIds],
    });
  } catch (e: unknown) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    console.error("GET /api/commitments failed:", e);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSubscription();
    const { title, frequency, icon } = await request.json();

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    await createCommitment(
      user.id,
      id,
      title.trim(),
      frequency ?? "daily",
      icon ?? null,
    );

    return NextResponse.json({ id }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    if (e instanceof SubscriptionError) {
      return NextResponse.json({ error: "subscription_required" }, { status: 402 });
    }
    console.error("POST /api/commitments failed:", e);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
