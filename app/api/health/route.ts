import { createClient } from "@supabase/supabase-js";
import { validatePublicEnvironment } from "@/lib/environment";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const checkedAt = new Date().toISOString();

  try {
    const { supabaseUrl, supabasePublishableKey } =
      validatePublicEnvironment(process.env);
    const supabase = createClient(supabaseUrl, supabasePublishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase
      .from("world_locations")
      .select("id", { count: "exact", head: true });

    if (error) {
      console.error("Health check: Supabase nicht erreichbar", error.message);
      return Response.json(
        {
          status: "degraded",
          services: { application: "ok", database: "error" },
          checkedAt,
        },
        { status: 503 },
      );
    }

    return Response.json({
      status: "ok",
      services: { application: "ok", database: "ok" },
      checkedAt,
    });
  } catch (error) {
    console.error(
      "Health check: Konfiguration ungültig",
      error instanceof Error ? error.message : "unknown",
    );
    return Response.json(
      {
        status: "degraded",
        services: { application: "ok", database: "error" },
        checkedAt,
      },
      { status: 503 },
    );
  }
}
