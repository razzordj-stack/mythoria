import { describe, expect, it } from "vitest";
import { validatePublicEnvironment } from "./environment";

describe("validatePublicEnvironment", () => {
  it("akzeptiert eine vollständige HTTPS-Konfiguration", () => {
    expect(
      validatePublicEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
      }),
    ).toEqual({
      supabaseUrl: "https://example.supabase.co",
      supabasePublishableKey: "publishable-key",
    });
  });

  it("verwirft fehlende Werte und unsicheres Produktions-HTTP", () => {
    expect(() => validatePublicEnvironment({})).toThrow(/URL fehlt/);
    expect(() =>
      validatePublicEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: "http://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
      }),
    ).toThrow(/HTTPS/);
  });

  it("unterstützt bestehende Projekte mit dem älteren Anon-Key-Namen", () => {
    expect(
      validatePublicEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "legacy-anon-key",
      }).supabasePublishableKey,
    ).toBe("legacy-anon-key");
  });
});
