import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return Response.json({ error: "Du bist nicht angemeldet." }, { status: 401 });

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;
  const appUrl = process.env.APP_URL;
  if (!secretKey || !priceId || !appUrl)
    return Response.json({ error: "Premium-Checkout ist noch nicht konfiguriert." }, { status: 503 });

  const form = new URLSearchParams({
    mode: "subscription",
    client_reference_id: authData.user.id,
    success_url: `${appUrl}/dashboard/premium?checkout=success`,
    cancel_url: `${appUrl}/dashboard/premium?checkout=canceled`,
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
  });
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  const payload = (await response.json()) as { url?: string };
  if (!response.ok || !payload.url)
    return Response.json({ error: "Der Premium-Checkout konnte nicht gestartet werden." }, { status: 502 });
  return Response.json({ url: payload.url });
}
