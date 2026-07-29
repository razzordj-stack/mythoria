import nextEnvironment from "@next/env";

const { loadEnvConfig } = nextEnvironment;

loadEnvConfig(process.cwd());

const required = ["NEXT_PUBLIC_SUPABASE_URL"];
const missing = required.filter((name) => !process.env[name]?.trim());

if (
  !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() &&
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
) {
  missing.push(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (oder NEXT_PUBLIC_SUPABASE_ANON_KEY)",
  );
}

if (missing.length > 0) {
  console.error(`Fehlende Umgebungsvariablen: ${missing.join(", ")}`);
  process.exit(1);
}

let supabaseUrl;
try {
  supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
} catch {
  console.error("NEXT_PUBLIC_SUPABASE_URL ist keine gültige URL.");
  process.exit(1);
}

if (supabaseUrl.protocol !== "https:" && supabaseUrl.hostname !== "127.0.0.1") {
  console.error("NEXT_PUBLIC_SUPABASE_URL muss außerhalb lokaler Entwicklung HTTPS verwenden.");
  process.exit(1);
}

const providerConfigured = Boolean(
  process.env.OPENROUTER_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim(),
);
console.log("Pflichtvariablen sind gültig.");
console.log(
  providerConfigured
    ? "Ein optionaler KI-Provider ist konfiguriert."
    : "Kein KI-Provider konfiguriert (für die aktuelle Release-Phase zulässig).",
);
