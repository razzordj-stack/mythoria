import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type StripeEvent = { type?: string; data?: { object?: Record<string, unknown> } };

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();
  if (!secret || !signature || !verifyStripeSignature(body, signature, secret))
    return Response.json({ error: "Invalid Stripe signature." }, { status: 400 });

  let event: StripeEvent;
  try { event = JSON.parse(body) as StripeEvent; } catch { return Response.json({ error: "Invalid event." }, { status: 400 }); }
  const object = event.data?.object;
  if (!object) return Response.json({ received: true });

  const admin = createAdminClient();
  if (event.type === "checkout.session.completed") {
    const userId = stringValue(object.client_reference_id);
    const customerId = stringValue(object.customer);
    const subscriptionId = stringValue(object.subscription);
    if (userId && subscriptionId) await admin.from("player_memberships").upsert({ user_id: userId, tier: "premium", status: "active", provider: "stripe", stripe_customer_id: customerId, stripe_subscription_id: subscriptionId, updated_at: new Date().toISOString() });
  }
  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscriptionId = stringValue(object.id);
    if (subscriptionId) {
      const status = event.type === "customer.subscription.deleted" ? "canceled" : subscriptionStatus(stringValue(object.status));
      const periodEnd = numberValue(object.current_period_end);
      await admin.from("player_memberships").update({ status, current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null, updated_at: new Date().toISOString() }).eq("stripe_subscription_id", subscriptionId);
    }
  }
  return Response.json({ received: true });
}

export function verifyStripeSignature(body: string, header: string, secret: string) {
  const timestamp = header.split(",").find((part) => part.startsWith("t="))?.slice(2);
  const signature = header.split(",").find((part) => part.startsWith("v1="))?.slice(3);
  if (!timestamp || !signature || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");
  return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
}
function stringValue(value: unknown) { return typeof value === "string" ? value : null; }
function numberValue(value: unknown) { return typeof value === "number" ? value : null; }
function subscriptionStatus(value: string | null) { return value === "trialing" ? "trialing" : value === "active" ? "active" : value === "past_due" ? "past_due" : "expired"; }
