"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { MythoriaSpinner } from "./MythoriaSpinner";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "gold";

type MythoriaButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  icon?: ReactNode;
};

const variants: Record<Variant, string> = {
  primary: "mythoria-button-primary",
  secondary: "mythoria-button-secondary",
  ghost: "border border-transparent bg-transparent text-[var(--mythoria-text-secondary)] hover:border-[var(--mythoria-border)] hover:bg-[var(--mythoria-surface-light)]",
  danger: "mythoria-button-danger",
  gold: "border border-[var(--mythoria-gold-light)] bg-[var(--mythoria-gold-gradient)] text-[var(--mythoria-black)] shadow-[0_8px_26px_rgba(162,157,114,0.18)] hover:brightness-110",
};

export function MythoriaButton({ variant = "primary", loading = false, icon, className = "", disabled, children, ...props }: MythoriaButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={["inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50", variants[variant], className].join(" ")}
    >
      {loading ? <MythoriaSpinner size="small" label="" /> : icon}
      {children}
    </button>
  );
}
