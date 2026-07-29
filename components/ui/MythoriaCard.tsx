import type { HTMLAttributes } from "react";

type MythoriaCardProps = HTMLAttributes<HTMLElement> & { interactive?: boolean };

export function MythoriaCard({ interactive = false, className = "", children, ...props }: MythoriaCardProps) {
  return <article {...props} className={["mythoria-card p-5 sm:p-6", interactive ? "mythoria-card-interactive" : "", className].join(" ")}>{children}</article>;
}
