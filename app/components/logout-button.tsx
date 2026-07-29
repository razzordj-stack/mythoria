"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const [busy, setBusy] = useState(false); const router = useRouter();
  async function logout() { setBusy(true); await createClient().auth.signOut(); router.replace("/"); router.refresh(); }
  return <button type="button" onClick={logout} disabled={busy} className="mythoria-button-danger mt-4 w-full">{busy ? "Abmeldung …" : "Abmelden"}</button>;
}
