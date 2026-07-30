import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { PageBackground } from "@/components/layout/PageBackground";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const email = user.email ?? "Unbekannter Abenteurer";
  const displayName = typeof user.user_metadata.display_name === "string" ? user.user_metadata.display_name : undefined;
  return <div className="mythoria-page dashboard-studio min-h-screen lg:pl-[280px]"><PageBackground /><DashboardSidebar email={email} displayName={displayName} /><MobileNavigation email={email} displayName={displayName} /><div className="dashboard-content min-w-0">{children}</div></div>;
}
