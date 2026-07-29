import type { HTMLAttributes } from "react";
export function MythoriaSkeleton({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) { return <div {...props} aria-hidden="true" className={["animate-pulse rounded-xl border border-[var(--mythoria-border)]/40 bg-[var(--mythoria-surface-light)]", className].join(" ")} />; }
