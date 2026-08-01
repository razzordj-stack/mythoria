export type NavigationItem = {
  label: string;
  icon: string;
  href?: string;
  match?: "exact" | "prefix";
};
export const dashboardNavigation: NavigationItem[] = [
  { label: "Dashboard", icon: "⌂", href: "/dashboard", match: "exact" },
  {
    label: "Charaktere",
    icon: "♙",
    href: "/dashboard/characters",
    match: "prefix",
  },
  { label: "Quests", icon: "◇" },
  { label: "Abenteuer", icon: "✦" },
  { label: "Weltkarte", icon: "⌖", href: "/dashboard/world", match: "prefix" },
  {
    label: "Erfolge",
    icon: "★",
    href: "/dashboard/achievements",
    match: "prefix",
  },
  { label: "Markenshop", icon: "M", href: "/dashboard/shop", match: "prefix" },
  { label: "Premium", icon: "✦", href: "/dashboard/premium", match: "prefix" },
  { label: "Gemeinschaft", icon: "♧", href: "/dashboard/social", match: "prefix" },
  { label: "Meldungen", icon: "◇", href: "/dashboard/notifications", match: "prefix" },
  { label: "Administration", icon: "♜", href: "/dashboard/admin", match: "prefix" },
  { label: "Profil", icon: "◉", href: "/dashboard/profile", match: "prefix" },
  {
    label: "Einstellungen",
    icon: "⚙",
    href: "/dashboard/settings",
    match: "prefix",
  },
];
export function isNavigationItemActive(pathname: string, item: NavigationItem) {
  if (!item.href) return false;
  return item.match === "exact"
    ? pathname === item.href
    : pathname.startsWith(item.href);
}
