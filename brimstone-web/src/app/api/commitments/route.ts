// /api/commitments — GET (list) + POST (create)
import { NextResponse } from "next/server";
import { requireAuth, requireSubscription, AuthError, SubscriptionError } from "@/lib/auth";
import { getAllCommitments, createCommitment, getTodaysCompletedIds } from "@/lib/db";
import { todayDateString, isCommitmentActiveOnDate } from "@/lib/flame-math";

export async function GET() {
  try {
    const user = await requireAuth();
    const today = todayDateString();
    const [commitments, completedIds] = await Promise.all([
      getAllCommitments(user.id),
      getTodaysCompletedIds(user.id, today),
    ]);

    // Annotate each commitment with whether it's active today
    const annotated = commitments.map((c) => ({
      ...c,
      isActiveToday: isCommitmentActiveOnDate(c, today),
    }));

    return NextResponse.json({
      commitments: annotated,
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
    const { title, frequency, recurrence_days, recurrence_dates } = await request.json();

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    const freq = frequency === "recurring" ? "recurring" : "daily";

    // Validate recurring fields
    if (freq === "recurring") {
      const hasDays = Array.isArray(recurrence_days) && recurrence_days.length > 0;
      const hasDates = Array.isArray(recurrence_dates) && recurrence_dates.length > 0;
      if (!hasDays && !hasDates) {
        return NextResponse.json(
          { error: "Recurring requires at least one day or date" },
          { status: 400 },
        );
      }
    }

    const days: number[] | null =
      Array.isArray(recurrence_days) && recurrence_days.length > 0 ? recurrence_days : null;
    const dates: number[] | null =
      Array.isArray(recurrence_dates) && recurrence_dates.length > 0 ? recurrence_dates : null;

    const id = crypto.randomUUID();
    await createCommitment(user.id, id, title.trim(), freq, days, dates);

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
