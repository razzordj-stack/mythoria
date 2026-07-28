import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
    const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
        throw new Error(
            "NEXT_PUBLIC_SUPABASE_URL fehlt in den Umgebungsvariablen.",
        );
    }

    if (!supabaseKey) {
        throw new Error(
            "NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt in den Umgebungsvariablen.",
        );
    }

    return createBrowserClient(
        supabaseUrl,
        supabaseKey,
    );
}