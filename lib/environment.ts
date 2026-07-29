export type PublicEnvironment = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

export function validatePublicEnvironment(
  environment: NodeJS.ProcessEnv,
): PublicEnvironment {
  const supabaseUrl = environment.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const supabasePublishableKey =
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    environment.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "";

  if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL fehlt.");

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL ist keine gültige URL.");
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.hostname !== "127.0.0.1") {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL muss HTTPS verwenden.");
  }

  if (!supabasePublishableKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY oder NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt.",
    );
  }

  return { supabaseUrl, supabasePublishableKey };
}
