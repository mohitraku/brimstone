// POST /api/webhooks/polar — process Polar.sh subscription lifecycle events
import { NextResponse } from "next/server";
import { validateWebhookRequest } from "@/lib/polar";
import { upsertSubscription } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  );
}

async function findUserByEmail(email: string): Promise<string | null> {
  const { data } = await getServiceClient()
    .from("users")
    .select("id")
    .eq("email", email)
    .single();
  return data?.id ?? null;
}

async function findUserBySubscriptionId(polarSubId: string): Promise<string | null> {
  const { data } = await getServiceClient()
    .from("subscriptions")
    .select("user_id")
    .eq("polar_subscription_id", polarSubId)
    .single();
  return data?.user_id ?? null;
}

interface PolarCustomer {
  email?: string;
}

type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "incomplete" | "incomplete_expired";

interface PolarSubscription {
  id?: string;
  status?: SubscriptionStatus;
  currentPeriodEnd?: string;
}

interface PolarProductPrice {
  id?: string;
}

interface OrderPayload {
  customer?: PolarCustomer;
  subscription?: PolarSubscription;
  productPrice?: PolarProductPrice;
  id?: string;
}

interface SubscriptionPayload {
  id?: string;
  status?: SubscriptionStatus;
  currentPeriodEnd?: string;
}

export async function POST(request: Request) {
  const event = await validateWebhookRequest(request);
  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    switch (event.type) {
      case "order.created": {
        const payload = event.data as OrderPayload;
        const customerEmail = payload.customer?.email;
        if (customerEmail) {
          const userId = await findUserByEmail(customerEmail);
          if (userId) {
            // Use actual status from Polar — "trialing" during trial, "active" after
            await upsertSubscription(userId, {
              polar_subscription_id: payload.subscription?.id ?? payload.id,
              polar_price_id: payload.productPrice?.id,
              status: payload.subscription?.status ?? "active",
              current_period_end: payload.subscription?.currentPeriodEnd ?? null,
            });
          }
        }
        break;
      }

      case "subscription.trialing":
      case "subscription.active":
      case "subscription.updated": {
        const payload = event.data as SubscriptionPayload;
        if (payload.id) {
          const userId = await findUserBySubscriptionId(payload.id);
          if (userId) {
            await upsertSubscription(userId, {
              status: payload.status ?? "active",
              current_period_end: payload.currentPeriodEnd ?? null,
            });
          }
        }
        break;
      }

      case "subscription.canceled":
      case "subscription.revoked": {
        const payload = event.data as SubscriptionPayload;
        if (payload.id) {
          const userId = await findUserBySubscriptionId(payload.id);
          if (userId) {
            await upsertSubscription(userId, { status: "canceled" });
          }
        }
        break;
      }

      case "subscription.uncanceled": {
        const payload = event.data as SubscriptionPayload;
        if (payload.id) {
          const userId = await findUserBySubscriptionId(payload.id);
          if (userId) {
            await upsertSubscription(userId, { status: "active" });
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("Webhook processing failed:", e);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
