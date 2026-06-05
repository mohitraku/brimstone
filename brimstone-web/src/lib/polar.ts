// Server-side Polar.sh helpers — checkout, portal, webhook verification.
import { Polar } from "@polar-sh/sdk";

function getClient() {
  return new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
  });
}

/** Create a checkout session. Returns the URL to redirect to. */
export async function createCheckoutSession(email: string): Promise<string> {
  const polar = getClient();
  const productId = process.env.POLAR_PRODUCT_ID!;

  const result = await polar.checkouts.create({
    products: [productId],
    customerEmail: email,
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/?checkout=success`,
  });

  return result.url ?? `${process.env.NEXT_PUBLIC_APP_URL}/`;
}

/** Create a customer portal session. Returns the URL to redirect to. */
export async function createPortalSession(customerId: string): Promise<string> {
  const polar = getClient();

  const result = await polar.customerSessions.create({
    customerId,
  });

  return result.customerPortalUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/`;
}

/**
 * Validate a Polar.sh webhook request.
 * Returns the parsed payload with type and data, or null if validation fails.
 */
export async function validateWebhookRequest(
  request: Request,
): Promise<{ type: string; data: unknown } | null> {
  const polar = getClient();
  try {
    const payload = await polar.validateWebhook({ request });
    // Each payload has a `type` discriminant and a `data` field
    const typed = payload as { type: string; data: unknown };
    return { type: typed.type, data: typed.data };
  } catch {
    return null;
  }
}
