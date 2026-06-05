// DELETE /api/commitments/[id] — soft-delete an oath
import { NextResponse } from "next/server";
import { requireSubscription, AuthError, SubscriptionError } from "@/lib/auth";
import { deleteCommitment } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSubscription();
    const { id } = await params;
    await deleteCommitment(id);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    if (e instanceof SubscriptionError) {
      return NextResponse.json({ error: "subscription_required" }, { status: 402 });
    }
    console.error("DELETE /api/commitments/[id] failed:", e);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
