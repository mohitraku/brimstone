// POST   /api/commitments/[id]/complete — mark an oath completed today
// DELETE /api/commitments/[id]/complete — undo a completion
import { NextResponse } from "next/server";
import { requireSubscription, AuthError, SubscriptionError } from "@/lib/auth";
import {
  getFlameState,
  updateFlameState,
  getAllCommitments,
  insertEmber,
  deleteEmber,
} from "@/lib/db";
import {
  completionIntensityGain,
  calculateFlameIntensity,
  todayDateString,
} from "@/lib/flame-math";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSubscription();
    const { id: commitmentId } = await params;

    const state = await getFlameState(user.id);
    if (!state) {
      return NextResponse.json({ error: "No flame state" }, { status: 500 });
    }

    const today = todayDateString();
    const all = await getAllCommitments(user.id);
    const gain = completionIntensityGain(all.length);

    // Insert ember
    await insertEmber(user.id, commitmentId, gain, today);

    // Calculate new intensity — count today's completions AFTER inserting
    const { getTodaysCompletedIds } = await import("@/lib/db");
    const completedIds = await getTodaysCompletedIds(user.id, today);
    const intensity = calculateFlameIntensity(
      completedIds.size,
      all.length,
      state.streak_days,
    );

    await updateFlameState(user.id, {
      flame_intensity: intensity,
      last_completion_date: new Date().toISOString(),
    });

    return NextResponse.json({ flameIntensity: intensity });
  } catch (e: unknown) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    if (e instanceof SubscriptionError) {
      return NextResponse.json({ error: "subscription_required" }, { status: 402 });
    }
    console.error("POST /api/commitments/[id]/complete failed:", e);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSubscription();
    const { id: commitmentId } = await params;
    const today = todayDateString();

    // Remove today's ember (idempotent — ok if already gone)
    await deleteEmber(user.id, commitmentId, today);

    // Recalculate intensity
    const state = await getFlameState(user.id);
    const all = await getAllCommitments(user.id);
    const { getTodaysCompletedIds } = await import("@/lib/db");
    const completedIds = await getTodaysCompletedIds(user.id, today);
    const intensity = calculateFlameIntensity(
      completedIds.size,
      all.length,
      state?.streak_days ?? 0,
    );

    await updateFlameState(user.id, {
      flame_intensity: intensity,
      last_completion_date: new Date().toISOString(),
    });

    return NextResponse.json({ flameIntensity: intensity });
  } catch (e: unknown) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    if (e instanceof SubscriptionError) {
      return NextResponse.json({ error: "subscription_required" }, { status: 402 });
    }
    console.error("DELETE /api/commitments/[id]/complete failed:", e);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
