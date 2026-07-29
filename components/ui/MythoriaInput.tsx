import { forwardRef, type InputHTMLAttributes } from "react";

type MythoriaInputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: string };

export const MythoriaInput = forwardRef<HTMLInputElement, MythoriaInputProps>(function MythoriaInput({ label, error, hint, id, className = "", ...props }, ref) {
  const inputId = id ?? props.name;
  const messageId = inputId ? `${inputId}-message` : undefined;
  return <label className="block text-sm font-semibold text-[var(--mythoria-gold-light)]" htmlFor={inputId}>{label}{label && <span className="sr-only">:</span>}<input {...props} ref={ref} id={inputId} aria-invalid={Boolean(error)} aria-describedby={error || hint ? messageId : undefined} className={["mythoria-input mt-2", error ? "border-[var(--mythoria-danger)]" : "", className].join(" ")} />{(error || hint) && <span id={messageId} className={`mt-2 block text-xs ${error ? "text-red-300" : "text-[var(--mythoria-text-muted)]"}`}>{error ?? hint}</span>}</label>;
});
