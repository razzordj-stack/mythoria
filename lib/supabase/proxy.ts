import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./config";
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = getSupabaseConfig();
  const supabase = createServerClient(url, key, { cookies: {
    getAll: () => request.cookies.getAll(),
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    },
  }});
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  if (!user && path.startsWith("/dashboard")) {
    const loginUrl = request.nextUrl.clone(); loginUrl.pathname = "/login"; loginUrl.searchParams.set("next", path); return NextResponse.redirect(loginUrl);
  }
  if (user) {
    const { data: moderation } = await supabase.from("user_moderation").select("status").eq("user_id", user.id).maybeSingle();
    const restricted = moderation?.status === "suspended" || moderation?.status === "banned";
    if (restricted && path !== "/account-restricted") return NextResponse.redirect(new URL("/account-restricted", request.url));
    if (!restricted && path === "/account-restricted") return NextResponse.redirect(new URL("/dashboard", request.url));
    if (!restricted && ["/login", "/register"].includes(path)) return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return response;
}
